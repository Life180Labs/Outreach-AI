import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import prisma from './prisma';
import type { Lead, Campaign, Settings, EmailDraft } from '@/types';

/**
 * Generates a personalized email draft for a lead using the configured AI provider.
 * Accepts optional settings to avoid redundant DB queries during batch processing.
 */
export async function generateEmailDraft(
  lead: Lead,
  campaign: Campaign | null,
  userFeedback: string = "",
  cachedSettings?: Settings | null
): Promise<EmailDraft> {
  const settings = cachedSettings ?? await prisma.settings.findUnique({ where: { id: "global" } });

  if (!settings) {
    throw new Error("AI settings not configured. Go to Settings to add an API key.");
  }

  return runGeneration(lead, campaign, settings, userFeedback);
}

export async function testEmailGeneration(
  promptOverride: string,
  leadNotes: string,
  cachedSettings?: Settings | null
): Promise<EmailDraft> {
  const settings = cachedSettings ?? await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) throw new Error("Settings not found");

  const mockLead = {
    firstName: "Test",
    lastName: "User",
    companyName: "Test Co",
    jobTitle: "CEO",
    notes: leadNotes,
  } as Lead;

  const mockCampaign = {
    context: promptOverride,
    tone: "Professional",
    cta: "Book a call",
  } as any;

  return runGeneration(mockLead, mockCampaign, settings, "", promptOverride);
}

async function runGeneration(
  lead: Lead,
  campaign: Campaign | null,
  settings: Settings,
  userFeedback: string = "",
  promptOverride?: string
): Promise<EmailDraft> {
  let draft: EmailDraft;

  if (settings.aiProvider === "openai" && settings.openaiApiKey) {
    draft = await generateWithOpenAI(lead, campaign, settings.openaiApiKey, userFeedback, promptOverride || settings.basePrompt || undefined);
  } else if (settings.aiProvider === "claude" && settings.claudeApiKey) {
    draft = await generateWithClaude(lead, campaign, settings.claudeApiKey, userFeedback, promptOverride || settings.basePrompt || undefined);
  } else if (settings.aiProvider === "groq" && settings.groqApiKey) {
    draft = await generateWithGroq(lead, campaign, settings.groqApiKey, userFeedback, promptOverride || settings.basePrompt || undefined);
  } else {
    if (!settings.geminiApiKey) {
      throw new Error("Gemini API Key is not configured (Default Provider)");
    }
    draft = await generateWithGemini(lead, campaign, settings.geminiApiKey, userFeedback, promptOverride || settings.basePrompt || undefined);
  }

  // ─── Post-Process Draft ───
  // Fail-safe: Ensure greeting is present if AI skipped it
  const firstName = lead.firstName ? lead.firstName.charAt(0).toUpperCase() + lead.firstName.slice(1).toLowerCase() : "there";
  const expectedGreetingStart = `Hi ${firstName}`;
  
  if (draft.body && !draft.body.trim().startsWith("Hi ")) {
    draft.body = `Hi ${firstName},\n\n${draft.body.trim()}`;
  } else if (draft.body && draft.body.trim().startsWith("Hi ") && !draft.body.includes(firstName)) {
    // Correct wrong name if needed
    draft.body = draft.body.replace(/^Hi\s+[^,]+,/i, `Hi ${firstName},`);
  }

  // Ensure double newlines between paragraphs for impact
  if (draft.body) {
    draft.body = draft.body
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '\n\n') // Normalize existing double newlines
      .replace(/^(Hi\s+[^,]+,)\s*/i, '$1\n\n'); // Force break after greeting
  }

  return {
    ...draft,
    rationale: `[${settings.aiProvider || 'gemini'}] ${draft.rationale}`,
  };
}

function getPrompts(lead: Lead, campaign: Campaign | null, userFeedback: string = "", basePromptOverride?: string) {
  // Ensure the name is formatted properly for the prompt instructions
  const firstName = lead.firstName
    ? lead.firstName.charAt(0).toUpperCase() + lead.firstName.slice(1).toLowerCase()
    : "there";

  // If the campaign has a strategy, use its fields
  const strategy = (campaign as any)?.strategy;

  const role = strategy?.role || "world-class B2B cold email copywriter";
  const product = strategy?.product || "B2B Services";
  const persona = strategy?.persona || "relevant professional";
  const painPoint = strategy?.painPoint || "inefficiency";
  const socialProof = strategy?.socialProof || "";
  const tone = strategy?.tone || campaign?.tone || 'Professional';
  const cta = strategy?.cta || campaign?.cta || 'Book a call';

  const systemPrompt = (basePromptOverride || `You are an elite ${role}. 
Your goal is to write hyper-personalized, high-converting outreach emails that feel 100% human and 0% automated.

CRITICAL INSTRUCTIONS:
1. NO ROBOTIC OPENERS: Never start with "As a [Job Title]" or "I see you're the [Job Title]". This is a massive AI giveaway.
2. ANCHOR IN NOTES: Use the "Lead Notes" to find a specific, human hook. Mention a recent post, a specific skill, or a personal detail.
3. ONE-SENTENCE VALUE: Explain how ${product} helps in exactly one sentence. No list of features.
4. NO KEYWORD STUFFING: Do not repeat the same industry term (e.g. "AI Ops") more than twice in the entire email.`) + 
`

UNIVERSAL QUALITY CONSTRAINTS (MANDATORY):
1. CTA WEAVING: If the CTA is "${cta}", you MUST weave it into a natural, interest-based question. 
   - BAD: "Book a call"
   - GOOD: "Open to a brief sync on how we're solving [Pain Point] for others?" or "Worth a quick look at the deck?"
2. CAPITALIZATION: Every sentence MUST start with a capital letter.
3. STRUCTURE: Every section MUST be separated by EXACTLY TWO newlines ("\n\n") for high-impact spacing:
   - SECTION 1: "Hi ${firstName},"
   - SECTION 2: Opening Hook (Personalized/Human based on Lead Notes).
   - SECTION 3: The Connection/Value (Peer-to-peer connection to strategy).
   - SECTION 4: The Ask (Professional question based on CTA).
4. DO NOT INCLUDE SIGN-OFF: Stop immediately after the CTA question. No "Best regards".

IMPORTANT: Your response MUST be a valid JSON object:
{
  "subject": "A short, curiosity-driven subject line (no emojis)",
  "body": "The full email body starting from 'Hi ${firstName},' and ending with the CTA question.",
  "rationale": "Why this specific hook works"
}`;

  const userPrompt = `Lead Name: ${lead.firstName} ${lead.lastName}
Lead Company: ${lead.companyName}
Lead Title: ${lead.jobTitle}
Lead Notes: ${lead.notes || 'No specific notes'}

--- CAMPAIGN STRATEGY ---
Product: ${product}
Target Persona: ${persona}
Core Pain Point: ${painPoint}
Social Proof: ${socialProof}
Context: ${campaign?.context || 'Start a conversation'}
Tone: ${tone}
CTA: ${cta}

${userFeedback ? `REVISION FEEDBACK: ${userFeedback}` : ''}

TASK:
Write the email body now. 
1. START WITH GREETING: You MUST start the "body" with "Hi ${firstName},".
2. Use the "Lead Notes" as the primary anchor for personalization.
3. Follow the "Strategy/Context" provided above.
4. Stop immediately after the final period of your CTA. DO NOT WRITE "Best regards", "Sincerely", your name, or ANY other sign-off. The system handles the signature.
Output JSON ONLY.`;

  return { systemPrompt, userPrompt };
}

const FALLBACK_DRAFT: EmailDraft = {
  subject: "Drafting Failed",
  body: "Could not generate draft. Please try again or switch AI provider.",
  rationale: "Generation error — check API key and provider settings",
};

/**
 * Utility to clean AI response text and parse as JSON
 */
function safeParseJSON(text: string): any {
  if (!text) return {};
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI JSON:", cleaned.substring(0, 200));
    return {};
  }
}

function safeParseDraft(text: string): EmailDraft {
  const parsed = safeParseJSON(text);
  if (!parsed.subject || !parsed.body) {
    return { ...FALLBACK_DRAFT, rationale: "AI returned incomplete JSON" };
  }
  return parsed as EmailDraft;
}

async function generateWithOpenAI(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = "", promptOverride?: string): Promise<EmailDraft> {
  const openai = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback, promptOverride);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    return safeParseDraft(response.choices[0].message.content || "{}");
  } catch (e) {
    console.error("[OpenAI] Generation failed:", e);
    return { ...FALLBACK_DRAFT, rationale: "OpenAI API error" };
  }
}

async function generateWithClaude(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = "", promptOverride?: string): Promise<EmailDraft> {
  const anthropic = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback, promptOverride);

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.8,
    });

    const block = response.content[0];
    const content = block.type === 'text' ? block.text : "{}";
    return safeParseDraft(content);
  } catch (e) {
    console.error("[Claude] Generation failed:", e);
    return { ...FALLBACK_DRAFT, rationale: "Claude API error" };
  }
}

async function generateWithGemini(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = "", promptOverride?: string): Promise<EmailDraft> {
  const ai = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback, promptOverride);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `${systemPrompt}\n\n${userPrompt}`,
    });

    return safeParseDraft(response.text || '{}');
  } catch (e) {
    console.error("[Gemini] Generation failed:", e);
    return { ...FALLBACK_DRAFT, rationale: "Gemini API error" };
  }
}

async function generateWithGroq(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = "", promptOverride?: string): Promise<EmailDraft> {
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback, promptOverride);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Groq] API error:", err);
      return { ...FALLBACK_DRAFT, rationale: `Groq API error: ${response.status}` };
    }

    const data = await response.json();
    return safeParseDraft(data.choices[0].message.content);
  } catch (e) {
    console.error("[Groq] Generation failed:", e);
    return { ...FALLBACK_DRAFT, rationale: "Groq API error" };
  }
}

export async function refinePromptWithAI(prompt: string, provider?: string, apiKey?: string): Promise<any> {
  if (!apiKey) throw new Error("API key missing for refinement");

  const actualProvider = provider || "gemini";

  try {
    if (actualProvider === "openai") {
      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return safeParseJSON(res.choices[0].message.content || "");
    }

    if (actualProvider === "groq") {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        }),
      });
      
      if (!response.ok) throw new Error(`Groq refinement failed: ${response.status}`);
      const data = await response.json();
      return safeParseJSON(data.choices[0].message.content || "");
    }

    // Default to Gemini
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return safeParseJSON(response.text || "");
  } catch (e) {
    console.error(`[Refine] ${actualProvider} failed:`, e);
    return {};
  }
}

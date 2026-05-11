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

  const systemPrompt = (basePromptOverride || `You are a world-class B2B cold email copywriter. 
Your goal is to write hyper-personalized, high-converting outreach emails that feel 100% human and 0% automated.

CRITICAL INSTRUCTIONS:
1. USE LEAD NOTES: You MUST anchor the email's hook in the specific "Lead Notes" provided. This is your primary source of personalization.
2. USE CAMPAIGN STRATEGY: Align your tone, value proposition, and call-to-action with the "AI Author Prompt" (Campaign Context).
3. STYLE & TONE: Use a peer-to-peer, conversational tone. No "I hope this finds you well". No marketing jargon like "synergy" or "cutting-edge".`) + 
`

UNIVERSAL QUALITY CONSTRAINTS (MANDATORY):
1. CTA PROFESSIONALISM: If the CTA is "Book a call", DO NOT just write "Book a call". Instead, craft a professional, low-friction question like "Would you be open to a brief chat?" or "Worth a quick look?".
2. CAPITALIZATION: Every sentence MUST start with a capital letter.
3. STRUCTURE: Every section MUST be separated by EXACTLY TWO newlines ("\\n\\n"):
   - SECTION 1: "Hi ${firstName},"
   - SECTION 2: Opening Hook (Personalized based on Lead Notes).
   - SECTION 3: The Value (Connection to our business based on Campaign Strategy).
   - SECTION 4: The Ask (Professional, low-friction CTA).
4. DO NOT INCLUDE SIGN-OFF: Write ONLY the body. Stop immediately after the CTA. No "Best regards".

IMPORTANT: Your response MUST be a valid JSON object:
{
  "subject": "A curiosity-driven subject line",
  "body": "The full email body starting from 'Hi ${firstName},' and ending with the CTA.",
  "rationale": "A brief explanation of the personalization strategy used"
}`;

  const userPrompt = `Lead Name: ${lead.firstName} ${lead.lastName}
Lead Company: ${lead.companyName}
Lead Title: ${lead.jobTitle}
Lead Notes: ${lead.notes || 'No specific notes'}

--- CAMPAIGN STRATEGY (AI AUTHOR PROMPT) ---
Business Context: ${campaign?.businessType || 'B2B Services'}
Strategy/Context: ${campaign?.context || 'Start a conversation'}
Desired Tone: ${campaign?.tone || 'Professional'}
Call to Action (CTA): ${campaign?.cta || 'Book a call'}
Sender Name: ${campaign?.senderName || 'The Life180 Team'}

${userFeedback ? `REVISION FEEDBACK: ${userFeedback}` : ''}

TASK:
Write the email body now. 
1. Use the "Lead Notes" as the primary anchor for personalization.
2. Follow the "Strategy/Context" provided above.
3. Stop immediately after the final period of your CTA. DO NOT WRITE "Best regards", "Sincerely", your name, or ANY other sign-off. The system handles the signature.
Output JSON ONLY.`;

  return { systemPrompt, userPrompt };
}

const FALLBACK_DRAFT: EmailDraft = {
  subject: "Drafting Failed",
  body: "Could not generate draft. Please try again or switch AI provider.",
  rationale: "Generation error — check API key and provider settings",
};

function safeParseJSON(text: string): EmailDraft {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.subject || !parsed.body) {
      return { ...FALLBACK_DRAFT, rationale: "AI returned incomplete JSON" };
    }
    return parsed as EmailDraft;
  } catch {
    console.error("Failed to parse AI JSON:", cleaned.substring(0, 200));
    return { ...FALLBACK_DRAFT, rationale: "Failed to parse AI response as JSON" };
  }
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
    
    return safeParseJSON(response.choices[0].message.content || "{}");
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
    return safeParseJSON(content);
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

    return safeParseJSON(response.text || '{}');
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
    return safeParseJSON(data.choices[0].message.content);
  } catch (e) {
    console.error("[Groq] Generation failed:", e);
    return { ...FALLBACK_DRAFT, rationale: "Groq API error" };
  }
}

export async function refinePromptWithAI(prompt: string, provider?: string, apiKey?: string): Promise<any> {
  if (!apiKey) throw new Error("API key missing for refinement");

  const actualProvider = provider || "gemini";

  if (actualProvider === "openai") {
    const openai = new OpenAI({ apiKey });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(res.choices[0].message.content || "{}");
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
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content || "{}");
  }

  // Default to Gemini
  const ai = new GoogleGenAI({ apiKey });
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

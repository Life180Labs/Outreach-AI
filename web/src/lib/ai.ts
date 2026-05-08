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

  let draft: EmailDraft;

  if (settings.aiProvider === "openai" && settings.openaiApiKey) {
    draft = await generateWithOpenAI(lead, campaign, settings.openaiApiKey, userFeedback);
  } else if (settings.aiProvider === "claude" && settings.claudeApiKey) {
    draft = await generateWithClaude(lead, campaign, settings.claudeApiKey, userFeedback);
  } else if (settings.aiProvider === "groq" && settings.groqApiKey) {
    draft = await generateWithGroq(lead, campaign, settings.groqApiKey, userFeedback);
  } else {
    if (!settings.geminiApiKey) {
      throw new Error("Gemini API Key is not configured (Default Provider)");
    }
    draft = await generateWithGemini(lead, campaign, settings.geminiApiKey, userFeedback);
  }

  return {
    ...draft,
    rationale: `[${settings.aiProvider || 'gemini'}] ${draft.rationale}`,
  };
}

function getPrompts(lead: Lead, campaign: Campaign | null, userFeedback: string = "") {
  const systemPrompt = `You are a world-class B2B cold email copywriter. 
Your goal is to write hyper-personalized, high-converting outreach emails.

CRITICAL FORMATTING RULES:
1. STRUCTURE: Every email MUST follow this structure:
   - Salutation: "Hi [First Name],"
   - Opening Hook: Mention a specific detail from the "Lead Notes" or their company background immediately.
   - The Value: Connect our business profile to their specific problem.
   - The Ask: A clear, low-friction call to action (e.g., "Would you be open to a 10-minute chat?").
   - Sign-off: "Best regards," (do not include a name, user will add it).

2. STYLE:
   - NO generic templates.
   - NO fluff like "I hope this email finds you well" or "I'm reaching out because".
   - NO corporate jargon (leverage, synergy, etc.).
   - LENGTH: Under 100 words.

Return your response in pure JSON format exactly like this:
{
  "subject": "Curiosity-driven, specific subject line (max 6 words)",
  "body": "Full professional email body following the structure above",
  "rationale": "Strategic reason why this specific approach was used for this lead"
}`;

  const userPrompt = `Lead ID: ${lead.id}
Lead Email: ${lead.email}

--- INDIVIDUAL LEAD DATA (PRIORITY) ---
Name: ${lead.firstName} ${lead.lastName}
Company: ${lead.companyName}
Title: ${lead.jobTitle}
Specific Lead Notes: ${lead.notes || 'No specific notes provided for this lead'}
Individual Sector/Type: ${lead.sector || 'Unknown'}
Individual Location: ${lead.city ? lead.city + ', ' + (lead.country || '') : 'Unknown'}

--- GLOBAL CAMPAIGN CONTEXT (BACKGROUND) ---
Our Business Profile: ${campaign?.businessType || ''}
Overall Campaign Goal: ${campaign?.context || ''}
General Location Focus: ${campaign?.locationContext || ''}

${userFeedback ? `--- SPECIAL REVISION INSTRUCTION ---
${userFeedback}` : ''}

--- TASK ---
Write a highly personalized, 1-to-1 email to this specific individual. 
- Use the "Specific Lead Notes" as your primary anchor for personalization.
- If the "Lead Notes" mention a specific problem or interest, you MUST address it.
- Do NOT use generic templates. Every email must feel unique to this specific person.
- Output JSON ONLY.`;

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

async function generateWithOpenAI(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = ""): Promise<EmailDraft> {
  const openai = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);

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

async function generateWithClaude(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = ""): Promise<EmailDraft> {
  const anthropic = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);

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

async function generateWithGemini(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = ""): Promise<EmailDraft> {
  const ai = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);
  
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

async function generateWithGroq(lead: Lead, campaign: Campaign | null, apiKey: string, userFeedback: string = ""): Promise<EmailDraft> {
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);

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

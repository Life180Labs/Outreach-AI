import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import prisma from './prisma';

export async function generateEmailDraft(lead: any, campaign: any, userFeedback: string = "") {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  console.log("AI Generation: Selected Provider =", settings?.aiProvider);
  
  let draft;
  if (settings?.aiProvider === "openai" && settings?.openaiApiKey) {
    console.log("Using OpenAI");
    draft = await generateWithOpenAI(lead, campaign, settings.openaiApiKey, userFeedback);
  } else if (settings?.aiProvider === "claude" && settings?.claudeApiKey) {
    console.log("Using Claude");
    draft = await generateWithClaude(lead, campaign, settings.claudeApiKey, userFeedback);
  } else if (settings?.aiProvider === "groq" && settings?.groqApiKey) {
    console.log("Using Groq");
    draft = await generateWithGroq(lead, campaign, settings.groqApiKey, userFeedback);
  } else {
    console.log("Falling back to Gemini (Default)");
    if (!settings?.geminiApiKey) {
      throw new Error("Gemini API Key is not configured (Default Provider)");
    }
    draft = await generateWithGemini(lead, campaign, settings.geminiApiKey, userFeedback);
  }

  return {
    ...draft,
    rationale: `[${settings?.aiProvider || 'gemini'}] ${draft.rationale}`
  };
}

function getPrompts(lead: any, campaign: any, userFeedback: string = "") {
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
Individual Sector/Type: ${lead.sector || lead.type || 'Unknown'}
Individual Location: ${lead.city ? lead.city + ', ' + lead.country : 'Unknown'}

--- GLOBAL CAMPAIGN CONTEXT (BACKGROUND) ---
Our Business Profile: ${campaign.businessType || ''}
Overall Campaign Goal: ${campaign.context || ''}
General Location Focus: ${campaign.locationContext || ''}

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

async function generateWithOpenAI(lead: any, campaign: any, apiKey: string, userFeedback: string = "") {
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
    
    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (e) {
    console.error("OpenAI failed", e);
    return { subject: "Drafting Failed", body: "Could not generate draft via OpenAI", rationale: "Parse error" };
  }
}

async function generateWithClaude(lead: any, campaign: any, apiKey: string, userFeedback: string = "") {
  const anthropic = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
    });
    
    // @ts-ignore
    const content = response.content[0].text || "{}";
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Claude failed", e);
    return { subject: "Drafting Failed", body: "Could not generate draft via Claude", rationale: "Parse error" };
  }
}

async function generateWithGemini(lead: any, campaign: any, apiKey: string, userFeedback: string = "") {
  const ai = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);
  
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: `${systemPrompt}\n\n${userPrompt}`,
  });

  try {
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { subject: "Drafting Failed", body: "Could not generate draft", rationale: "Parse error" };
  }
}

async function generateWithGroq(lead: any, campaign: any, apiKey: string, userFeedback: string = "") {
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Groq API Error Response:", err);
    throw new Error(`Groq API error: ${err}`);
  }

  try {
    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Groq response", e);
    return { subject: "Drafting Failed", body: "Could not generate draft", rationale: "Parse error" };
  }
}

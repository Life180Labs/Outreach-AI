import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import prisma from './prisma';
import type { Lead, Campaign, Settings, EmailDraft } from '@/types';

// --- 1. THE PROVIDER INTERFACE ---
export interface AIProvider {
  generate(systemPrompt: string, userPrompt: string, temperature?: number, isJson?: boolean): Promise<string>;
}

// --- 2. CONCRETE PROVIDER IMPLEMENTATIONS ---

class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string, private model: string = "gpt-4o-mini") { }
  async generate(system: string, user: string, temp: number = 0.7, isJson: boolean = true) {
    const client = new OpenAI({ apiKey: this.apiKey });
    const res = await client.chat.completions.create({
      model: this.model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: isJson ? { type: "json_object" } : undefined,
      temperature: temp,
    });
    return res.choices[0].message.content || "{}";
  }
}

class ClaudeProvider implements AIProvider {
  constructor(private apiKey: string, private model: string = "claude-3-5-haiku-latest") { }
  async generate(system: string, user: string, temp: number = 0.7) {
    const client = new Anthropic({ apiKey: this.apiKey });
    const res = await client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: system,
      messages: [{ role: "user", content: user }],
      temperature: temp,
    });
    const block = res.content[0];
    return block.type === 'text' ? block.text : "{}";
  }
}

class GeminiProvider implements AIProvider {
  constructor(private apiKey: string, private model: string = "gemini-1.5-flash") { }
  async generate(system: string, user: string, temp: number = 0.7, isJson: boolean = true) {
    const genAI = new GoogleGenAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: system
    });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: temp, responseMimeType: isJson ? "application/json" : "text/plain" },
    });
    return result.response.text();
  }
}

class GroqProvider implements AIProvider {
  constructor(private apiKey: string, private model: string = "llama-3.3-70b-versatile") { }
  async generate(system: string, user: string, temp: number = 0.7, isJson: boolean = true) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: isJson ? { type: "json_object" } : undefined,
        temperature: temp,
      }),
    });
    if (!response.ok) throw new Error(`Groq error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// --- 3. THE PROVIDER FACTORY ---
export class AIProviderFactory {
  static getProvider(providerName: string, settings: Settings): AIProvider {
    switch (providerName) {
      case "openai": return new OpenAIProvider(settings.openaiApiKey!);
      case "claude": return new ClaudeProvider(settings.claudeApiKey!);
      case "groq": return new GroqProvider(settings.groqApiKey!);
      default: return new GeminiProvider(settings.geminiApiKey!);
    }
  }
}

// --- 4. CORE UTILITIES & PROMPT LOGIC ---

function getPrompts(lead: Lead, campaign: Campaign | null, userFeedback: string = "", basePromptOverride?: string) {
  const firstName = lead.firstName ? lead.firstName.charAt(0).toUpperCase() + lead.firstName.slice(1).toLowerCase() : "there";
  const strategy = (campaign as any)?.strategy;

  const role = strategy?.role || "world-class B2B cold email copywriter";
  const product = strategy?.product || "B2B Services";
  const cta = strategy?.cta || campaign?.cta || 'Book a call';

  const systemPrompt = (basePromptOverride || `You are an elite ${role}. 
Your goal is to write hyper-personalized outreach emails that feel 100% human.

FORMATTING RULES:
1. NO WALLS OF TEXT: Use short, punchy paragraphs.
2. DOUBLE NEWLINES: You MUST use exactly two newlines ("\\n\\n") between every paragraph.
3. STRUCTURE:
   - Paragraph 1: "Hi ${firstName},"
   - Paragraph 2: Hook (from Lead Notes).
   - Paragraph 3: Value proposition.
   - Paragraph 4: Question based on "${cta}".`) +
    `
IMPORTANT: Output valid JSON ONLY:
{
  "subject": "Curiosity-driven subject line",
  "body": "Email body starting with 'Hi ${firstName},'",
  "rationale": "Briefly explain the hook"
}`;

  const userPrompt = `Lead: ${lead.firstName} ${lead.lastName} (${lead.jobTitle} at ${lead.companyName})
Notes: ${lead.notes || 'N/A'}
Strategy: ${product}. CTA: ${cta}.
${userFeedback ? `FEEDBACK: ${userFeedback}` : ''}
TASK: Write the email. Start with 'Hi ${firstName},'. Use double newlines. Output JSON ONLY.`;

  return { systemPrompt, userPrompt };
}

function safeParseJSON(text: string): any {
  if (!text) return {};
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

// --- 5. EXPORTED MAIN FUNCTIONS ---

export async function generateEmailDraft(
  lead: Lead,
  campaign: Campaign | null,
  userFeedback: string = "",
  cachedSettings?: Settings | null
): Promise<EmailDraft> {
  const settings = cachedSettings ?? await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) throw new Error("AI settings not configured.");

  const { systemPrompt, userPrompt } = getPrompts(lead, campaign, userFeedback, settings.basePrompt || undefined);

  try {
    const provider = AIProviderFactory.getProvider(settings.aiProvider || 'gemini', settings);
    const rawResponse = await provider.generate(systemPrompt, userPrompt, 0.7, true);
    const parsed = safeParseJSON(rawResponse);

    let body = parsed.body || "";
    const firstName = lead.firstName ? lead.firstName.charAt(0).toUpperCase() + lead.firstName.slice(1).toLowerCase() : "there";
    const expectedGreeting = `Hi ${firstName},`;

    // ─── GREETING INSURANCE & FORMATTING ───
    if (body) {
      body = body.trim().replace(/\r\n/g, '\n');

      // 1. Force the greeting if missing
      if (!body.toLowerCase().startsWith("hi ")) {
        body = `${expectedGreeting}\n\n${body}`;
      }
      // 2. Correct the name if the AI hallucinated a different one
      else if (!body.includes(firstName)) {
        body = body.replace(/^Hi\s+[^,]+,/i, expectedGreeting);
      }

      // 3. Clean up the spacing (The "Wall of Text" fix)
      body = body
        .replace(/\n{3,}/g, '\n\n') // Prevent triple spacing
        .replace(/([.?!])\s*\n([a-zA-Z])/g, '$1\n\n$2') // Ensure sentence-to-paragraph breaks are double
        .replace(/^(Hi\s+[^,]+,)\s*/i, '$1\n\n'); // Force break after greeting
    }

    return {
      subject: parsed.subject || "Drafting Failed",
      body: body,
      rationale: `[${settings.aiProvider}] ${parsed.rationale || "N/A"}`
    };
  } catch (error) {
    console.error(`[AI Error]`, error);
    return { subject: "Error", body: "Could not generate draft.", rationale: "API failure" };
  }
}

export async function refinePromptWithAI(prompt: string, providerName?: string, apiKey?: string): Promise<any> {
  if (!apiKey) throw new Error("API key missing for refinement");
  const tempSettings: any = {
    aiProvider: providerName || "gemini",
    openaiApiKey: providerName === "openai" ? apiKey : undefined,
    claudeApiKey: providerName === "claude" ? apiKey : undefined,
    groqApiKey: providerName === "groq" ? apiKey : undefined,
    geminiApiKey: (providerName === "gemini" || !providerName) ? apiKey : undefined,
  };

  try {
    const provider = AIProviderFactory.getProvider(tempSettings.aiProvider, tempSettings);
    const rawResponse = await provider.generate("You are an expert prompt engineer. Always return valid JSON.", prompt, 0.7, true);
    return safeParseJSON(rawResponse);
  } catch (e) {
    return {};
  }
}

export async function testEmailGeneration(
  promptOverride: string,
  leadNotes: string,
  cachedSettings?: Settings | null
): Promise<EmailDraft> {
  const mockLead = { firstName: "Test", lastName: "User", companyName: "Test Co", jobTitle: "CEO", notes: leadNotes } as Lead;
  const mockCampaign = { context: promptOverride, tone: "Professional", cta: "Book a call" } as any;
  const settings = cachedSettings ?? await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) throw new Error("Settings not found");
  return generateEmailDraft(mockLead, mockCampaign, "", settings);
}
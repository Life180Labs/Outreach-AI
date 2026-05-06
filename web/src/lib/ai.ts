import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import prisma from './prisma';

export async function generateEmailDraft(lead: any, campaign: any) {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  
  if (settings?.aiProvider === "openai" && settings?.openaiApiKey) {
    return generateWithOpenAI(lead, campaign, settings.openaiApiKey);
  }
  
  if (settings?.aiProvider === "claude" && settings?.claudeApiKey) {
    return generateWithClaude(lead, campaign, settings.claudeApiKey);
  }

  if (settings?.aiProvider === "groq" && settings?.groqApiKey) {
    return generateWithGroq(lead, campaign, settings.groqApiKey);
  }

  if (!settings?.geminiApiKey) {
    throw new Error("Gemini API Key is not configured (Default Provider)");
  }

  return generateWithGemini(lead, campaign, settings.geminiApiKey);
}

function getPrompts(lead: any, campaign: any) {
  const systemPrompt = `You are an expert B2B cold email copywriter.
Tone: ${campaign.tone || 'Personalized, non-generic, concise'}
Goal: ${campaign.cta || 'Drive reply'}

Return your response in pure JSON format exactly like this:
{
  "subject": "The subject line",
  "body": "The email body without signature",
  "rationale": "Brief 1-sentence explanation of why this email works for this lead"
}`;

  const userPrompt = `Write a short, curiosity-driven subject line and a concise email body for the following lead:
Name: ${lead.firstName} ${lead.lastName}
Company: ${lead.companyName}
Title: ${lead.jobTitle}
Location: ${lead.city ? lead.city + ', ' + lead.country : 'Unknown'}
Sector: ${lead.sector || 'Unknown'}
Context: ${campaign.context || ''}
Lead Notes: ${lead.notes || ''}

Remember to output JSON ONLY.`;

  return { systemPrompt, userPrompt };
}

async function generateWithOpenAI(lead: any, campaign: any, apiKey: string) {
  const openai = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (e) {
    console.error("OpenAI failed", e);
    return { subject: "Drafting Failed", body: "Could not generate draft via OpenAI", rationale: "Parse error" };
  }
}

async function generateWithClaude(lead: any, campaign: any, apiKey: string) {
  const anthropic = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign);

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
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

async function generateWithGemini(lead: any, campaign: any, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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

async function generateWithGroq(lead: any, campaign: any, apiKey: string) {
  const { systemPrompt, userPrompt } = getPrompts(lead, campaign);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const err = await response.text();
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

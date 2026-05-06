import prisma from "../src/lib/prisma";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

async function testIntegrations() {
  console.log("--- INTEGRATION TEST START ---");
  
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) {
    console.error("No settings found in database.");
    return;
  }

  // 1. SMTP Test
  console.log("\n[1/5] Testing SMTP...");
  if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      }
    });
    try {
      await transporter.verify();
      console.log("✅ SMTP connection successful!");
    } catch (e: any) {
      console.error("❌ SMTP failed:", e.message);
    }
  } else {
    console.log("⏭️ SMTP skipped (missing credentials)");
  }

  // 2. Gemini Test
  console.log("\n[2/5] Testing Gemini AI...");
  if (settings.geminiApiKey) {
    const genAI = new GoogleGenAI(settings.geminiApiKey);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hello, are you online?");
      console.log("✅ Gemini response received:", result.response.text().substring(0, 50));
    } catch (e: any) {
      console.error("❌ Gemini failed:", e.message);
    }
  } else {
    console.log("⏭️ Gemini skipped");
  }

  // 3. OpenAI Test
  console.log("\n[3/5] Testing OpenAI...");
  if (settings.openaiApiKey) {
    const openai = new OpenAI({ apiKey: settings.openaiApiKey });
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "hi" }],
        model: "gpt-4o-mini",
      });
      console.log("✅ OpenAI response received:", completion.choices[0].message.content?.substring(0, 50));
    } catch (e: any) {
      console.error("❌ OpenAI failed:", e.message);
    }
  } else {
    console.log("⏭️ OpenAI skipped");
  }

  // 4. Claude Test
  console.log("\n[4/5] Testing Claude...");
  if (settings.claudeApiKey) {
    const anthropic = new Anthropic({ apiKey: settings.claudeApiKey });
    try {
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "hi" }],
      });
      // @ts-ignore
      console.log("✅ Claude response received:", msg.content[0].text);
    } catch (e: any) {
      console.error("❌ Claude failed:", e.message);
    }
  } else {
    console.log("⏭️ Claude skipped");
  }

  // 5. Groq Test
  console.log("\n[5/5] Testing Groq...");
  if (settings.groqApiKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 10,
        })
      });
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Groq response received:", data.choices[0].message.content);
      } else {
        console.error("❌ Groq failed:", await res.text());
      }
    } catch (e: any) {
      console.error("❌ Groq failed:", e.message);
    }
  } else {
    console.log("⏭️ Groq skipped");
  }

  console.log("\n--- INTEGRATION TEST COMPLETE ---");
}

testIntegrations();

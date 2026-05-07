"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { generateEmailDraft } from "@/lib/ai";

export async function updateLeadStatusAction(leadId: string, status: string) {
  let data: any = { status };
  if (status === 'pause') data = { isPaused: true };
  if (status === 'resume') data = { isPaused: false };

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data,
    include: { 
      messages: { orderBy: { createdAt: 'asc' } },
      campaign: true 
    }
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/leads`);
  return updated;
}

export async function generateAIReplyAction(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { 
      messages: { orderBy: { createdAt: 'asc' } },
      campaign: true 
    }
  });

  if (!lead) throw new Error("Lead not found");

  const conversationHistory = lead.messages.map(m => 
    `${m.role === 'USER' ? 'ME' : 'LEAD'}: ${m.content}`
  ).join("\n\n");

  const lastMessage = lead.messages.filter(m => m.role === 'LEAD').pop();
  
  const feedback = `The lead (${lead.firstName}) just replied. 
  
  --- FULL CONVERSATION HISTORY ---
  INITIAL OUTREACH: ${lead.emailBody}
  
  ${conversationHistory}
  
  --- END HISTORY ---

  The lead's most recent message was: "${lastMessage?.content || 'No reply yet'}". 
  
  Please draft a professional, concise response that:
  1. Acknowledges their specific point.
  2. Offers value based on our campaign context: "${lead.campaign?.context || ''}".
  3. Proposes a clear next step (like a 15-min call).`;

  const draftResult = await generateEmailDraft(lead, lead.campaign, feedback);
  
  return {
    draft: draftResult.body,
    rationale: draftResult.rationale
  };
}

export async function sendReplyAction(leadId: string, content: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { campaign: true }
  });
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  if (!lead || !settings) throw new Error("Missing data");

  // Send Email logic
  const port = settings.smtpPort || 587;

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost || "smtp.gmail.com",
    port: port,
    secure: port === 465,
    auth: {
      user: settings.smtpUser || settings.gmailEmailAddress || "",
      pass: settings.smtpPass || "",
    },
    tls: { rejectUnauthorized: false }
  });

  await transporter.sendMail({
    from: (settings.smtpFromEmail || settings.smtpUser || settings.gmailEmailAddress || "outreach@life180.com") as string,
    to: lead.email,
    subject: `Re: ${lead.emailSubject || "Quick question"}`,
    text: content,
  });

  // Save message to DB
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      messages: {
        create: {
          role: 'USER',
          content: content,
        }
      }
    },
    include: { 
      messages: { orderBy: { createdAt: 'asc' } },
      campaign: true 
    }
  });
  revalidatePath(`/leads/${leadId}`);
  return updatedLead;
}

export async function syncLeadInboxAction(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { campaign: true }
  });
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  if (!lead || !settings) throw new Error("Missing data");

  const { ImapFlow } = require("imapflow");
  const client = new ImapFlow({
    host: settings.smtpHost?.replace("smtp.", "imap.") || "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: settings.smtpUser || settings.gmailEmailAddress || "",
      pass: settings.smtpPass || "",
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const messageUids = await client.search({ from: lead.email });
    if (Array.isArray(messageUids) && messageUids.length > 0) {
      // Get all messages we don't have yet
      for (const uid of messageUids) {
        const msg = await client.fetchOne(uid, { source: true });
        let content = msg.source.toString();
        
        // Aggressive MIME cleaning
        if (content.includes("Content-Type: text/plain")) {
          content = content.split("Content-Type: text/plain").pop() || content;
          content = content.split("--")[0]; // Strip boundary
          // Strip any remaining headers in that block
          if (content.includes("\r\n\r\n")) {
            content = content.split("\r\n\r\n").slice(1).join("\r\n\r\n");
          }
        } else if (content.includes("\r\n\r\n")) {
          // Fallback: take everything after the first double newline
          content = content.split("\r\n\r\n").slice(1).join("\r\n\r\n");
        }
        
        // Final trim and cleanup
        content = content.replace(/Content-Transfer-Encoding: .*/g, "")
                        .replace(/Content-Type: .*/g, "")
                        .replace(/charset=.*/g, "")
                        .trim();

        const existing = await prisma.message.findFirst({
          where: { leadId: lead.id, role: 'LEAD', content: content.substring(0, 100) }
        });

        if (!existing) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              replied: true,
              status: "Hot",
              messages: {
                create: {
                  role: 'LEAD',
                  content: content.length > 1000 ? content.substring(0, 1000) + "..." : content
                }
              }
            }
          });
        }
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

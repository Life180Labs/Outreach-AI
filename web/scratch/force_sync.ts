import prisma from "../src/lib/prisma";
import { ImapFlow } from "imapflow";

async function forceSync() {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) return console.log("No settings");

  const client = new ImapFlow({
    host: settings.smtpHost?.replace("smtp.", "imap.") || "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: settings.smtpUser || settings.gmailEmailAddress!,
      pass: settings.smtpPass || settings.gmailAppPassword!,
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const leads = await prisma.lead.findMany({
      where: { sent: true }
    });

    for (const lead of leads) {
      console.log(`Checking ${lead.email}...`);
      const messageUids = await client.search({ from: lead.email });
      if (messageUids.length > 0) {
        const lastUid = messageUids[messageUids.length - 1];
        const msg = await client.fetchOne(lastUid, { source: true });
        const content = msg.source.toString().split('\r\n\r\n')[1] || "Reply received";

        // Only add if not already there
        const existing = await prisma.message.findFirst({
          where: { leadId: lead.id, role: 'LEAD' }
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
                  content: content.length > 500 ? content.substring(0, 500) + "..." : content
                }
              }
            }
          });
          console.log(`Synced reply for ${lead.email}`);
        }
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }
}

forceSync();

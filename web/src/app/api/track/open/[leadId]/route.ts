import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const { leadId } = params;

  try {
    // Mark as opened in background
    await prisma.lead.update({
      where: { id: leadId },
      data: { opened: true, status: "warm" }
    });
    console.log(`[Tracking] Lead ${leadId} opened the email`);
  } catch (error) {
    console.error(`[Tracking] Error updating lead ${leadId}:`, error);
  }

  // Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

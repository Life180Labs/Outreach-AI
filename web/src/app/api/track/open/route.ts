import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// A 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");

  if (leadId) {
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: { 
          opened: true, 
          // If they open, they are at least warm
          status: "warm" 
        }
      });
    } catch (e) {
      // Ignore errors for pixel tracking
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

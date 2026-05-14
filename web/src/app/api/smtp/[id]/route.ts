// web/src/app/api/smtp/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SmtpService } from "@/services/smtp.service";

/**
 * @swagger
 * /api/smtp/{id}:
 * delete:
 * summary: Delete an SMTP configuration
 * description: Deletes a specific SMTP account owned by the user.
 * tags: [SMTP]
 * security:
 * - sessionAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The unique ID of the SMTP configuration
 * responses:
 * 200:
 * description: Successfully deleted
 * 401:
 * description: Unauthorized
 * 500:
 * description: Failed to delete
 */

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await SmtpService.deleteAccount(session.user.id as string, id);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("SMTP Delete Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await req.json();
        const updated = await SmtpService.updateAccount(session.user.id as string, id, data);
        
        return NextResponse.json({ success: true, account: updated }, { status: 200 });

    } catch (error: any) {
        console.error("SMTP Update Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update account" }, { status: 500 });
    }
}

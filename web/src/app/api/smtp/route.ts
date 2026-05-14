// web/src/app/api/smtp/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SmtpService } from "@/services/smtp.service";

/**
 * @swagger
 * /api/smtp:
 * post:
 * summary: Create a new SMTP configuration
 * description: Securely encrypts and saves SMTP credentials for the logged-in user.
 * tags: [SMTP]
 * security:
 * - sessionAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [name, host, port, user, pass]
 * properties:
 * name:
 * type: string
 * example: "Sales Gmail"
 * host:
 * type: string
 * example: "smtp.gmail.com"
 * port:
 * type: number
 * example: 465
 * user:
 * type: string
 * example: "sales@life180.com"
 * pass:
 * type: string
 * example: "app-specific-password-here"
 * responses:
 * 201:
 * description: SMTP configuration created successfully
 * 400:
 * description: Missing required fields
 * 401:
 * description: Unauthorized
 * get:
 * summary: Get all SMTP configurations
 * description: Retrieves all SMTP configurations for the logged-in user (passwords stripped for security).
 * tags: [SMTP]
 * security:
 * - sessionAuth: []
 * responses:
 * 200:
 * description: List of SMTP configurations
 * 401:
 * description: Unauthorized
 */

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, host, port, user, pass } = body;

        if (!name || !host || !port || !user || !pass) {
            return NextResponse.json({ error: "Missing required SMTP fields" }, { status: 400 });
        }

        const account = await SmtpService.createAccount(session.user.id as string, { name, host, port: Number(port), user, pass });
        return NextResponse.json({ success: true, accountId: account.id }, { status: 201 });

    } catch (error: any) {
        console.error("SMTP Creation Error:", error);
        return NextResponse.json({ error: "Failed to save SMTP configuration" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const accounts = await SmtpService.getAccountsForUser(session.user.id as string);
        return NextResponse.json({ accounts }, { status: 200 });

    } catch (error) {
        console.error("SMTP Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch SMTP accounts" }, { status: 500 });
    }
}
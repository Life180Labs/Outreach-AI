import { ZodError } from "zod";

import { getAuthUser } from "@/lib/auth";

import {
    successResponse,
    errorResponse,
} from "@/lib/api-response";

import { logger } from "@/lib/logger";

import { SmtpService } from "@/modules/smtp/smtp.service";

import { SmtpSchema } from "@/schemas/smtp.schema";

export async function GET() {
    try {
        const user =
            await getAuthUser();

        const accounts =
            await SmtpService.getSmtpAccountsByUser(
                user.id
            );

        return successResponse(accounts);
    } catch (error) {
        logger.error(
            "Get SMTP Accounts Error:",
            error
        );

        if (
            error instanceof Error &&
            error.message === "Unauthorized"
        ) {
            return errorResponse(
                "Unauthorized",
                401
            );
        }

        return errorResponse(
            "Internal server error",
            500
        );
    }
}

export async function POST(req: Request) {
    try {
        const user =
            await getAuthUser();

        const body = await req.json();

        const validatedData =
            SmtpSchema.parse(body);

        const account =
            await SmtpService.createSmtpAccount(
                user.id,
                validatedData
            );

        return successResponse(
            account,
            "SMTP account created successfully",
            201
        );
    } catch (error) {
        logger.error(
            "Create SMTP Error:",
            error
        );

        if (
            error instanceof Error &&
            error.message === "Unauthorized"
        ) {
            return errorResponse(
                "Unauthorized",
                401
            );
        }

        if (error instanceof ZodError) {
            return errorResponse(
                "Validation failed",
                400,
                error.flatten()
            );
        }

        if (error instanceof Error) {
            return errorResponse(
                error.message,
                400
            );
        }

        return errorResponse(
            "Internal server error",
            500
        );
    }
}
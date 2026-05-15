// src/modules/smtp/smtp.service.ts
import prisma from "@/lib/prisma";
import { SmtpSchema } from "@/schemas/smtp.schema";
import { EncryptionService } from "@/core/security/encryption";
import nodemailer from "nodemailer";
import { z } from "zod";

export const SmtpService = {
    async createSmtpAccount(userId: string, data: z.infer<typeof SmtpSchema>) {
        const encryptedPass = EncryptionService.encrypt(data.password);

        // Verify connection before saving
        const isValid = await this.verifyConnection(data);
        if (!isValid) throw new Error("Failed to connect to SMTP server with provided credentials.");

        return prisma.smtpAccount.create({
            data: {
                userId,
                name: data.name,
                host: data.host,
                port: data.port,
                username: data.username,
                encryptedPass,
                encryptionType: data.encryptionType,
                fromEmail: data.fromEmail,
                fromName: data.fromName,
                isVerified: true,
            },
        });
    },

    async getSmtpAccountsByUser(userId: string) {
        const accounts = await prisma.smtpAccount.findMany({ where: { userId } });
        // Strip encrypted passwords before returning to controllers/UI
        return accounts.map(({ encryptedPass, ...rest }) => rest);
    },

    async deleteSmtpAccount(id: string, userId: string) {
        return prisma.smtpAccount.delete({
            where: { id, userId },
        });
    },

    async verifyConnection(data: z.infer<typeof SmtpSchema>): Promise<boolean> {
        try {
            const transporter = nodemailer.createTransport({
                host: data.host,
                port: data.port,
                secure: data.encryptionType === "SSL" || data.port === 465,
                auth: {
                    user: data.username,
                    pass: data.password,
                },
            });
            await transporter.verify();
            return true;
        } catch (error) {
            console.error("SMTP Verification Error:", error);
            return false;
        }
    }
};
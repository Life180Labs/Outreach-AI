// web/src/services/smtp.service.ts
import prisma from "@/lib/prisma";
import { EncryptionUtils } from "@/utils/encryption";

export class SmtpService {
    /**
     * Securely saves a new SMTP configuration to the database.
     */
    static async createAccount(userId: string, data: { name: string; host: string; port: number; user: string; pass: string }) {
        // 1. Encrypt the password before storing it
        const encryptedPassword = EncryptionUtils.encrypt(data.pass);

        // 2. Build the JSON configuration
        const configPayload = JSON.stringify({
            host: data.host,
            port: data.port,
            user: data.user,
            pass: encryptedPassword, // Store the encrypted string
        });

        // 3. Save to IntegrationAccount table
        return await prisma.integrationAccount.create({
            data: {
                userId,
                type: "SMTP",
                provider: "custom", // Can be expanded later for 'gmail', 'outlook', etc.
                name: data.name,
                config: configPayload,
                isActive: true,
            },
        });
    }

    /**
     * Retrieves all SMTP accounts for a user, stripping the passwords for frontend safety.
     */
    static async getAccountsForUser(userId: string) {
        const accounts = await prisma.integrationAccount.findMany({
            where: { userId, type: "SMTP" },
            orderBy: { createdAt: "desc" },
        });

        // Parse the JSON config and remove the password so it never reaches the browser
        return accounts.map((acc) => {
            const config = JSON.parse(acc.config);
            return {
                id: acc.id,
                name: acc.name,
                host: config.host,
                port: config.port,
                user: config.user,
                isActive: acc.isActive,
                createdAt: acc.createdAt,
            };
        });
    }

    /**
     * Deletes an SMTP configuration, ensuring it belongs to the requesting user.
     */
    static async deleteAccount(userId: string, accountId: string) {
        // 1. Verify ownership
        const account = await prisma.integrationAccount.findUnique({
            where: { id: accountId },
        });

        if (!account || account.userId !== userId) {
            throw new Error("Unauthorized or account not found");
        }

        // 2. Unset this account in any campaigns that are using it
        await prisma.campaign.updateMany({
            where: { smtpAccountId: accountId },
            data: { smtpAccountId: null }
        });

        // 3. Delete the account
        return await prisma.integrationAccount.delete({
            where: { id: accountId },
        });
    }


    /**
     * Updates an existing SMTP configuration.
     */
    static async updateAccount(userId: string, accountId: string, data: { name?: string; host?: string; port?: number; user?: string; pass?: string }) {
        // First verify ownership
        const account = await prisma.integrationAccount.findUnique({
            where: { id: accountId },
        });

        if (!account || account.userId !== userId) {
            throw new Error("Unauthorized or account not found");
        }

        const currentConfig = JSON.parse(account.config);
        
        // Build new config
        const newConfig = {
            host: data.host || currentConfig.host,
            port: data.port || currentConfig.port,
            user: data.user || currentConfig.user,
            pass: data.pass ? EncryptionUtils.encrypt(data.pass) : currentConfig.pass,
        };

        return await prisma.integrationAccount.update({
            where: { id: accountId },
            data: {
                name: data.name || account.name,
                config: JSON.stringify(newConfig),
            },
        });
    }
}
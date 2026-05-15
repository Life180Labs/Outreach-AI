// src/schemas/smtp.schema.ts
import { z } from "zod";

export const SmtpSchema = z.object({
    name: z.string().min(1, "Configuration name is required (e.g., Life180 Sales)"),
    host: z.string().min(1, "SMTP Host is required"),
    port: z.number().int().positive(),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    encryptionType: z.enum(["TLS", "SSL", "NONE"]),
    fromEmail: z.string().email("Invalid from email address"),
    fromName: z.string().min(1, "Sender name is required"),
});
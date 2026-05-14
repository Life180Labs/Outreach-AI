import crypto from "crypto";

const RAW_KEY = process.env.ENCRYPTION_KEY || "life180-outreach-ai-secure-salt-2026";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

export class EncryptionUtils {
    /**
     * Encrypts a string using AES-256-GCM.
     * Returns a colon-separated string: iv:authTag:encryptedContent
     */
    static encrypt(text: string): string {
        if (!text) return "";
        
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        
        const authTag = cipher.getAuthTag().toString("hex");
        
        return `${iv.toString("hex")}:${authTag}:${encrypted}`;
    }

    /**
     * Decrypts a string encrypted with the above method.
     */
    static decrypt(encryptedText: string): string {
        if (!encryptedText) return "";

        const [ivHex, authTagHex, encryptedContent] = encryptedText.split(":");
        
        if (!ivHex || !authTagHex || !encryptedContent) {
            throw new Error("Invalid encrypted text format");
        }

        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedContent, "hex", "utf8");
        decrypted += decipher.final("utf8");
        
        return decrypted;
    }
}

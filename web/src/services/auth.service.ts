// web/src/services/auth.service.ts
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export class AuthService {
    private static SALT_ROUNDS = 12;

    /**
     * Hashes a plain text password securely using bcrypt.
     */
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.SALT_ROUNDS);
    }

    /**
     * Validates if the provided plain password matches the hashed one in the database.
     */
    static async verifyPassword(plain: string, hashed: string): Promise<boolean> {
        return await bcrypt.compare(plain, hashed);
    }

    /**
     * Fetches a user by email, useful for NextAuth validation.
     */
    static async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }
}
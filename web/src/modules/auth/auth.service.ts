// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth.schema";
import { z } from "zod";

export const AuthService = {
    async registerUser(data: z.infer<typeof RegisterSchema>) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

        if (existingUser) {
            throw new Error("Email already in use");
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(data.password, saltRounds);

        return prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
            },
        });
    },

    async getUserByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    },

    async verifyPassword(password: string, hash: string) {
        return bcrypt.compare(password, hash);
    }
};
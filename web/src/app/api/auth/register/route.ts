// web/src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/services/auth.service";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
        }

        // Hash the password
        const passwordHash = await AuthService.hashPassword(password);

        // Create the user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });

        return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
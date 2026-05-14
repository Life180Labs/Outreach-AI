// web/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { AuthService } from "@/services/auth.service";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    debug: true,
    session: {
        strategy: "jwt", // Must be JWT for the default Middleware to work
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@life180.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                const user = await AuthService.getUserByEmail(credentials.email);

                if (!user || !user.passwordHash) {
                    throw new Error("Invalid credentials");
                }

                const isValid = await AuthService.verifyPassword(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // CRITICAL: We only store the ID, Email, and Name. 
            // We explicitly EXCLUDE 'image' and other fields to keep the cookie size under the 4KB limit.
            if (user) {
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = null; // Ensure no base64 bloat in the session
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
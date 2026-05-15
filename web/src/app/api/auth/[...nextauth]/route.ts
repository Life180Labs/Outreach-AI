import NextAuth, { NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { PrismaAdapter } from "@auth/prisma-adapter";

import prisma from "@/lib/prisma";

import { AuthService } from "@/modules/auth/auth.service";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    debug: process.env.NODE_ENV === "development",

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
    },

    providers: [
        GoogleProvider({
            clientId:
                process.env.GOOGLE_CLIENT_ID || "",

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET || "",
        }),

        CredentialsProvider({
            name: "Credentials",

            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                },

                password: {
                    label: "Password",
                    type: "password",
                },
            },

            async authorize(credentials) {
                if (
                    !credentials?.email ||
                    !credentials?.password
                ) {
                    throw new Error(
                        "Missing email or password"
                    );
                }

                const user =
                    await AuthService.getUserByEmail(
                        credentials.email
                    );

                if (!user || !user.passwordHash) {
                    throw new Error(
                        "Invalid credentials"
                    );
                }

                const isValid =
                    await AuthService.verifyPassword(
                        credentials.password,
                        user.passwordHash
                    );

                if (!isValid) {
                    throw new Error(
                        "Invalid credentials"
                    );
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id =
                    token.id as string;

                session.user.email =
                    token.email;

                session.user.name =
                    token.name;

                session.user.image = null;
            }

            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
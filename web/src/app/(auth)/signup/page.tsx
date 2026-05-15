// src/app/(auth)/signup/page.tsx

"use client";

import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
    Mail,
    Lock,
    User,
    ArrowRight,
} from "lucide-react";

type FormData = {
    name: string;
    email: string;
    password: string;
};

export default function SignUpPage() {
    const router = useRouter();

    const [formData, setFormData] =
        useState<FormData>({
            name: "",
            email: "",
            password: "",
        });

    const [error, setError] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        formData
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Registration failed"
                );
            }

            router.push(
                "/login?registered=true"
            );
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Something went wrong"
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Join Life180
                    </h1>

                    <p className="mt-2 text-sm text-gray-600">
                        Create an account to scale your outreach.
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                >
                    {/* Error */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                        <input
                            type="text"
                            name="name"
                            required
                            value={
                                formData.name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Full Name"
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                        <input
                            type="email"
                            name="email"
                            required
                            value={
                                formData.email
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Email Address"
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

                        <input
                            type="password"
                            name="password"
                            required
                            minLength={8}
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Password (min 8 characters)"
                            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={
                            isLoading
                        }
                        className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading
                            ? "Creating account..."
                            : "Create Account"}

                        {!isLoading && (
                            <ArrowRight className="ml-2 h-4 w-4" />
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600">
                        Already have an account?
                    </span>

                    <Link
                        href="/login"
                        className="ml-1 font-medium text-blue-600 hover:text-blue-500"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
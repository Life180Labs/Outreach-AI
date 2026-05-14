// web/src/app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const toastId = toast.loading("Creating your account...");

        try {
            // 1. Register the user
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Something went wrong");
            }

            // 2. Automatically log them in after successful registration
            const signInRes = await signIn("credentials", {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (signInRes?.error) {
                throw new Error(signInRes.error);
            }

            toast.success("Account created! Logging you in...", { id: toastId });
            
            // 3. Redirect to the main app dashboard
            router.push("/");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-zinc-100">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Create an account</h2>
                    <p className="mt-2 text-sm text-zinc-500">Start automating your outreach today.</p>
                </div>

                <div className="mt-8 space-y-6">
                    <GoogleSignInButton text="Sign up with Google" />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-200"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-zinc-400 font-medium">Or continue with</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-tight mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-tight mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-tight mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>
                </div>


                <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
// web/src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const toastId = toast.loading("Verifying credentials...");

        const res = await signIn("credentials", {
            redirect: false,
            email: form.email,
            password: form.password,
        });

        if (res?.error) {
            toast.error(res.error, { id: toastId });
            setLoading(false);
        } else {
            toast.success("Login successful", { id: toastId });
            router.push("/");
            router.refresh();
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-zinc-100">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome back</h2>
                    <p className="mt-2 text-sm text-zinc-500">Log in to your Outreach AI account.</p>
                </div>

                <div className="mt-8 space-y-6">
                    <GoogleSignInButton text="Sign in with Google" />

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
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>


                <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
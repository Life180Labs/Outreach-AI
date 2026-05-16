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
        <div className="flex min-h-screen items-center justify-center p-4 relative" style={{ background: 'var(--bg-sink)' }}>
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)', filter: 'blur(80px)' }} />

            <div className="w-full max-w-md space-y-8 p-8 relative z-10" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-container)', boxShadow: 'var(--shadow-2xl)' }}>
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gradient">Welcome back</h2>
                    <p className="mt-2 text-sm" style={{ color: '#64748B' }}>Log in to your Outreach AI account.</p>
                </div>

                <div className="mt-8 space-y-6">
                    <GoogleSignInButton text="Sign in with Google" />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 font-medium" style={{ background: 'var(--bg-surface)', color: '#475569' }}>Or continue with</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-tight mb-1" style={{ color: '#64748B', fontFamily: 'var(--font-mono)' }}>Email</label>
                                <input
                                    type="email"
                                    required
                                    className="input-dark w-full"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-tight mb-1" style={{ color: '#64748B', fontFamily: 'var(--font-mono)' }}>Password</label>
                                <input
                                    type="password"
                                    required
                                    className="input-dark w-full"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm" style={{ color: '#64748B' }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type AccountStatus = "connected" | "disconnected";

function StatusPill({ status, label }: { status: AccountStatus, label: string }) {
  const dotClasses = status === "connected" ? "bg-emerald-500" : "bg-zinc-400";

  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
      <span className={`h-2 w-2 rounded-full ${dotClasses}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function AppShell({
  children,
  accountStatus = "disconnected",
  accountLabel = "No account",
}: {
  children: ReactNode;
  accountStatus?: AccountStatus;
  accountLabel?: string;
}) {
  return (
    <div className="min-h-full bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-950">
              Outreach AI
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={accountStatus} label={accountLabel} />
            <Link href="/settings" className="text-sm font-medium text-zinc-700 hover:text-zinc-950">
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}


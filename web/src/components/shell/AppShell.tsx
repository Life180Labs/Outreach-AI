"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LayoutDashboard, Users, Zap } from "lucide-react";

type AccountStatus = "connected" | "disconnected";

function StatusPill({ status, label }: { status: AccountStatus, label: string }) {
  const dotClasses = status === "connected" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-400";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full transition-all hover:border-zinc-300">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses}`} aria-hidden="true" />
      <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">{label}</span>
    </div>
  );
}

function NavLink({ href, children, icon: Icon }: { href: string, children: ReactNode, icon: any }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
          ? "bg-black text-white shadow-lg shadow-black/10 scale-[1.02]"
          : "text-zinc-500 hover:text-black hover:bg-zinc-100"
        }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
      {children}
    </Link>
  );
}

export function AppShell({
  children,
  accountStatus = "connected",
  accountLabel = "Gmail Active",
}: {
  children: ReactNode;
  accountStatus?: AccountStatus;
  accountLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-sm font-black tracking-tighter uppercase text-black">Antigravity</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/campaigns" icon={LayoutDashboard}>Campaigns</NavLink>
              <NavLink href="/leads" icon={Users}>Leads</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <StatusPill status={accountStatus} label={accountLabel} />
            <div className="h-4 w-[1px] bg-zinc-200 mx-2" />
            <Link
              href="/settings"
              className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

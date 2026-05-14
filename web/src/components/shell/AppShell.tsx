"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LayoutDashboard, Users, Zap, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

type AccountStatus = "connected" | "disconnected";

function StatusPill({ status, label }: { status: AccountStatus; label: string }) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 border border-zinc-100 rounded-lg transition-all"
      role="status"
    >
      <div className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-emerald-500" : "bg-zinc-300"}`} />
      <span className="text-[10px] font-semibold uppercase tracking-tight text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon: Icon,
  onClick,
}: {
  href: string;
  children: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-black text-white"
          : "text-zinc-500 hover:text-black hover:bg-zinc-50"
      }`}
    >
      <Icon className="w-4 h-4" />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-7 h-7 bg-black rounded flex items-center justify-center transition-transform group-hover:scale-105">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-black">
                Outreach AI
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              <NavLink href="/campaigns" icon={LayoutDashboard}>Campaigns</NavLink>
              <NavLink href="/leads" icon={Users}>Leads</NavLink>
              <NavLink href="/ai-eval" icon={Zap}>AI Eval</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <StatusPill status={accountStatus} label={accountLabel} />
            </div>
            <div className="h-4 w-px bg-zinc-100 hidden sm:block" />
            <div className="flex items-center gap-1">
              <Link
                href="/profile"
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
                title="Your Profile"
              >
                <User className="w-4 h-4" />
              </Link>
              
              <Link
                href="/settings"
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-zinc-50 bg-white px-4 py-3 space-y-1">
            <NavLink href="/campaigns" icon={LayoutDashboard} onClick={() => setMobileMenuOpen(false)}>
              Campaigns
            </NavLink>
            <NavLink href="/leads" icon={Users} onClick={() => setMobileMenuOpen(false)}>
              Leads
            </NavLink>
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {children}
        <footer className="mt-16 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400 font-medium">
          <p>© life180labs 2026</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-black cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-black cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

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
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: status === "connected" ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
      }}
      role="status"
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          status === "connected" ? "bg-emerald-400 animate-pulse-dot" : "bg-zinc-600"
        }`}
      />
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: status === "connected" ? '#10B981' : '#64748B' }}>
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
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        isActive
          ? "text-white"
          : "text-[#64748B] hover:text-[#94A3B8]"
      }`}
      style={{
        background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
        ...(isActive ? {} : {}),
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-[#6366F1]' : ''}`} />
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-sink)' }}>
      {/* Floating Navbar Island */}
      <header className="sticky top-0 z-50 flex justify-center px-4 pt-4">
        <div
          className="w-full max-w-[1200px] flex items-center justify-between px-5 py-2.5 rounded-full"
          style={{
            background: 'rgba(13, 14, 18, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
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

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <StatusPill status={accountStatus} label={accountLabel} />
            </div>
            <div className="h-4 w-px hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex items-center gap-0.5">
              <Link
                href="/profile"
                className="p-2 text-[#64748B] hover:text-white hover:bg-white/5 rounded-full transition-all duration-200"
                title="Your Profile"
              >
                <User className="w-4 h-4" />
              </Link>
              <Link
                href="/settings"
                className="p-2 text-[#64748B] hover:text-white hover:bg-white/5 rounded-full transition-all duration-200"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-red-500/5 rounded-full transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-[#64748B] hover:text-white hover:bg-white/5 rounded-full transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden mx-4 mt-2 rounded-2xl p-3 space-y-1"
          style={{
            background: 'rgba(13, 14, 18, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <NavLink href="/campaigns" icon={LayoutDashboard} onClick={() => setMobileMenuOpen(false)}>
            Campaigns
          </NavLink>
          <NavLink href="/leads" icon={Users} onClick={() => setMobileMenuOpen(false)}>
            Leads
          </NavLink>
          <NavLink href="/ai-eval" icon={Zap} onClick={() => setMobileMenuOpen(false)}>
            AI Eval
          </NavLink>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {children}
        <footer className="mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}>
          <p>© life180labs 2026</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#94A3B8] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[#94A3B8] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[#94A3B8] cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="h-16 shrink-0 bg-[#fdfdfc] border-b border-brand-border">
      <div className="h-full flex items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-bold text-brand-text tracking-tight">Outreach AI</Link>
        </div>
        <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link href="/" className={`px-4 py-1.5 rounded-full ${pathname === '/' || pathname.startsWith('/campaigns') ? 'bg-white shadow-sm border border-brand-border text-black' : 'text-brand-muted hover:text-black'} transition-colors`}>Campaigns</Link>
          <Link href="/leads" className={`px-4 py-1.5 rounded-full ${pathname.startsWith('/leads') ? 'bg-white shadow-sm border border-brand-border text-black' : 'text-brand-muted hover:text-black'} transition-colors`}>Leads</Link>
          <Link href="/settings" className={`px-4 py-1.5 rounded-full ${pathname.startsWith('/settings') ? 'bg-white shadow-sm border border-brand-border text-black' : 'text-brand-muted hover:text-black'} transition-colors`}>Settings</Link>
        </div>
        </div>
      </div>
    </header>
  );
}

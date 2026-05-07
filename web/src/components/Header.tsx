"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="h-auto min-h-[64px] shrink-0 bg-[#fdfdfc] border-b border-brand-border py-2 sm:py-0">
      <div className="h-full flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 gap-4 sm:gap-0">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-bold text-brand-text tracking-tight whitespace-nowrap">Outreach AI</Link>
        </div>
        <div className="flex items-center gap-6 overflow-x-auto max-w-full no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2 text-sm font-medium whitespace-nowrap">
            <Link href="/campaigns" className={`px-3 sm:px-4 py-1.5 rounded-full ${pathname === '/campaigns' || pathname.startsWith('/campaigns/') ? 'bg-white shadow-sm border border-brand-border text-black' : 'text-brand-muted hover:text-black'} transition-colors`}>Campaigns</Link>
            <Link href="/leads" className={`px-3 sm:px-4 py-1.5 rounded-full ${pathname.startsWith('/leads') ? 'bg-white shadow-sm border border-brand-border text-black' : 'text-brand-muted hover:text-black'} transition-colors`}>Leads</Link>
            <Link href="/settings" className={`px-3 sm:px-4 py-1.5 rounded-full ${pathname.startsWith('/settings') ? 'bg-white shadow-sm border border-brand-border text-black' : 'text-brand-muted hover:text-black'} transition-colors`}>Settings</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

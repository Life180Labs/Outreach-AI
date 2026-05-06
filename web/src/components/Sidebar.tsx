import Link from 'next/link';
import { Home, List, Settings, Mail } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center">
            <Mail className="w-5 h-5 text-zinc-950" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI Email Bot</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors">
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <Link href="/leads" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors">
          <List className="w-4 h-4" />
          All Leads
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}

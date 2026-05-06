"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import type { LeadInput } from "@/types/leads";
import { Button } from "@/components/ui/Button";

function safeParseLeads(raw: string | null): LeadInput[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LeadInput[];
  } catch {
    return [];
  }
}

export default function CampaignSetupPage() {
  const [leads] = useState<LeadInput[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = sessionStorage.getItem("phase1.validLeads");
    return safeParseLeads(raw);
  });

  const summary = useMemo(() => {
    if (leads.length === 0) return "No validated leads in this session.";
    return `${leads.length} validated leads loaded (Phase 1 stub).`;
  }, [leads.length]);

  return (
    <AppShell gmailStatus="disconnected">
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="text-xs font-medium text-zinc-500">Campaign setup</div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Sender, tone, CTA, follow-ups — keep it tight
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Phase 1 scaffolds navigation from validation into setup. We’ll build the full setup form in Phase 2.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-sm font-medium text-zinc-700">{summary}</div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/leads/upload">
              <Button type="button" variant="secondary">
                Back to upload
              </Button>
            </Link>
            <Button type="button" disabled>
              Continue to AI generation (next)
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


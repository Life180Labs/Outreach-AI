"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleCampaignStatus } from "../actions";
import { stopAllSequencesAction, syncCampaignInboxAction } from "../../dashboard-actions";
import { RotateCcw } from "lucide-react";

export function CampaignActions({ campaign, leads }: { campaign: any, leads: any[] }) {
  const [status, setStatus] = useState(campaign.status);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    const newStatus = await toggleCampaignStatus(campaign.id);
    if (newStatus) setStatus(newStatus);
    setLoading(false);
    router.refresh();
  };

  const handleStopAll = async () => {
    if (confirm("Are you sure you want to pause all active campaigns?")) {
      setLoading(true);
      await stopAllSequencesAction();
      setLoading(false);
      router.refresh();
    }
  };

  const handleExport = () => {
    const headers = ["First Name", "Last Name", "Email", "Company", "Status", "Sent", "Opened", "Replied"];
    const rows = leads.map(l => [
      l.firstName,
      l.lastName,
      l.email,
      l.companyName,
      l.status,
      l.sent ? "Yes" : "No",
      l.opened ? "Yes" : "No",
      l.replied ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${campaign.name || "campaign"}_leads.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSync = async () => {
    setLoading(true);
    await syncCampaignInboxAction(campaign.id);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleSync}
        disabled={loading}
        className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center gap-2"
      >
        <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        Sync
      </button>
      <button 
        onClick={handleToggle}
        disabled={loading}
        className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        {status === "active" ? "Pause" : "Resume"}
      </button>
      <button 
        onClick={handleExport}
        className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
      >
        Export CSV
      </button>
      <button 
        onClick={handleStopAll}
        disabled={loading}
        className="bg-white hover:bg-red-50 border border-red-200 text-red-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
      >
        Stop all
      </button>
    </div>
  );
}

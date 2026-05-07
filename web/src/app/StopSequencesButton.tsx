"use client";

import { useState } from "react";
import { stopAllSequencesAction } from "./dashboard-actions";
import { Loader2 } from "lucide-react";

export function StopSequencesButton() {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    if (!confirm("Are you sure you want to stop all active sequences?")) return;
    setLoading(true);
    await stopAllSequencesAction();
    setLoading(false);
    alert("All active sequences have been paused.");
  };

  return (
    <button 
      onClick={handleStop}
      disabled={loading}
      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      Stop all sequences
    </button>
  );
}

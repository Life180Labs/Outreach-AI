"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { stopAllSequencesAction } from "./dashboard-actions";
import { Loader2, OctagonX, X, AlertTriangle } from "lucide-react";

export function StopSequencesButton({ variant = "card" }: { variant?: "card" | "button" }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleStop = async () => {
    setLoading(true);
    const result = await stopAllSequencesAction();
    setLoading(false);
    setShowModal(false);
    
    if (result.success) {
      router.refresh();
    } else {
      alert("Failed: " + result.error);
    }
  };

  return (
    <>
      {variant === "card" ? (
        <button
          onClick={() => setShowModal(true)}
          className="group flex flex-col justify-between p-6 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-red-50/60 hover:border-red-200 transition-all h-44 w-full text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-lg bg-red-100 group-hover:bg-red-600 transition-colors flex items-center justify-center">
              <OctagonX className="w-4 h-4 text-red-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Emergency</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">Stop All Sequences</p>
            <p className="text-xs text-red-400 mt-0.5">Pauses all active outreach immediately</p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-3.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
          title="Emergency Stop All"
        >
          <OctagonX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stop All</span>
        </button>
      )}

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-black">Confirm Emergency Stop</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-zinc-400 hover:text-black rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-zinc-600 leading-relaxed">
                This will immediately pause <span className="font-semibold text-black">all active campaigns</span> and un-sent lead sequences. You can resume them manually later.
              </p>
              
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handleStop}
                  disabled={loading}
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <OctagonX className="w-4 h-4" />}
                  Stop Everything Now
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="w-full py-3 bg-white text-zinc-500 hover:text-black rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-full">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/leads" className="text-brand-muted hover:text-black flex items-center text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> back to leads
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center font-bold text-black text-lg shrink-0">
            RA
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Rania Al-Farsi</h1>
            <p className="text-brand-muted text-sm">CEO · NovaSpark AI · Dubai · Replied 2 hours ago</p>
          </div>
        </div>
        <span className="bg-[#eef8ed] text-[#2b6528] px-3 py-1 rounded text-sm font-bold border border-[#b2ddab]">Hot lead</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h3 className="text-black font-semibold text-sm mb-4">Thread</h3>
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-brand-muted"><span className="text-black">You (Anirban Das)</span> May 6 · 9:14am</p>
                <div className="text-black text-sm leading-relaxed bg-white/50 rounded-lg p-3">
                  Hi Rania, scaling NLP annotation in-house is expensive — most Dubai AI teams hit this wall at Series A. At Life180 Labs, we handle data labeling and LLM eval as a managed service, so your engineers stay focused on the model. Worth a 20-min call?
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-brand-muted"><span className="text-black">Rania Al-Farsi</span> May 6 · 11:32am</p>
                <div className="text-black text-sm leading-relaxed bg-white border border-brand-border rounded-lg p-4 shadow-sm">
                  This is timely — we're hitting this exact issue. Can you share more about your LLM eval process? We work with Arabic-language models, wondering if you have experience there.
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-black font-semibold text-sm mb-4">Activity timeline</h3>
            <div className="space-y-5 pl-1">
              <div className="relative pl-6 border-l-2 border-brand-border pb-5">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <h4 className="text-black font-bold text-sm">Initial email sent</h4>
                <p className="text-brand-muted text-sm mt-0.5">May 6 · 9:14am</p>
              </div>
              <div className="relative pl-6 border-l-2 border-brand-border pb-5">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <h4 className="text-black font-bold text-sm">Lead opened email</h4>
                <p className="text-brand-muted text-sm mt-0.5">May 6 · 10:51am</p>
              </div>
              <div className="relative pl-6 border-l-2 border-brand-border pb-5">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <h4 className="text-black font-bold text-sm">Lead replied</h4>
                <p className="text-brand-muted text-sm mt-0.5">May 6 · 11:32am</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <h4 className="text-black font-bold text-sm">Follow-up #1 paused</h4>
                <p className="text-brand-muted text-sm mt-0.5">Stopped — reply received</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border border-brand-border rounded-xl p-6">
            <h3 className="text-black font-semibold text-sm mb-4">Reply</h3>
            
            <div className="flex bg-brand-surface border border-brand-border rounded-lg overflow-hidden w-fit mb-4">
              <button className="px-4 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border-r border-brand-border">AI draft</button>
              <button className="px-4 py-1.5 text-sm font-semibold text-brand-muted hover:text-black hover:bg-zinc-50">Write manually</button>
            </div>

            <textarea 
              rows={4}
              defaultValue="Yes, we have experience with Arabic NLP — annotators fluent in MSA and Levantine. Happy to walk you through our eval framework on a quick call. Are you free Thursday or Friday?"
              className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-black text-sm focus:outline-none resize-none mb-4"
            />

            <div className="bg-[#f2edfa] border border-[#d6c4f0] rounded-xl p-4 flex gap-2 mb-4">
              <div className="text-[#5b32a8] font-medium text-sm w-full">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Why this draft?
                </div>
                <span className="text-[#6d41c4] italic block mt-1 opacity-90">Addresses Arabic NLP query directly + books call per campaign CTA</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm text-sm">
                Send reply
              </button>
              <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm text-sm">
                Attach booking link
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-black font-semibold text-sm mb-3">Lead status</h3>
            <div className="flex flex-wrap gap-3">
              <button className="bg-[#eef8ed] border border-[#b2ddab] text-[#2b6528] px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
                Hot — interested
              </button>
              <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
                Move to CRM
              </button>
              <button className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors shadow-sm">
                Not interested
              </button>
              <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
                Mark closed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

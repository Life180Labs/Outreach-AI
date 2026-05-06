import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-full">
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden p-6">
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <input 
            type="text" 
            placeholder="Search by name, company, location..." 
            className="w-full md:max-w-md bg-white border border-brand-border rounded-lg px-4 py-2.5 text-black focus:outline-none text-sm"
          />
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white border border-brand-border rounded-lg overflow-hidden shadow-sm">
              <button className="px-4 py-2 text-sm font-semibold text-brand-muted hover:text-black hover:bg-zinc-50 border-r border-brand-border">All (82)</button>
              <button className="px-4 py-2 text-sm font-semibold text-[#2b6528] bg-[#eef8ed] border-r border-brand-border">Hot (5)</button>
              <button className="px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border-r border-brand-border">Warm (18)</button>
              <button className="px-4 py-2 text-sm font-semibold text-brand-muted hover:text-black hover:bg-zinc-50">Cold (59)</button>
            </div>
            <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
              Export CSV
            </button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-border text-brand-muted">
            <tr>
              <th className="pb-3 font-semibold">Lead</th>
              <th className="pb-3 font-semibold">Company</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Last activity</th>
              <th className="pb-3 font-semibold">Follow-up due</th>
              <th className="pb-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            <tr>
              <td className="py-4">
                <p className="font-bold text-black">Rania Al-Farsi</p>
                <p className="text-xs text-brand-muted mt-0.5">Dubai</p>
              </td>
              <td className="py-4 text-black font-medium">NovaSpark AI</td>
              <td className="py-4">
                <span className="bg-[#eef8ed] text-[#2b6528] px-2 py-0.5 rounded text-xs font-bold border border-[#b2ddab]">Hot</span>
              </td>
              <td className="py-4 text-black font-medium">Replied · 2h ago</td>
              <td className="py-4 text-brand-muted">Paused (replied)</td>
              <td className="py-4">
                <Link href="/leads/1" className="bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-xs">
                  View
                </Link>
              </td>
            </tr>

            <tr>
              <td className="py-4">
                <p className="font-bold text-black">Sara Badr</p>
                <p className="text-xs text-brand-muted mt-0.5">Riyadh</p>
              </td>
              <td className="py-4 text-black font-medium">HeliosML</td>
              <td className="py-4">
                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-bold border border-orange-200">Warm</span>
              </td>
              <td className="py-4 text-black font-medium">Opened &times;3 · 1d ago</td>
              <td className="py-4 text-orange-600 font-medium">Day 3 · in 24h</td>
              <td className="py-4">
                <button className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-xs whitespace-nowrap">
                  Manual ping
                </button>
              </td>
            </tr>

            <tr>
              <td className="py-4">
                <p className="font-bold text-black">Khalid Al-Mulla</p>
                <p className="text-xs text-brand-muted mt-0.5">Abu Dhabi</p>
              </td>
              <td className="py-4 text-black font-medium">VisionCore</td>
              <td className="py-4">
                <span className="bg-[#e0dcd1] text-zinc-700 px-2 py-0.5 rounded text-xs font-bold border border-brand-border">Cold</span>
              </td>
              <td className="py-4 text-black font-medium">Sent · 3d ago</td>
              <td className="py-4 text-brand-muted">Day 7 · in 4d</td>
              <td className="py-4">
                <Link href="/leads/2" className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-xs">
                  View
                </Link>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="pt-6 text-center text-sm text-brand-muted">
          Showing 3 of 82 · <button className="hover:text-black font-medium">Load more</button>
        </div>
      </div>
    </div>
  );
}

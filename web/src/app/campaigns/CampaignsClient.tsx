"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Trash2, CheckSquare, Square, Loader2, AlertTriangle } from "lucide-react";
import { deleteCampaignAction, bulkDeleteCampaignsAction } from "../dashboard-actions";

export function CampaignsClient({ campaigns }: { campaigns: any[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'single' | 'bulk'; id?: string }>({ isOpen: false, type: 'single' });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === campaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaigns.map(c => c.id));
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (modalState.type === 'single' && modalState.id) {
      await deleteCampaignAction(modalState.id);
      setSelectedIds(prev => prev.filter(x => x !== modalState.id));
    } else if (modalState.type === 'bulk') {
      await bulkDeleteCampaignsAction(selectedIds);
      setSelectedIds([]);
    }
    setModalState({ isOpen: false, type: 'single' });
    setIsDeleting(false);
    router.refresh();
  };

  return (
    <>
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    {modalState.type === 'bulk' ? `Delete ${selectedIds.length} Campaigns?` : "Delete Campaign?"}
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    This action cannot be undone. This will permanently delete the campaign and all associated data.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-200">
              <button
                onClick={() => setModalState({ isOpen: false, type: 'single' })}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete {modalState.type === 'bulk' ? 'All' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Bulk Actions Header */}
        {campaigns.length > 0 && (
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-zinc-700 hover:text-black transition-colors"
            >
              {selectedIds.length === campaigns.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="font-medium text-zinc-800">Select All</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setModalState({ isOpen: true, type: 'bulk' })}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        )}

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {campaigns.map((c) => {
            const sentCount = c.leads?.filter((l: any) => l.sent).length || 0;
            const hotCount = c.leads?.filter((l: any) => l.status === "hot" || l.status === "Hot").length || 0;
            const totalLeads = c._count?.leads || 0;
            const progress = totalLeads > 0 ? Math.round((sentCount / totalLeads) * 100) : 0;
            const isSelected = selectedIds.includes(c.id);

            return (
              <div
                key={c.id}
                className={`group relative p-5 rounded-2xl border transition-all ${
                  isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-zinc-300 bg-white hover:border-zinc-500'
                }`}
              >
                {/* Select & Delete Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'single', id: c.id })}
                    disabled={isDeleting}
                    className="p-1.5 text-zinc-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleSelect(c.id)} className="text-zinc-500 hover:text-blue-700">
                    {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                </div>

                {/* Clickable Area for Navigation */}
                <div
                  onClick={(e) => {
                    // Prevent navigation if clicking select/delete
                    if ((e.target as HTMLElement).closest('button')) return;
                    router.push(c.status === "draft" ? `/campaigns/${c.id}/setup` : `/campaigns/${c.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4 pr-16">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-zinc-900 truncate group-hover:text-black">
                          {c.name || "Untitled Campaign"}
                        </h3>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            c.status === "active" ? "bg-emerald-500" : c.status === "draft" ? "bg-amber-400" : "bg-zinc-400"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-zinc-600 font-medium mt-0.5">
                        {totalLeads} leads · {c.status}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] text-zinc-600 font-medium mb-1.5">
                      <span>Progress</span>
                      <span className="text-zinc-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${c.status === "completed" ? "bg-emerald-500" : "bg-blue-600"}`}
                        style={{ width: `${c.status === "completed" ? 100 : progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                    <div className="flex items-center gap-3 text-xs text-zinc-600 font-medium">
                      <span><span className="font-bold text-zinc-900">{sentCount}</span> Sent</span>
                      <span><span className="font-bold text-emerald-600">{hotCount}</span> Hot</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

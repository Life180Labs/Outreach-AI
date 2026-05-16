"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  Loader2,
  Edit,
  Pause,
  Play,
  ChevronDown,
  X,
  Download,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  deleteLeadAction,
  bulkDeleteLeadsAction,
  bulkUpdateLeadsAction,
  updateLeadAction,
} from "../dashboard-actions";
import type { Lead } from "@/types";

// ─── Memoized Lead Row ───

const LeadRow = memo(function LeadRow({
  lead,
  selected,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onPause,
}: {
  lead: Lead;
  selected: boolean;
  loading: boolean;
  onSelect: (id: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onPause: (id: string, isPaused: boolean) => void;
}) {
  return (
    <tr className={`group hover:bg-zinc-50/80 transition-colors ${selected ? "bg-zinc-50" : ""}`}>
      <td className="px-4 py-4">
        <button
          onClick={() => onSelect(lead.id)}
          className="text-zinc-400 hover:text-black transition-colors"
          aria-label={`Select ${lead.firstName} ${lead.lastName}`}
        >
          {selected ? <CheckSquare className="w-4 h-4 text-black" /> : <Square className="w-4 h-4" />}
        </button>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-[11px] font-semibold text-zinc-700">
            {lead.firstName[0]}{lead.lastName?.[0] || ""}
          </div>
          <div>
            <p className="text-sm font-medium text-black">{lead.firstName} {lead.lastName}</p>
            <p className="text-xs text-zinc-600">{lead.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-sm text-black">{lead.companyName}</p>
        <p className="text-xs text-zinc-600">{lead.jobTitle || "—"}</p>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
          lead.replied || lead.status === "Hot"
            ? "bg-emerald-50 text-emerald-700"
            : lead.opened
            ? "bg-amber-50 text-amber-700"
            : "bg-zinc-100 text-zinc-600"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            lead.replied ? "bg-emerald-500" : lead.opened ? "bg-amber-500" : "bg-zinc-500"
          }`} />
          {lead.replied ? "Replied" : lead.opened ? "Opened" : "Cold"}
        </span>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs text-zinc-600">
          {lead.replied ? "Replied" : lead.opened ? "Opened" : lead.sent ? "Sent" : "Pending"}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {new Date(lead.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          <div className="relative group/tooltip">
            <button
              onClick={() => onEdit(lead)}
              className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-all"
              aria-label={`Edit ${lead.firstName}`}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover/tooltip:block z-50 bg-black border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-1 duration-200">
              Edit lead details
            </div>
          </div>

          <div className="relative group/tooltip">
            <button
              onClick={() => onPause(lead.id, !lead.isPaused)}
              className={`p-1.5 rounded-md transition-all ${lead.isPaused ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-zinc-500 hover:text-black hover:bg-zinc-100"}`}
              aria-label={lead.isPaused ? "Resume sequence" : "Pause sequence"}
            >
              {lead.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover/tooltip:block z-50 bg-black border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-1 duration-200">
              {lead.isPaused ? "Resume automated sequence" : "Pause automated sequence"}
            </div>
          </div>

          <div className="relative group/tooltip">
            <Link
              href={`/leads/${lead.id}`}
              className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-all"
              aria-label={`View ${lead.firstName}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover/tooltip:block z-50 bg-black border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-1 duration-200">
              Open conversation log
            </div>
          </div>

          <div className="relative group/tooltip">
            <button
              onClick={() => onDelete(lead.id)}
              disabled={loading}
              className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
              aria-label={`Delete ${lead.firstName}`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover/tooltip:block z-50 bg-black border border-red-500 text-red-500 text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-1 duration-200">
              Permanently delete lead
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
});

// ─── Edit Modal ───

function EditLeadModal({
  lead,
  loading,
  onSave,
  onClose,
}: {
  lead: Lead;
  loading: boolean;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-zinc-200">
        <form onSubmit={onSave}>
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Edit Lead</h3>
              <button type="button" onClick={onClose} className="p-1 text-zinc-400 hover:text-black rounded transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" name="firstName" defaultValue={lead.firstName} />
              <Field label="Last Name" name="lastName" defaultValue={lead.lastName} />
            </div>
            <Field label="Email" name="email" defaultValue={lead.email} />
            <Field label="Company" name="companyName" defaultValue={lead.companyName} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Job Title" name="jobTitle" defaultValue={lead.jobTitle} />
              <div>
                <label htmlFor="edit-status" className="text-xs font-medium text-zinc-500 mb-1 block">Status</label>
                <select id="edit-status" name="status" defaultValue={lead.status} className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400">
                  <option value="Cold">Cold</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Closed">Closed</option>
                  <option value="NotInterested">Not Interested</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-zinc-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label htmlFor={`edit-${name}`} className="text-xs font-medium text-zinc-500 mb-1 block">{label}</label>
      <input id={`edit-${name}`} name={name} defaultValue={defaultValue} className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-400" />
    </div>
  );
}

// ─── Main Component ───

export function LeadsClient({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'single' | 'bulk'; id?: string }>({ isOpen: false, type: 'single' });
  const router = useRouter();

  // Sync state with server-side filtered data
  useEffect(() => {
    setLeads(initialLeads);
    setSelectedIds([]); // Clear selection when filter changes
  }, [initialLeads]);

  const handleDelete = useCallback((id: string) => {
    setModalState({ isOpen: true, type: 'single', id });
  }, []);

  const handleBulkDeleteClick = () => {
    setModalState({ isOpen: true, type: 'bulk' });
  };

  const confirmDelete = async () => {
    if (modalState.type === 'single' && modalState.id) {
      const id = modalState.id;
      setLoading(id);
      const result = await deleteLeadAction(id);
      setLoading(null);
      if (result.success) setLeads(prev => prev.filter(l => l.id !== id));
    } else if (modalState.type === 'bulk') {
      setLoading("bulk");
      const result = await bulkDeleteLeadsAction(selectedIds);
      if (result.success) {
        setLeads(prev => prev.filter(l => !selectedIds.includes(l.id)));
        setSelectedIds([]);
      }
      setLoading(null);
    }
    setModalState({ isOpen: false, type: 'single' });
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === leads.length ? [] : leads.map(l => l.id));
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0 ? leads.filter(l => selectedIds.includes(l.id)) : leads;
    const headers = ["First Name", "Last Name", "Email", "Company", "Status", "Sent", "Opened", "Replied"];
    const rows = dataToExport.map(l => [l.firstName, l.lastName, l.email, l.companyName, l.status, l.sent ? "Yes" : "No", l.opened ? "Yes" : "No", l.replied ? "Yes" : "No"]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leads_export.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleBulkUpdate = async (data: Record<string, unknown>) => {
    setLoading("bulk");
    const result = await bulkUpdateLeadsAction(selectedIds, data);
    if (result.success) {
      setLeads(prev => prev.map(l => { const u = result.data.find(up => up.id === l.id); return u || l; }));
    }
    setSelectedIds([]);
    setShowBulkMenu(false);
    setLoading(null);
  };

  const handlePause = useCallback(async (id: string, isPaused: boolean) => {
    setLoading(id);
    const result = await bulkUpdateLeadsAction([id], { isPaused });
    setLoading(null);
    if (result.success) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, isPaused } : l));
      router.refresh();
    }
  }, [router]);

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLead) return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setLoading("edit");
    const result = await updateLeadAction(editingLead.id, data);
    if (result.success) setLeads(prev => prev.map(l => l.id === result.data.id ? result.data : l));
    setEditingLead(null);
    setLoading(null);
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
                    {modalState.type === 'bulk' ? `Delete ${selectedIds.length} Leads?` : "Delete Lead?"}
                  </h3>
                  <p className="text-sm text-zinc-600 mt-1">
                    This action cannot be undone. This will permanently delete the lead and all associated messages.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-200">
              <button
                onClick={() => setModalState({ isOpen: false, type: 'single' })}
                disabled={!!loading}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!loading}
                style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete {modalState.type === 'bulk' ? 'All' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
      {/* Bulk toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 text-white rounded-xl">
          <span className="text-xs font-medium">{selectedIds.length} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="relative">
            <button onClick={() => setShowBulkMenu(!showBulkMenu)} className="text-xs font-medium flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition-colors">
              Actions <ChevronDown className="w-3 h-3" />
            </button>
            {showBulkMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1 text-black">
                <button onClick={() => handleBulkUpdate({ status: "Hot" })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50">Mark as Hot</button>
                <button onClick={() => handleBulkUpdate({ status: "NotInterested" })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50">Mark Not Interested</button>
                <div className="border-t border-zinc-100 my-1" />
                <button onClick={() => handleBulkUpdate({ isPaused: true })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 flex items-center gap-2"><Pause className="w-3.5 h-3.5" /> Pause</button>
                <button onClick={() => handleBulkUpdate({ isPaused: false })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 flex items-center gap-2"><Play className="w-3.5 h-3.5" /> Resume</button>
              </div>
            )}
          </div>
          <div className="relative group/tooltip">
            <button onClick={handleExport} className="text-xs font-medium flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 bg-black border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 duration-200">
              Download selection as CSV
            </div>
          </div>

          <div className="relative group/tooltip ml-auto">
            <button onClick={handleBulkDeleteClick} className="text-xs font-medium flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition-colors text-red-300 hover:text-red-200">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block z-50 bg-black border border-red-500 text-red-400 text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 duration-200">
              Remove all selected leads
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-zinc-200 rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-black transition-colors" aria-label="Select all">
                    {selectedIds.length === leads.length && leads.length > 0 ? <CheckSquare className="w-4 h-4 text-black" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Company</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Activity</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No leads found</p>
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    selected={selectedIds.includes(lead.id)}
                    loading={loading === lead.id}
                    onSelect={toggleSelect}
                    onEdit={setEditingLead}
                    onDelete={handleDelete}
                    onPause={handlePause}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export button when no selection */}
      {selectedIds.length === 0 && leads.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleExport} className="text-xs font-medium text-zinc-600 hover:text-black flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}

      {editingLead && (
        <EditLeadModal lead={editingLead} loading={loading === "edit"} onSave={handleEditSave} onClose={() => setEditingLead(null)} />
      )}
    </div>
    </>
  );
}

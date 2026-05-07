"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ExternalLink, CheckSquare, Square, Loader2, Edit, Pause, Play, ChevronDown, X } from "lucide-react";
import { deleteLeadAction, bulkDeleteLeadsAction, bulkUpdateLeadsAction, updateLeadAction } from "../dashboard-actions";

export function LeadsClient({ leads: initialLeads }: { leads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setLoading(id);
    await deleteLeadAction(id);
    setLoading(null);
    router.refresh();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) return;
    setLoading("bulk");
    await bulkDeleteLeadsAction(selectedIds);
    setSelectedIds([]);
    setLoading(null);
    router.refresh();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0 
      ? leads.filter(l => selectedIds.includes(l.id))
      : leads;

    const headers = ["First Name", "Last Name", "Email", "Company", "Status", "Sent", "Opened", "Replied"];
    const rows = dataToExport.map(l => [
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
    link.setAttribute("download", `leads_export.csv`);
    link.click();
  };

  const handleBulkUpdate = async (data: any) => {
    setLoading("bulk");
    const updated = await bulkUpdateLeadsAction(selectedIds, data);
    setLeads(leads.map(l => {
      const u = updated.find((up: any) => up.id === l.id);
      return u || l;
    }));
    setSelectedIds([]);
    setShowBulkMenu(false);
    setLoading(null);
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    setLoading("edit");
    const updated = await updateLeadAction(editingLead.id, data);
    setLeads(leads.map(l => l.id === updated.id ? updated : l));
    setEditingLead(null);
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="bg-black text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-sm flex items-center gap-2"
              >
                Bulk Actions ({selectedIds.length}) <ChevronDown className="w-4 h-4" />
              </button>
              
              {showBulkMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-brand-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <button onClick={() => handleBulkUpdate({ status: 'Hot' })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">Mark as Hot</button>
                  <button onClick={() => handleBulkUpdate({ status: 'NotInterested' })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">Mark Not Interested</button>
                  <button onClick={() => handleBulkUpdate({ isPaused: true })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">Pause Follow-ups</button>
                  <button onClick={() => handleBulkUpdate({ isPaused: false })} className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">Resume Follow-ups</button>
                  <hr className="my-1 border-brand-border" />
                  <button onClick={handleBulkDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Delete Selected</button>
                </div>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          {selectedIds.length > 0 ? "Export Selected" : "Export CSV"}
        </button>
      </div>

      {/* Edit Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-brand-border animate-in fade-in zoom-in duration-200">
            <form onSubmit={handleEditSave} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black">Edit Lead Detail</h3>
                <button type="button" onClick={() => setEditingLead(null)} className="text-zinc-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">First Name</label>
                  <input name="firstName" defaultValue={editingLead.firstName} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Last Name</label>
                  <input name="lastName" defaultValue={editingLead.lastName} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Email</label>
                  <input name="email" defaultValue={editingLead.email} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Company</label>
                  <input name="companyName" defaultValue={editingLead.companyName} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Job Title</label>
                  <input name="jobTitle" defaultValue={editingLead.jobTitle} className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Status</label>
                  <select name="status" defaultValue={editingLead.status} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm">
                    <option value="Cold">Cold</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Closed">Closed</option>
                    <option value="NotInterested">Not Interested</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingLead(null)} className="flex-1 bg-zinc-50 text-black py-2.5 rounded-xl font-bold transition-colors text-sm border border-brand-border">Cancel</button>
                <button type="submit" disabled={loading === 'edit'} className="flex-1 bg-black text-white py-2.5 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2">
                  {loading === 'edit' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[900px]">
          <thead className="border-b border-brand-border text-brand-muted">
            <tr>
              <th className="pb-3 w-10">
                <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-black">
                  {selectedIds.length === leads.length && leads.length > 0 ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5" />}
                </button>
              </th>
              <th className="pb-3 font-semibold">Lead</th>
              <th className="pb-3 font-semibold">Company</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Last activity</th>
              <th className="pb-3 font-semibold">Follow-up due</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-brand-muted italic">No leads found.</td>
              </tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className={`hover:bg-zinc-50 transition-colors ${selectedIds.includes(lead.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-4">
                  <button onClick={() => toggleSelect(lead.id)} className="text-zinc-400 hover:text-black">
                    {selectedIds.includes(lead.id) ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5" />}
                  </button>
                </td>
                <td className="py-4">
                  <p className="font-bold text-black leading-tight">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{lead.email}</p>
                </td>
                <td className="py-4 text-black font-medium">{lead.companyName}</td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    lead.replied || lead.status === 'hot' ? 'bg-[#eef8ed] text-[#2b6528] border-[#b2ddab]' : 
                    lead.opened ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {lead.replied ? 'Hot (Replied)' : lead.opened ? 'Warm (Opened)' : 'Cold'}
                  </span>
                </td>
                <td className="py-4 text-black font-medium">
                  {lead.replied ? 'Replied' : lead.opened ? 'Opened' : lead.sent ? 'Sent' : 'Pending'} 
                  <div className="text-brand-muted font-normal text-[10px] mt-0.5">
                    {new Date(lead.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(lead.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-4">
                  {lead.replied || lead.isPaused ? (
                    <span className="text-brand-muted italic text-xs">{lead.isPaused ? 'Paused (manual)' : 'Paused (replied)'}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-black font-medium text-xs">Day 3 · queued</span>
                    </div>
                  )}
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button 
                      onClick={() => setEditingLead(lead)}
                      className="p-1.5 text-zinc-400 hover:text-black hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <Link 
                      href={`/leads/${lead.id}`} 
                      className="p-1.5 text-zinc-400 hover:text-black hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(lead.id)}
                      disabled={loading === lead.id}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 transition-all disabled:opacity-50"
                    >
                      {loading === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

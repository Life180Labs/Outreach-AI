"use client";

import { useState } from "react";
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
  Filter,
  MoreHorizontal,
  Users
} from "lucide-react";
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
      {/* 1. Dashboard Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">Leads Database</h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">Manage and track your outreach interactions</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-black/10 animate-in fade-in slide-in-from-right-4 duration-300">
              <span className="text-xs font-black uppercase tracking-widest border-r border-white/20 pr-3 mr-1">{selectedIds.length} Selected</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-lg transition-colors text-xs font-bold"
                >
                  Actions <ChevronDown className="w-3 h-3" />
                </button>
                <button 
                  onClick={handleExport}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Export Selected"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-red-400"
                  title="Delete Selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {showBulkMenu && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[60] overflow-hidden py-2 text-black animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-1">Status Updates</div>
                  <button onClick={() => handleBulkUpdate({ status: 'Hot' })} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 transition-colors flex items-center justify-between">Mark as Hot <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /></button>
                  <button onClick={() => handleBulkUpdate({ status: 'NotInterested' })} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 transition-colors">Mark Not Interested</button>
                  <div className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 my-1">Sequences</div>
                  <button onClick={() => handleBulkUpdate({ isPaused: true })} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2"><Pause className="w-3.5 h-3.5" /> Pause Leads</button>
                  <button onClick={() => handleBulkUpdate({ isPaused: false })} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2"><Play className="w-3.5 h-3.5" /> Resume Leads</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-600 hover:border-black transition-all">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
              <button 
                onClick={handleExport}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-2xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Leads Table */}
      <div className="bg-white border border-zinc-200/50 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleSelectAll} className="text-zinc-300 hover:text-black transition-colors">
                    {selectedIds.length === leads.length && leads.length > 0 ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lead Information</th>
                <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Organization</th>
                <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Current Status</th>
                <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Latest Activity</th>
                <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sequence Progress</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-10 h-10 text-zinc-200" />
                      <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest">No Leads Found</p>
                    </div>
                  </td>
                </tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className={`group hover:bg-zinc-50/80 transition-all ${selectedIds.includes(lead.id) ? 'bg-zinc-50' : ''}`}>
                  <td className="px-6 py-5">
                    <button onClick={() => toggleSelect(lead.id)} className="text-zinc-300 hover:text-black transition-colors">
                      {selectedIds.includes(lead.id) ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400">
                        {lead.firstName[0]}{lead.lastName?.[0] || ''}
                      </div>
                      <div>
                        <p className="text-sm font-black text-black leading-none">{lead.firstName} {lead.lastName}</p>
                        <p className="text-[11px] text-zinc-500 font-medium mt-1">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-sm font-bold text-black">{lead.companyName}</p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{lead.jobTitle || 'Decision Maker'}</p>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      lead.replied || lead.status === 'hot' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      lead.opened ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${lead.replied ? 'bg-emerald-500' : lead.opened ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                      {lead.replied ? 'Replied' : lead.opened ? 'Opened' : 'Cold'}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-xs font-bold text-black">{lead.replied ? 'Replied' : lead.opened ? 'Opened' : lead.sent ? 'Sent' : 'Pending'}</p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                      {new Date(lead.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(lead.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-4 py-5">
                    {lead.replied || lead.isPaused ? (
                      <div className="flex items-center gap-2">
                         <div className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                           {lead.isPaused ? 'Paused' : 'Goal Met'}
                         </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 w-24">
                        <div className="flex items-center justify-between text-[9px] font-black text-zinc-400 uppercase">
                          <span>Day 3</span>
                          <span>60%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="w-[60%] h-full bg-black rounded-full" />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingLead(lead)}
                        className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <Link 
                        href={`/leads/${lead.id}`} 
                        className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                        title="View Conversation"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(lead.id)}
                        disabled={loading === lead.id}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        title="Delete Lead"
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

      {/* 3. Edit Modal - UX Optimized */}
      {editingLead && (
        <div className="fixed inset-0 bg-zinc-950/20 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-zinc-200/50 animate-in zoom-in-95 duration-300">
            <form onSubmit={handleEditSave} className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-black tracking-tight">Refine Lead Details</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-1">Update primary contact and organization info</p>
                </div>
                <button type="button" onClick={() => setEditingLead(null)} className="p-2 bg-zinc-50 text-zinc-400 hover:text-black rounded-full transition-all border border-zinc-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-5 mb-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">First Name</label>
                  <input name="firstName" defaultValue={editingLead.firstName} className="w-full bg-zinc-50 border border-zinc-200 focus:border-black focus:bg-white transition-all rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input name="lastName" defaultValue={editingLead.lastName} className="w-full bg-zinc-50 border border-zinc-200 focus:border-black focus:bg-white transition-all rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Work Email</label>
                  <input name="email" defaultValue={editingLead.email} className="w-full bg-zinc-50 border border-zinc-200 focus:border-black focus:bg-white transition-all rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Organization</label>
                  <input name="companyName" defaultValue={editingLead.companyName} className="w-full bg-zinc-50 border border-zinc-200 focus:border-black focus:bg-white transition-all rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Job Title</label>
                  <input name="jobTitle" defaultValue={editingLead.jobTitle} className="w-full bg-zinc-50 border border-zinc-200 focus:border-black focus:bg-white transition-all rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Global Status</label>
                  <select name="status" defaultValue={editingLead.status} className="w-full bg-zinc-50 border border-zinc-200 focus:border-black focus:bg-white transition-all rounded-2xl px-4 py-3 text-sm font-medium outline-none appearance-none">
                    <option value="Cold">Cold</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Closed">Closed</option>
                    <option value="NotInterested">Not Interested</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setEditingLead(null)} className="flex-1 px-6 py-4 bg-white text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-200 hover:border-black transition-all">Cancel</button>
                <button type="submit" disabled={loading === 'edit'} className="flex-1 px-6 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10">
                  {loading === 'edit' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

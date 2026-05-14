"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, Save, X, Mail, Eye, EyeOff } from "lucide-react";

export default function AccountManager({ initialAccounts }: { initialAccounts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [accounts, setAccounts] = useState(initialAccounts);

  // Sync state with server props
  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const [form, setForm] = useState({
    name: "",
    host: "",
    port: "465",
    user: "",
    pass: ""
  });

  const handleEdit = (acc: any) => {
    setEditingId(acc.id);
    setForm({
      name: acc.name,
      host: acc.host,
      port: acc.port.toString(),
      user: acc.user,
      pass: "" 
    });
    const formElement = document.getElementById("smtp-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", host: "", port: "465", user: "", pass: "" });
    setShowPass(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const toastId = toast.loading(editingId ? "Updating SMTP connection..." : "Saving SMTP connection...");

    try {
      const url = editingId ? `/api/smtp/${editingId}` : "/api/smtp";
      const method = editingId ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save account");
      }

      toast.success(editingId ? "SMTP Account Updated" : "SMTP Account Added", { id: toastId });
      router.refresh(); // Trigger server data refresh
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMTP configuration? This will also remove it from any active campaigns.")) return;

    const toastId = toast.loading("Deleting account...");

    try {
      const res = await fetch(`/api/smtp/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete");
      
      toast.success("Account deleted", { id: toastId });
      
      // Optimistic UI update
      setAccounts(prev => prev.filter(a => a.id !== id));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      {/* List Existing SMTP Accounts */}
      <div className="space-y-4">
        {accounts.length > 0 ? (
          <div className="grid gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex justify-between items-center p-5 bg-zinc-50 rounded-2xl border border-zinc-200 group hover:border-zinc-300 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{acc.name}</p>
                    <p className="text-xs text-zinc-500 font-medium">{acc.user} <span className="mx-1 opacity-30">|</span> {acc.host}:{acc.port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(acc)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 transition-all"
                    title="Edit Configuration"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-100 transition-all"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-sm text-zinc-400">No SMTP accounts configured yet.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Account Form */}
      <div id="smtp-form" className="pt-8 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-100 rounded-lg">
              {editingId ? <Edit2 className="w-4 h-4 text-zinc-600" /> : <Plus className="w-4 h-4 text-zinc-600" />}
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              {editingId ? "Edit SMTP Connection" : "Add New Connection"}
            </h3>
          </div>
          {editingId && (
            <button 
              onClick={cancelEdit}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Display Name</label>
              <input 
                type="text" 
                required 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g. Sales Inbox" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">SMTP Host</label>
              <input 
                type="text" 
                required 
                value={form.host} 
                onChange={e => setForm({ ...form, host: e.target.value })} 
                placeholder="e.g. smtp.gmail.com" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">SMTP Port</label>
              <input 
                type="number" 
                required 
                value={form.port} 
                onChange={e => setForm({ ...form, port: e.target.value })} 
                placeholder="465 or 587" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Username / Email</label>
              <input 
                type="text" 
                required 
                value={form.user} 
                onChange={e => setForm({ ...form, user: e.target.value })} 
                placeholder="you@company.com" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none" 
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                App Password {editingId && <span className="font-normal lowercase opacity-50">(leave blank to keep current)</span>}
              </label>
              <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-zinc-900/5 focus-within:border-zinc-900 transition-all">
                <input 
                  type={showPass ? "text" : "password"} 
                  required={!editingId} 
                  value={form.pass} 
                  onChange={e => setForm({ ...form, pass: e.target.value })} 
                  placeholder={editingId ? "••••••••••••••••" : "Enter your secure app password"} 
                  className="w-full py-2.5 text-sm outline-none bg-transparent" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Saving..." : (editingId ? "Update Connection" : "Save Connection")}
              <Save className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

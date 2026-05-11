"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Mail, Zap, Globe, Check, Loader2, X, AlertCircle } from "lucide-react";
import { addAccount, deleteAccount } from "./actions";

type Account = {
  id: string;
  type: string;
  name: string;
  provider: string;
  isActive: boolean;
};

export function AccountManager({ accounts: initialAccounts }: { accounts: Account[] }) {
  // Sync state with props when the server revalidates the page
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    const res = await deleteAccount(id);
    if (res.success) {
      // Optimistic update
      setAccounts(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Convert form fields to config JSON
    const type = formData.get("type") as string;
    const configObj: any = {};
    if (type === "AI") {
      configObj.apiKey = formData.get("host"); // We used generic 'host' field in UI
    } else {
      configObj.host = formData.get("host");
      configObj.port = formData.get("port");
      configObj.user = formData.get("user");
      configObj.pass = formData.get("pass");
    }
    
    formData.append("config", JSON.stringify(configObj));
    
    const res = await addAccount(formData);
    if (res.success && res.account) {
      setAccounts(prev => [res.account as Account, ...prev]);
      setIsAdding(false);
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider">Managed Accounts</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition-all"
        >
          <Plus className="w-3 h-3" />
          ADD ACCOUNT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="p-4 rounded-xl border-2 border-zinc-100 bg-white hover:border-zinc-300 transition-all group animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  acc.type === 'AI' ? 'bg-purple-50 text-purple-600' : 
                  acc.type === 'SMTP' ? 'bg-blue-50 text-blue-600' : 
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {acc.type === 'AI' ? <Zap className="w-5 h-5" /> : 
                   acc.type === 'SMTP' ? <Globe className="w-5 h-5" /> : 
                   <Mail className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{acc.name}</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{acc.provider}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(acc.id)}
                className="p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${acc.isActive ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {acc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {acc.isActive ? (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                  <Check className="w-3 h-3" />
                  Primary
                </div>
              ) : (
                <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">
                  Make Primary
                </button>
              )}
            </div>
          </div>
        ))}

        {accounts.length === 0 && !isAdding && (
          <div className="col-span-full py-8 border-2 border-dashed border-zinc-100 rounded-xl flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Mail className="w-6 h-6 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No accounts added yet</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleAdd}>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-black">Add New Account</h3>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-black transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Account Type</label>
                    <select name="type" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all">
                      <option value="SMTP">SMTP Server</option>
                      <option value="GMAIL">Gmail Account</option>
                      <option value="AI">AI Provider</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Display Name</label>
                    <input name="name" required placeholder="e.g. Sales SMTP" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all" />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Provider</label>
                    <input name="provider" required placeholder="e.g. SendGrid, Gemini" className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all" />
                  </div>
                  
                  <div className="col-span-2 pt-2">
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-4">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Configuration Details
                      </p>
                      <input name="host" required placeholder="Host / API Key" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all" />
                      <div className="grid grid-cols-2 gap-4">
                        <input name="user" placeholder="User / Email (Optional)" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all" />
                        <input name="pass" type="password" placeholder="Pass (Optional)" className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-black transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  CREATE ACCOUNT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

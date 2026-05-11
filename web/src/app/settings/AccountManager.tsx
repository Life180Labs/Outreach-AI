"use client";

import { useState } from "react";
import { Plus, Trash2, Mail, Zap, Globe, Check, Loader2 } from "lucide-react";

type Account = {
  id: string;
  type: string;
  name: string;
  provider: string;
  isActive: boolean;
};

export function AccountManager({ accounts: initialAccounts }: { accounts: any[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
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
          <div key={acc.id} className="p-4 rounded-xl border-2 border-zinc-100 bg-white hover:border-zinc-300 transition-all group">
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
    </div>
  );
}

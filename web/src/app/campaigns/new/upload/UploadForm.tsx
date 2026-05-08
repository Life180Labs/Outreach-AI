"use client";

import { useState } from "react";
import Papa from "papaparse";
import { createCampaignFromUpload } from "../../actions";
import { ArrowRight, Loader2 } from "lucide-react";

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const parseData = (data: string | File) => {
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as any[];
        const validLeads = [];
        const errs = [];
        const seenEmails = new Set();

        for (let i = 0; i < parsed.length; i++) {
          const row = parsed[i];

          // Flexible mapping for common headers
          const getVal = (keys: string[]) => {
            const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().replace(/[\s_]/g, '')));
            return key ? row[key] : null;
          };

          const firstName = getVal(['firstname', 'fname', 'first']) || "";
          const lastName = getVal(['lastname', 'lname', 'last']) || "";
          const email = (getVal(['email', 'emailaddress']) || "").trim().toLowerCase();
          const companyName = getVal(['companyname', 'company', 'corp']) || "";
          const jobTitle = getVal(['jobtitle', 'title', 'role']) || "";
          const sector = getVal(['sector', 'type', 'industry']) || "";
          const city = getVal(['city', 'location', 'town']) || "";
          const linkedinUrl = getVal(['linkedinurl', 'linkedin', 'profile']) || "";
          const notes = getVal(['notes', 'comment', 'description']) || "";

          const normalizedRow = {
            firstName, lastName, email, companyName, jobTitle, sector, city, linkedinUrl, notes
          };

          if (!email) {
            errs.push({ name: firstName || 'Unknown', email: '—', issue: 'Missing' });
            continue;
          }
          if (!email.includes('@')) {
            errs.push({ name: firstName || 'Unknown', email: email, issue: 'Bad format' });
            continue;
          }
          if (seenEmails.has(email)) {
            errs.push({ name: firstName || 'Unknown', email: email, issue: 'Duplicate' });
            continue;
          }
          seenEmails.add(email);
          validLeads.push(normalizedRow);
        }

        setLeads(validLeads);
        setErrors(errs);
        setSheetLoading(false);
      },
      error: () => {
        setSheetLoading(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    parseData(f);
  };

  const handleSheetImport = async () => {
    if (!sheetUrl) return;
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      alert("Invalid Google Sheets URL");
      return;
    }
    setSheetLoading(true);
    try {
      const sheetId = match[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("Could not fetch");
      const csvText = await res.text();
      parseData(csvText);
    } catch (e) {
      alert("Failed to fetch Google Sheet. Make sure it is public.");
      setSheetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (leads.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("campaignName", "Untitled Campaign");
    formData.append("leadsData", JSON.stringify(leads));

    try {
      await createCampaignFromUpload(formData);
    } catch (e: any) {
      if (e.message?.includes("NEXT_REDIRECT")) return;
      console.error(e);
      alert("Error creating campaign: " + (e.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-8 flex flex-col items-center text-center">
          <p className="text-black font-medium mb-4">Paste Google Sheets link</p>
          <div className="w-full flex gap-2 mb-4">
            <input
              type="text"
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="flex-1 bg-white border border-brand-border rounded-lg px-4 py-2.5 text-black focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSheetImport}
              disabled={sheetLoading}
              className="bg-black hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 inline-flex items-center"
            >
              {sheetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
            </button>
          </div>
          <p className="text-brand-muted text-sm mb-4">or</p>
          <label className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer inline-block shadow-sm">
            Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <p className="text-black font-semibold mb-4 text-sm">Supported fields</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-brand-muted">
            <span>First name</span><span>Last name</span>
            <span>Email</span><span>Company</span>
            <span>Sector / type</span><span>Location</span>
            <span>LinkedIn URL</span><span>Notes</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-black font-semibold text-sm mb-2">Validation results</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-4xl font-semibold text-emerald-600 mb-1">{leads.length || '—'}</p>
            <p className="text-brand-muted text-sm">Valid leads</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
            <p className="text-4xl font-semibold text-red-600 mb-1">{errors.length || '—'}</p>
            <p className="text-brand-muted text-sm">Errors & Dups</p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
            <p className="text-orange-900 text-sm">{errors.length} leads have invalid/missing emails or are duplicates. Fix or skip to continue with {leads.length}.</p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-brand-muted">Name</th>
                  <th className="px-4 py-3 font-semibold text-brand-muted">Email</th>
                  <th className="px-4 py-3 font-semibold text-brand-muted">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {errors.slice(0, 5).map((err, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-black">{err.name}</td>
                    <td className="px-4 py-3 text-brand-muted truncate max-w-[150px]">{err.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {err.issue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {leads.length > 0 && (
          <div className="flex items-center gap-3 pt-4 justify-end">
            {errors.length > 0 && (
              <button type="button" className="bg-white border border-brand-border hover:bg-zinc-50 text-black px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                Fix errors
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1 text-sm shadow-sm"
            >
              {loading ? 'Processing...' : `Continue with ${leads.length}`} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

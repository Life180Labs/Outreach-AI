"use client";

import { useState, useMemo } from "react";
import Papa from "papaparse";
import { createCampaignFromUpload } from "../../actions";
import { ArrowRight, Loader2, Upload, Link2, ChevronDown, Check, AlertTriangle, X, Table2 } from "lucide-react";

const KNOWN_FIELDS = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "companyName", label: "Company" },
  { value: "jobTitle", label: "Job Title" },
  { value: "sector", label: "Sector / Industry" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "linkedinUrl", label: "LinkedIn URL" },
  { value: "notes", label: "Notes" },
];

const FUZZY_MAP: Record<string, string> = {
  firstname: "firstName", fname: "firstName", first: "firstName", "first name": "firstName",
  lastname: "lastName", lname: "lastName", last: "lastName", "last name": "lastName",
  email: "email", emailaddress: "email", "email address": "email",
  companyname: "companyName", company: "companyName", corp: "companyName", organization: "companyName", organisation: "companyName",
  jobtitle: "jobTitle", title: "jobTitle", role: "jobTitle", designation: "jobTitle", "job title": "jobTitle",
  sector: "sector", type: "sector", industry: "sector",
  city: "city", location: "city", town: "city",
  country: "country", region: "country",
  linkedinurl: "linkedinUrl", linkedin: "linkedinUrl", profile: "linkedinUrl", "linkedin url": "linkedinUrl",
  notes: "notes", comment: "notes", description: "notes", remarks: "notes",
  zipcode: "skip", zip: "skip", "zip code": "skip", postalcode: "skip",
};

function guessMapping(header: string): string {
  const normalized = header.toLowerCase().replace(/[\s_\-\.]/g, "");
  return FUZZY_MAP[normalized] || FUZZY_MAP[header.toLowerCase()] || "skip";
}

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "map">("upload");

  const parseData = (data: string | File) => {
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as Record<string, string>[];
        if (parsed.length === 0) return;

        const headers = Object.keys(parsed[0]);
        setRawHeaders(headers);
        setRawData(parsed);

        // Auto-suggest mappings
        const autoMappings: Record<string, string> = {};
        const usedFields = new Set<string>();
        for (const header of headers) {
          const guess = guessMapping(header);
          if (guess !== "skip" && !usedFields.has(guess)) {
            autoMappings[header] = guess;
            usedFields.add(guess);
          } else {
            autoMappings[header] = "skip";
          }
        }
        setMappings(autoMappings);
        setStep("map");
        setSheetLoading(false);
      },
      error: () => {
        setSheetLoading(false);
      },
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

  const updateMapping = (header: string, field: string) => {
    setMappings((prev) => {
      const next = { ...prev };
      // If another header is already mapped to this field, unmap it
      if (field !== "skip") {
        for (const key in next) {
          if (next[key] === field && key !== header) {
            next[key] = "skip";
          }
        }
      }
      next[header] = field;
      return next;
    });
  };

  // Build the leads from raw data using the current mappings
  const { validLeads, validationErrors } = useMemo(() => {
    if (rawData.length === 0) return { validLeads: [], validationErrors: [] };

    const leads: any[] = [];
    const errs: any[] = [];
    const seenEmails = new Set<string>();

    // Build a reverse map: field -> header
    const reverseMap: Record<string, string> = {};
    for (const [header, field] of Object.entries(mappings)) {
      if (field !== "skip") {
        reverseMap[field] = header;
      }
    }

    // Identify skipped headers (for extra notes)
    const skippedHeaders = rawHeaders.filter((h) => mappings[h] === "skip");

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      const getValue = (field: string) => {
        const header = reverseMap[field];
        return header ? (row[header] || "").trim() : "";
      };

      const email = getValue("email").toLowerCase();
      const firstName = getValue("firstName");
      const lastName = getValue("lastName");

      // Build extra notes from unmapped columns
      const extraNotes = skippedHeaders
        .map((h) => (row[h] ? `${h}: ${row[h]}` : ""))
        .filter(Boolean)
        .join(" | ");

      const baseNotes = getValue("notes");
      const combinedNotes = [baseNotes, extraNotes].filter(Boolean).join(" | ");

      if (!email) {
        errs.push({ name: firstName || "Unknown", email: "—", issue: "Missing email" });
        continue;
      }
      if (!email.includes("@")) {
        errs.push({ name: firstName || "Unknown", email, issue: "Bad format" });
        continue;
      }
      if (seenEmails.has(email)) {
        errs.push({ name: firstName || "Unknown", email, issue: "Duplicate" });
        continue;
      }
      seenEmails.add(email);

      leads.push({
        firstName,
        lastName,
        email,
        companyName: getValue("companyName"),
        jobTitle: getValue("jobTitle"),
        sector: getValue("sector"),
        city: getValue("city"),
        country: getValue("country"),
        linkedinUrl: getValue("linkedinUrl"),
        notes: combinedNotes,
      });
    }

    return { validLeads: leads, validationErrors: errs };
  }, [rawData, mappings, rawHeaders]);

  const hasEmailMapping = Object.values(mappings).includes("email");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validLeads.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("campaignName", "Untitled Campaign");
    formData.append("leadsData", JSON.stringify(validLeads));

    try {
      await createCampaignFromUpload(formData);
    } catch (e: any) {
      if (e.message?.includes("NEXT_REDIRECT")) return;
      console.error(e);
      alert("Error creating campaign: " + (e.message || "Unknown error"));
      setLoading(false);
    }
  };

  // ─── Upload Step ───
  if (step === "upload") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-black tracking-tight">Import Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">Upload a CSV or paste a Google Sheets link to get started</p>
        </div>

        <div className="p-8 rounded-2xl border border-zinc-200 bg-white space-y-6">
          {/* Google Sheets */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">
              <Link2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Google Sheets URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors"
              />
              <button
                type="button"
                onClick={handleSheetImport}
                disabled={sheetLoading || !sheetUrl}
                className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm inline-flex items-center gap-2"
              >
                {sheetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs font-medium text-zinc-300 uppercase">or</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* CSV Upload */}
          <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:border-zinc-400 hover:bg-zinc-50/50 transition-all group">
            <Upload className="w-8 h-8 text-zinc-300 group-hover:text-zinc-500 transition-colors mb-3" />
            <span className="text-sm font-medium text-zinc-600">Upload CSV file</span>
            <span className="text-xs text-zinc-400 mt-1">Drag & drop or click to browse</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/50">
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">All columns accepted.</span> After import, you'll be able to map each column to the correct field. 
            Required field: <span className="font-semibold">Email</span>. Other fields like Name, Company, Title, etc. are optional but improve AI personalization.
          </p>
        </div>
      </div>
    );
  }

  // ─── Mapping Step ───
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Map Your Fields</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {rawData.length} rows imported · {rawHeaders.length} columns detected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setStep("upload"); setRawData([]); setRawHeaders([]); }}
            className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            ← Re-upload
          </button>
          <button
            type="submit"
            disabled={loading || validLeads.length === 0 || !hasEmailMapping}
            className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm inline-flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continue with {validLeads.length} leads
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Field Mapping */}
        <div className="flex-1 lg:w-[58.33%] space-y-4">
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-2 mb-5">
              <Table2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-black">Column Mapping</h2>
            </div>

            <div className="space-y-3">
              {rawHeaders.map((header) => {
                const currentMapping = mappings[header] || "skip";
                const matchedField = KNOWN_FIELDS.find((f) => f.value === currentMapping);
                const isRequired = currentMapping === "email";

                return (
                  <div
                    key={header}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                      currentMapping !== "skip"
                        ? "border-blue-100 bg-blue-50/30"
                        : "border-zinc-100 bg-zinc-50/30"
                    }`}
                  >
                    {/* Source column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-black truncate">{header}</span>
                        {rawData[0]?.[header] && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-[180px]" title={rawData[0][header]}>
                            e.g. "{rawData[0][header]}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />

                    {/* Target field dropdown */}
                    <div className="relative w-48 shrink-0">
                      <select
                        value={currentMapping}
                        onChange={(e) => updateMapping(header, e.target.value)}
                        className={`w-full appearance-none rounded-lg border px-3 py-2 text-sm font-medium pr-8 cursor-pointer transition-colors focus:outline-none ${
                          currentMapping !== "skip"
                            ? "bg-white border-blue-200 text-blue-700"
                            : "bg-white border-zinc-200 text-zinc-400"
                        }`}
                      >
                        <option value="skip">— Skip —</option>
                        {KNOWN_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* Status */}
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {currentMapping !== "skip" ? (
                        <Check className="w-4 h-4 text-blue-500" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasEmailMapping && (
              <div className="mt-4 p-3 rounded-xl border border-red-100 bg-red-50/50 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-medium">
                  You must map at least one column to "Email" to continue.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Validation Results */}
        <div className="flex-1 lg:w-[41.66%] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white">
              <p className="text-3xl font-semibold text-emerald-600 mb-1">{validLeads.length}</p>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Valid Leads</p>
            </div>
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white">
              <p className="text-3xl font-semibold text-red-500 mb-1">{validationErrors.length}</p>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Errors</p>
            </div>
          </div>

          {/* Mapped Fields Summary */}
          <div className="p-5 rounded-2xl border border-zinc-200 bg-white">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Mapped Fields</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(mappings)
                .filter(([, v]) => v !== "skip")
                .map(([header, field]) => {
                  const label = KNOWN_FIELDS.find((f) => f.value === field)?.label || field;
                  return (
                    <span key={header} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
                      {label}
                    </span>
                  );
                })}
              {Object.values(mappings).filter((v) => v !== "skip").length === 0 && (
                <span className="text-xs text-zinc-400">No fields mapped yet</span>
              )}
            </div>
          </div>

          {/* Preview */}
          {validLeads.length > 0 && (
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Preview (First Lead)</h3>
              <div className="space-y-2">
                {Object.entries(validLeads[0]).map(([key, value]) => {
                  if (!value) return null;
                  const label = KNOWN_FIELDS.find((f) => f.value === key)?.label || key;
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-tight w-20 shrink-0 pt-0.5">{label}</span>
                      <span className="text-sm text-zinc-700 break-all">{value as string}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Errors */}
          {validationErrors.length > 0 && (
            <div className="p-5 rounded-2xl border border-red-100 bg-red-50/50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide">{validationErrors.length} Issues</h3>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {validationErrors.slice(0, 10).map((err, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-red-800 truncate">{err.name} ({err.email})</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 font-medium shrink-0 ml-2">{err.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

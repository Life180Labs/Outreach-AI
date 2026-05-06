"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadInput, LeadValidationError } from "@/types/leads";
import { parseCsv } from "@/features/leads/parseCsv";
import { validateLeads } from "@/features/leads/validateLeads";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ValidationErrorTable } from "@/components/leads/ValidationErrorTable";

type UploadMode = "csv" | "google_sheets";

async function readFileAsText(file: File): Promise<string> {
  return await file.text();
}

export function LeadUploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("csv");
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [validLeads, setValidLeads] = useState<LeadInput[]>([]);
  const [errors, setErrors] = useState<LeadValidationError[]>([]);

  const hasErrors = errors.length > 0;
  const hasValid = validLeads.length > 0;

  const supportedFields = useMemo(
    () => [
      "firstName",
      "lastName",
      "jobTitle",
      "companyName",
      "email",
      "sector",
      "city",
      "zipcode",
      "country",
      "linkedinUrl",
      "notes",
    ],
    [],
  );

  async function onValidate(): Promise<void> {
    setErrors([]);
    setValidLeads([]);

    if (mode === "google_sheets") {
      // Phase 1: UI + validation only. Backend integration comes in Phase 1.5/2.
      const trimmed = googleSheetUrl.trim();
      if (trimmed.length === 0) {
        setErrors([{ rowNumber: 0, field: "googleSheetUrl", message: "Google Sheets link is required" }]);
        return;
      }
      if (!trimmed.startsWith("https://")) {
        setErrors([{ rowNumber: 0, field: "googleSheetUrl", message: "Google Sheets link must be a valid URL" }]);
        return;
      }
      setErrors([
        {
          rowNumber: 0,
          field: "googleSheetUrl",
          message: "Google Sheets import is stubbed for Phase 1. Upload a CSV for now.",
        },
      ]);
      return;
    }

    if (!csvFile) {
      setErrors([{ rowNumber: 0, field: "csvFile", message: "CSV file is required" }]);
      return;
    }

    const text = await readFileAsText(csvFile);
    const parsed = parseCsv(text);
    if (parsed.headers.length === 0) {
      setErrors([{ rowNumber: 0, field: "csv", message: "CSV appears to be empty" }]);
      return;
    }

    const validated = validateLeads(parsed.rows);
    setErrors(validated.errors);
    setValidLeads(validated.validLeads);
  }

  function onContinue(): void {
    // Phase 1 stores validated leads in sessionStorage so we can proceed to the next screen
    // without introducing DB persistence yet.
    sessionStorage.setItem("phase1.validLeads", JSON.stringify(validLeads));
    router.push("/campaign/setup");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("csv")}
          className={[
            "rounded-xl border px-4 py-3 text-left transition-colors",
            mode === "csv"
              ? "border-zinc-950 bg-zinc-950 text-white"
              : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
          ].join(" ")}
        >
          <div className="text-sm font-semibold">CSV upload</div>
          <div className="mt-1 text-sm opacity-80">Fastest way to validate and proceed.</div>
        </button>
        <button
          type="button"
          onClick={() => setMode("google_sheets")}
          className={[
            "rounded-xl border px-4 py-3 text-left transition-colors",
            mode === "google_sheets"
              ? "border-zinc-950 bg-zinc-950 text-white"
              : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
          ].join(" ")}
        >
          <div className="text-sm font-semibold">Google Sheets link</div>
          <div className="mt-1 text-sm opacity-80">Phase 1 UI only; integration follows.</div>
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-zinc-950">Supported fields</div>
          <div className="text-sm text-zinc-600">
            Required: <span className="font-medium">firstName, lastName, jobTitle, companyName, email</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {supportedFields.map((f) => (
            <span
              key={f}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {mode === "csv" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-800">CSV file</label>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-zinc-500">
                Tip: Use a small batch first. Duplicates by email are blocked to prevent double-sends.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-800">Google Sheets link</label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
              />
              <div className="text-xs text-zinc-500">
                Phase 1: We’ll validate the link format only. Import will be wired through the backend later.
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => void onValidate()}>
              Validate leads
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!hasValid}
              onClick={onContinue}
              title={hasValid ? "" : "Validate a file first"}
            >
              Continue with valid leads only
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500">Valid leads</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-950">{validLeads.length}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500">Errors</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-950">{errors.length}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500">Status</div>
              <div className="mt-1 text-sm font-medium text-zinc-700">
                {hasErrors ? "Needs fixes" : hasValid ? "Ready" : "Waiting"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasErrors ? <ValidationErrorTable errors={errors} /> : null}
    </div>
  );
}


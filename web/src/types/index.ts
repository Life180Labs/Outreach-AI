import type { Prisma } from "@prisma/client";

// ─── Base Model Types (inferred from Prisma schema) ───

export type Lead = Prisma.LeadGetPayload<{}>;

export type Campaign = Prisma.CampaignGetPayload<{}>;

export type Message = Prisma.MessageGetPayload<{}>;

export type Settings = Prisma.SettingsGetPayload<{}>;

// ─── Composite Types (with relations) ───

export type LeadWithMessages = Prisma.LeadGetPayload<{
  include: { messages: true; campaign: true };
}>;

export type LeadWithCampaign = Prisma.LeadGetPayload<{
  include: { campaign: true };
}>;

export type CampaignWithLeadCounts = Prisma.CampaignGetPayload<{
  include: {
    _count: { select: { leads: true } };
    leads: { select: { sent: true; status: true } };
  };
}>;

// ─── Server Action Result Pattern ───

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Lead Input (for CSV upload) ───

export type LeadInput = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  email: string;
  sector?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  linkedinUrl?: string;
  notes?: string;
};

export type LeadValidationError = {
  rowNumber: number;
  field: string;
  message: string;
};

export type LeadValidationResult = {
  validLeads: LeadInput[];
  errors: LeadValidationError[];
};

// ─── AI Draft Types ───

export type EmailDraft = {
  subject: string;
  body: string;
  rationale: string;
};

// ─── Lead Status Enum ───

export const LEAD_STATUSES = ["Cold", "Warm", "Hot", "Closed", "NotInterested"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// ─── Campaign Status Enum ───

export const CAMPAIGN_STATUSES = ["draft", "active", "completed", "paused"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

import { z } from "zod";

/**
 * Lead schema used for ingest validation (Wireframe Screen 2).
 * We keep this strict because downstream AI + email sending should never see malformed data.
 */
export const leadInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  jobTitle: z.string().trim().min(1, "Job title is required"),
  companyName: z.string().trim().min(1, "Company name is required"),
  email: z.string().trim().email("Invalid email address"),
  sector: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  zipcode: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  linkedinUrl: z.string().trim().url("Invalid LinkedIn URL").optional(),
  notes: z.string().trim().min(1).optional(),
});

export type LeadInputSchema = z.infer<typeof leadInputSchema>;


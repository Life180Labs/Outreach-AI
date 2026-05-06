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


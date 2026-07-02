// Core entities — blueprint §17, ported 1:1 + extensions.

export type QuoteStage =
  | "new"
  | "following_up"
  | "confirmed"
  | "deposit_paid"
  | "scheduled"
  | "installed";

export const STAGES: { key: QuoteStage; label: string }[] = [
  { key: "new", label: "New Quote" },
  { key: "following_up", label: "Following Up" },
  { key: "confirmed", label: "Quote Confirmed" },
  { key: "deposit_paid", label: "Deposit Paid" },
  { key: "scheduled", label: "Scheduled" },
  { key: "installed", label: "Installed / Paid" },
];

export type UserRole = "admin" | "manager";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string; // plain-text for scaffold; swap bcrypt in production
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  suburb: string;
  address: string; // full street address for invoices
  source: string;
  created_at: string;
}

export type FabricColour = "Black" | "Charcoal" | "Sand" | "Silver";

export const FABRIC_COLOURS: { name: FabricColour; hex: string; light: boolean }[] = [
  { name: "Black",    hex: "#1c2733", light: false },
  { name: "Charcoal", hex: "#454f57", light: false },
  { name: "Sand",     hex: "#cdbfa3", light: true  },
  { name: "Silver",   hex: "#aab4bd", light: true  },
];

export interface QuoteInputs {
  length: number;
  width: number;
  shape: "auto" | "square" | "rectangle" | "triangle";
  range: "any" | "Standard" | "Extreme";
  poles: boolean;
  colour: FabricColour;
}

export interface QuoteLineItem {
  label: string;
  amount: number;
}

export interface Quote {
  id: string;
  customer_id: string;
  status: QuoteStage;
  inputs: QuoteInputs;
  line_items: QuoteLineItem[];
  net_label: string;
  subtotal: number;
  vat: number;
  estimate_low: number;
  estimate_high: number;
  final_total: number | null;
  final_line_items: QuoteLineItem[] | null; // editable breakdown once confirmed
  public_token?: string | null;  // unguessable token for the client quote link
  accepted_at?: string | null;   // set when the client accepts online
  archived: boolean;
  exceeded: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  quote_id: string;
  type: "deposit" | "balance";
  amount: number;
  status: "unpaid" | "paid";
  payfast_id: string | null;
  proof_url?: string | null;
  payment_note?: string;
  pdf_url: string | null;
  issued_at: string;
  paid_at: string | null;
}

export interface Installation {
  id: string;
  quote_id: string;
  scheduled_date: string;
  installer: string;
  status: "pending" | "done";
  notes: string;
}

export interface PricingRate {
  key: string;
  label: string;
  unit: string;
  rate: number;
  group: "sail" | "structure" | "labour" | "policy" | "custom";
}

export interface Activity {
  id: string;
  quote_id: string;
  user: string;       // display name of the acting user
  user_id: string;    // AdminUser.id (or "system")
  type: string;
  message: string;
  created_at: string;
}

export interface Content {
  id: string;
  type: "page" | "gallery" | "post" | "block";
  slug: string;
  title: string;
  body: string;
  image: string;
  meta: Record<string, string>;
  published: boolean;
  created_at: string;
}

export interface Settings {
  company_name: string;
  company_address: string;  // for invoices
  vat_number: string;
  vat_enabled: boolean;
  deposit_pct: number;
  email_from: string;
  whatsapp: string;
  facebook_url: string;
  instagram_url: string;
  admin_password: string;   // legacy fallback; per-user auth takes priority
  resend_api_key: string;
  ga_measurement_id: string;
  eft_details?: string; // bank details shown on the EFT payment option (multiline)
  email_templates: Record<string, { subject: string; body: string }>;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  sent_at: string;
  channel: "resend" | "outbox";
  status: "sent" | "queued" | "failed";
}

export interface DB {
  customers: Customer[];
  quotes: Quote[];
  invoices: Invoice[];
  installations: Installation[];
  pricing: PricingRate[];
  activities: Activity[];
  content: Content[];
  settings: Settings;
  users: AdminUser[];
  emails: EmailLog[];
  counters: { invoice: number };
}

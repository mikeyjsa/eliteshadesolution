import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await mutate((db) => {
    const s = db.settings;
    const str = [
      "company_name",
      "vat_number",
      "email_from",
      "sales_email",
      "info_email",
      "notification_emails",
      "whatsapp",
      "sales_name",
      "sales_role",
      "sales_phone",
      "sales_whatsapp",
      "marketing_name",
      "marketing_role",
      "marketing_phone",
      "admin_password",
      "paygate_merchant_id",
      "paygate_merchant_key",
      "paygate_passphrase",
      "paygate_return_url",
      "paygate_notify_url",
    ] as const;
    for (const k of str) if (typeof body[k] === "string") s[k] = body[k];
    // resend key may be set OR cleared (empty string switches back to Outbox-only)
    if (typeof body.resend_api_key === "string") s.resend_api_key = body.resend_api_key.trim();
    if (typeof body.ga_measurement_id === "string") s.ga_measurement_id = body.ga_measurement_id.trim();
    if (typeof body.company_address === "string") s.company_address = body.company_address;
    if (typeof body.eft_details === "string") s.eft_details = body.eft_details;
    if (body.payment_mode === "eft_only" || body.payment_mode === "payfast_and_eft") s.payment_mode = body.payment_mode;
    if (body.email_provider === "outbox" || body.email_provider === "resend" || body.email_provider === "smtp") s.email_provider = body.email_provider;
    if (typeof body.smtp_host === "string") s.smtp_host = body.smtp_host.trim();
    if (typeof body.smtp_user === "string") s.smtp_user = body.smtp_user.trim();
    if (typeof body.smtp_pass === "string") s.smtp_pass = body.smtp_pass;
    if (typeof body.smtp_port === "number" && Number.isFinite(body.smtp_port)) s.smtp_port = body.smtp_port;
    if (typeof body.smtp_secure === "boolean") s.smtp_secure = body.smtp_secure;
    if (typeof body.facebook_url === "string") s.facebook_url = body.facebook_url.trim();
    if (typeof body.instagram_url === "string") s.instagram_url = body.instagram_url.trim();
    if (typeof body.vat_enabled === "boolean") s.vat_enabled = body.vat_enabled;
    if (typeof body.deposit_pct === "number") s.deposit_pct = body.deposit_pct;
    if (body.email_templates) {
      for (const key of Object.keys(body.email_templates)) {
        s.email_templates[key] = { ...s.email_templates[key], ...body.email_templates[key] };
      }
    }
  });
  return NextResponse.json({ ok: true });
}

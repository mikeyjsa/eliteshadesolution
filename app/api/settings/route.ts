import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { AnalyticsCredentialError, normalizeAnalyticsPrivateKey } from "@/lib/ga-credentials";

export async function PATCH(req: NextRequest) {
  const me = await currentUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json();
  let analyticsKey: string | undefined;
  if (typeof body.ga_service_account_private_key === "string" && body.ga_service_account_private_key.trim()) {
    try {
      analyticsKey = normalizeAnalyticsPrivateKey(
        body.ga_service_account_private_key,
        typeof body.ga_service_account_email === "string" ? body.ga_service_account_email : "",
      );
    } catch (error) {
      if (!(error instanceof AnalyticsCredentialError)) throw error;
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
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
      "ga_property_id",
      "ga_service_account_email",
      "paygate_merchant_id",
      "paygate_merchant_key",
      "paygate_passphrase",
      "paygate_return_url",
      "paygate_notify_url",
    ] as const;
    for (const k of str) if (typeof body[k] === "string") s[k] = body[k];
    if (analyticsKey) s.ga_service_account_private_key = analyticsKey;
    // The legacy shared password is intentionally no longer editable in Settings.
    // resend key may be set OR cleared (empty string switches back to Outbox-only)
    if (typeof body.resend_api_key === "string") s.resend_api_key = body.resend_api_key.trim();
    if (typeof body.ga_measurement_id === "string") s.ga_measurement_id = body.ga_measurement_id.trim();
    if (typeof body.company_address === "string") s.company_address = body.company_address;
    if (typeof body.eft_details === "string") s.eft_details = body.eft_details;
    if (body.payment_mode === "eft_only" || body.payment_mode === "payfast_and_eft") s.payment_mode = body.payment_mode;
    if (body.email_provider === "outbox" || body.email_provider === "resend" || body.email_provider === "smtp") s.email_provider = body.email_provider;
    if (typeof body.smtp_host === "string") s.smtp_host = body.smtp_host.trim();
    if (typeof body.smtp_user === "string") s.smtp_user = body.smtp_user.trim();
    // An empty password from the browser means "keep the saved credential".
    if (typeof body.smtp_pass === "string" && body.smtp_pass.length > 0) s.smtp_pass = body.smtp_pass;
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

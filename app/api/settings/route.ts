import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await mutate((db) => {
    const s = db.settings;
    const str = ["company_name", "vat_number", "email_from", "whatsapp", "admin_password"] as const;
    for (const k of str) if (typeof body[k] === "string" && body[k]) s[k] = body[k];
    // resend key may be set OR cleared (empty string switches back to Outbox-only)
    if (typeof body.resend_api_key === "string") s.resend_api_key = body.resend_api_key.trim();
    if (typeof body.ga_measurement_id === "string") s.ga_measurement_id = body.ga_measurement_id.trim();
    if (typeof body.company_address === "string") s.company_address = body.company_address;
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

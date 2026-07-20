import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { adminNotificationEmails, absUrl } from "@/lib/site";
import type { Customer, Quote } from "@/lib/types";

export async function POST(req: NextRequest) {
  const f = await req.json();
  if (!f?.name || !f?.email) return NextResponse.json({ error: "Required" }, { status: 400 });
  const db = await getDB();
  const teamInboxes = adminNotificationEmails({ settings: db.settings, users: db.users });

  const now = new Date().toISOString();

  await mutate((d) => {
    const cid = uid("cus_");
    const qid = uid("qte_");

    const customer: Customer = {
      id: cid,
      name: f.name,
      email: f.email,
      phone: f.phone || "",
      suburb: f.suburb || "",
      address: "",
      source: "Contact form",
      created_at: now,
    };

    // Placeholder inputs — no sizing info yet; clearly flagged as a contact enquiry.
    const quote: Quote = {
      id: qid,
      customer_id: cid,
      status: "new",
      inputs: { length: 0, width: 0, shape: "auto", range: "any", poles: true, colour: "Charcoal" },
      line_items: [],
      net_label: "Contact form enquiry",
      subtotal: 0,
      vat: 0,
      estimate_low: 0,
      estimate_high: 0,
      final_total: null,
      final_line_items: null,
      archived: false,
      exceeded: false,
      notes: f.message || "",
      created_at: now,
      updated_at: now,
    };

    d.customers.unshift(customer);
    d.quotes.unshift(quote);
    d.activities.unshift({
      id: uid("act_"),
      quote_id: qid,
      user: "system",
      user_id: "system",
      type: "lead_created",
      message: `Contact form enquiry from ${f.name} (${f.suburb || "unknown suburb"}). Message: "${(f.message || "").slice(0, 80)}${(f.message || "").length > 80 ? "…" : ""}"`,
      created_at: now,
    });
  });

  // Notify the team
  for (const inbox of teamInboxes) {
    await sendEmail(
      inbox,
      `New contact form enquiry — ${f.name}`,
      `${f.name} submitted a contact form and has been added to the CRM pipeline.\n\nPhone: ${f.phone || "—"}\nEmail: ${f.email}\nSuburb: ${f.suburb || "—"}\n\nMessage:\n${f.message || "(no message)"}\n\nView in CRM: ${absUrl("/admin/leads")}`
    );
  }

  return NextResponse.json({ ok: true });
}

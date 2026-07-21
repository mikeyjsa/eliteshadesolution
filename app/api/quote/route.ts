import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { calcQuote, ratesFromPricing } from "@/lib/quote-engine";
import { sendEmail, render } from "@/lib/email";
import { zar } from "@/lib/format";
import { pushAdminNotification } from "@/lib/notifications";
import { adminNotificationEmails } from "@/lib/site";
import type { Customer, Quote, QuoteInputs } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const inputs = body.inputs as QuoteInputs;
  const contact = body.contact as { name: string; email: string; phone: string; suburb: string };

  if (!contact?.name || !contact?.email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const db = await getDB();
  const rates = ratesFromPricing(db.pricing);
  const r = calcQuote(inputs, rates);
  const adminInboxes = adminNotificationEmails({ settings: db.settings, users: db.users });
  const colour = (inputs.colour as string) || "Charcoal";

  const now = new Date().toISOString();
  const customer: Customer = {
    id: uid("cus_"),
    name: contact.name,
    email: contact.email,
    phone: contact.phone || "",
    suburb: contact.suburb || "",
    address: "",
    source: "Website calculator",
    created_at: now,
  };
  const quote: Quote = {
    id: uid("qte_"),
    customer_id: customer.id,
    status: "new",
    inputs,
    line_items: r.lineItems,
    net_label: r.netLabel,
    subtotal: r.subtotal,
    vat: r.vat,
    estimate_low: r.low,
    estimate_high: r.high,
    final_total: null,
    final_line_items: null,
    archived: false,
    exceeded: r.exceeded,
    notes: "",
    created_at: now,
    updated_at: now,
  };

  await mutate((d) => {
    d.customers.unshift(customer);
    d.quotes.unshift(quote);
    d.activities.unshift({
      id: uid("act_"),
      quote_id: quote.id,
      user: "system",
      user_id: "system",
      type: "lead_created",
      message: `New quote captured from website — ${zar(r.low)}–${zar(r.high)} est.`,
      created_at: now,
    });
    pushAdminNotification(d, {
      title: "New website quote",
      message: `${contact.name} requested an estimate for ${inputs.length}m × ${inputs.width}m in ${colour}. Range: ${zar(r.low)} – ${zar(r.high)}.`,
      href: `/admin/quotes/${quote.id}`,
      kind: "quote",
      quote_id: quote.id,
      created_at: now,
    });
  });

  const tpl = db.settings.email_templates.estimate;
  await sendEmail(
    contact.email,
    tpl.subject,
    render(tpl.body, { name: contact.name, range: `${zar(r.low)} – ${zar(r.high)}`, colour })
  );

  for (const inbox of adminInboxes) {
    await sendEmail(
      inbox,
      `New website quote enquiry — ${contact.name}`,
      `${contact.name} submitted a website quote enquiry.\n\nEstimate range: ${zar(r.low)} – ${zar(r.high)}\nNet: ${r.netLabel}\nColour: ${colour}\nSize: ${inputs.length}m × ${inputs.width}m\nPhone: ${contact.phone || "—"}\nEmail: ${contact.email}\nSuburb: ${contact.suburb || "—"}`
    );
  }

  return NextResponse.json({ ok: true, quoteId: quote.id });
}

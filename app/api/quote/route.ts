import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { calcQuote, ratesFromPricing } from "@/lib/quote-engine";
import { sendEmail, render } from "@/lib/email";
import { zar } from "@/lib/format";
import { pushAdminNotification } from "@/lib/notifications";
import { adminNotificationEmails } from "@/lib/site";
import type { Customer, Quote, QuoteInputs } from "@/lib/types";
import { checkRateLimit, clientAddress } from "@/lib/rate-limit";
import { cleanPublicEmail, cleanPublicText, isValidPublicEmail } from "@/lib/public-input";
import { FABRIC_COLOURS } from "@/lib/types";

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`quote:${clientAddress(req)}`, 10, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many estimate requests from this connection. Please try again later." }, { status: 429 });
  const body = await req.json();
  if (cleanPublicText(body?.website)) return NextResponse.json({ ok: true });
  const rawInputs = body.inputs as Partial<QuoteInputs> | undefined;
  const contact = {
    name: cleanPublicText(body?.contact?.name, 100),
    email: cleanPublicEmail(body?.contact?.email),
    phone: cleanPublicText(body?.contact?.phone, 40),
    suburb: cleanPublicText(body?.contact?.suburb, 100),
  };

  if (!contact.name || !isValidPublicEmail(contact.email)) {
    return NextResponse.json({ error: "Please enter your name and a valid email address." }, { status: 400 });
  }
  const length = Number(rawInputs?.length);
  const width = Number(rawInputs?.width);
  const shapes: QuoteInputs["shape"][] = ["auto", "square", "rectangle", "triangle"];
  const ranges: QuoteInputs["range"][] = ["any", "Standard", "Extreme"];
  if (!Number.isFinite(length) || !Number.isFinite(width) || length < 1 || width < 1 || length > 20 || width > 20) {
    return NextResponse.json({ error: "Dimensions must be between 1m and 20m." }, { status: 400 });
  }
  const inputs: QuoteInputs = {
    length,
    width,
    shape: shapes.includes(rawInputs?.shape as QuoteInputs["shape"]) ? rawInputs!.shape! : "auto",
    range: ranges.includes(rawInputs?.range as QuoteInputs["range"]) ? rawInputs!.range! : "any",
    poles: rawInputs?.poles !== false,
    colour: FABRIC_COLOURS.some((item) => item.name === rawInputs?.colour) ? rawInputs!.colour! : "Charcoal",
  };

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

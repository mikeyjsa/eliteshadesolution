// Client-facing quote flow: tokened view/accept links + the two emails
// (quote ready → deposit invoice). Used by the admin confirm action and the
// public accept endpoint.
import { randomBytes } from "crypto";
import { getDB, mutate, uid } from "./db";
import { sendEmail } from "./email";
import { zar } from "./format";
import { quoteNumber } from "./pdf";
import { eftDetails, gatewayEnabled, notificationEmails, paymentOptionsSentence } from "./site";
import type { Invoice, Quote } from "./types";

// Generate (once) and return the unguessable public token for a quote.
export async function ensureQuoteToken(quoteId: string): Promise<string | null> {
  return mutate((db) => {
    const q = db.quotes.find((x) => x.id === quoteId);
    if (!q) return null;
    if (!q.public_token) q.public_token = randomBytes(18).toString("hex");
    return q.public_token;
  });
}

export function quoteUrl(origin: string, token: string): string {
  return `${origin}/q/${token}`;
}

// Email the client their confirmed quote with a view/download/accept link.
export async function sendQuoteEmail(quote: Quote, origin: string): Promise<void> {
  const db = await getDB();
  const customer = db.customers.find((c) => c.id === quote.customer_id);
  if (!customer || !quote.public_token || quote.final_total == null) return;

  const url = quoteUrl(origin, quote.public_token);
  const total = zar(quote.final_total);
  const deposit = zar(Math.round(quote.final_total * db.settings.deposit_pct / 100));
  const paymentSentence = paymentOptionsSentence(db.settings);

  const body = [
    `Hi ${customer.name},`,
    ``,
    `Good news — your Elite Shade quote ${quoteNumber(quote)} is confirmed at ${total} (excl VAT).`,
    ``,
    `View the full breakdown, download your quote as a PDF, and accept it online at the link below. Once you accept, we'll email your ${db.settings.deposit_pct}% deposit invoice (${deposit}) with secure payment options — ${paymentSentence}.`,
    ``,
    `Your quote is valid for 14 days. Nothing is booked until you accept, and the final scope is always confirmed at your free site survey.`,
  ].join("\n");

  await sendEmail(customer.email, `Your quote ${quoteNumber(quote)} is ready — ${total}`, body, {
    label: "View & accept my quote",
    url,
  });
  for (const inbox of notificationEmails(db.settings)) {
    await sendEmail(
      inbox,
      `Quote ready — ${quoteNumber(quote)} for ${customer.name}`,
      `Quote ${quoteNumber(quote)} has been confirmed and emailed to ${customer.email}.\n\nClient: ${customer.name}\nTotal: ${total}\nDeposit: ${deposit}\nView link: ${url}`
    );
  }

  await mutate((db2) => {
    db2.activities.unshift({
      id: uid("act_"),
      quote_id: quote.id,
      user: "system",
      user_id: "system",
      type: "email",
      message: `Quote ${quoteNumber(quote)} emailed to ${customer.email} with view/accept link.`,
      created_at: new Date().toISOString(),
    });
  });
}

// Email the client their deposit invoice with the currently enabled payment options.
export async function sendDepositInvoiceEmail(quote: Quote, invoice: Invoice, origin: string): Promise<void> {
  const db = await getDB();
  const customer = db.customers.find((c) => c.id === quote.customer_id);
  if (!customer) return;

  const allowGateway = gatewayEnabled(db.settings);
  const payUrl = `${origin}/pay/${invoice.id}`;
  const pdfUrl = `${origin}/api/invoices/${invoice.id}/pdf`;
  const eft = eftDetails(db.settings);

  const body = [
    `Hi ${customer.name},`,
    ``,
    `Thank you for accepting quote ${quoteNumber(quote)}. Your ${db.settings.deposit_pct}% deposit invoice ${invoice.number} for ${zar(invoice.amount)} is attached below as a download link.`,
    ``,
    `Download your invoice: ${pdfUrl}`,
    ``,
    allowGateway ? `You can pay in whichever way suits you:` : `Please pay by EFT to:`,
    ``,
    ...(allowGateway ? [`1. PayFast (card / instant EFT) — use the secure payment button below.`, ``, `2. Direct EFT — pay to:`] : []),
    ...eft.split("\n"),
    `Reference: ${invoice.number}`,
    ``,
    `As soon as your deposit reflects, we confirm your installation date by email. If you pay by EFT, simply reply with your proof of payment to speed things up.`,
  ].join("\n");

  await sendEmail(customer.email, `Deposit invoice ${invoice.number} — secure your install date`, body, {
    label: allowGateway ? `Pay ${zar(invoice.amount)} deposit securely` : `View payment instructions`,
    url: payUrl,
  });
  for (const inbox of notificationEmails(db.settings)) {
    await sendEmail(
      inbox,
      `Deposit invoice sent — ${invoice.number}`,
      `Deposit invoice ${invoice.number} has been sent to ${customer.email}.\n\nClient: ${customer.name}\nAmount: ${zar(invoice.amount)}\nPayment mode: ${allowGateway ? "Gateway + EFT" : "EFT only"}\nPay page: ${payUrl}`
    );
  }

  await mutate((db2) => {
    db2.activities.unshift({
      id: uid("act_"),
      quote_id: quote.id,
      user: "system",
      user_id: "system",
      type: "email",
      message: `Deposit invoice ${invoice.number} emailed to ${customer.email} with ${allowGateway ? "PayFast + EFT" : "EFT-only"} payment options.`,
      created_at: new Date().toISOString(),
    });
  });
}

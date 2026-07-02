// Shared invoice generation — used by the admin "Generate deposit/balance"
// action and by the public quote-accept flow.
import { getDB, mutate, uid } from "./db";
import type { Invoice } from "./types";

export async function generateInvoice(
  quoteId: string,
  type: "deposit" | "balance",
  actorName = "system",
  actorId = "system"
): Promise<{ invoice: Invoice } | { error: string; status: number }> {
  const db = await getDB();
  const q = db.quotes.find((x) => x.id === quoteId);
  if (!q) return { error: "Quote not found", status: 404 };
  if (q.final_total == null) return { error: "Confirm the firm price first", status: 400 };

  const existing = db.invoices.find((i) => i.quote_id === quoteId && i.type === type);
  if (existing) return { invoice: existing };

  const depositPct = db.settings.deposit_pct / 100;
  const depositAmt = Math.round(q.final_total * depositPct);
  const amount = type === "deposit" ? depositAmt : q.final_total - depositAmt;

  const invoice: Invoice = await mutate((d) => {
    d.counters.invoice += 1;
    const invId = uid("inv_");
    const inv: Invoice = {
      id: invId,
      number: "ESS-" + d.counters.invoice,
      quote_id: quoteId,
      type,
      amount,
      status: "unpaid",
      payfast_id: null,
      proof_url: null,
      payment_note: "",
      pdf_url: `/api/invoices/${invId}/pdf`,
      issued_at: new Date().toISOString(),
      paid_at: null,
    };
    d.invoices.unshift(inv);
    d.activities.unshift({
      id: uid("act_"),
      quote_id: quoteId,
      user: actorName,
      user_id: actorId,
      type: "invoice",
      message: `${type === "deposit" ? "Deposit" : "Balance"} invoice ${inv.number} generated — R${amount}.`,
      created_at: inv.issued_at,
    });
    return inv;
  });

  return { invoice };
}

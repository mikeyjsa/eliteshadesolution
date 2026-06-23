import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import type { Invoice } from "@/lib/types";

// Generate a deposit or balance invoice for a confirmed quote.
export async function POST(req: NextRequest) {
  const { quoteId, type } = (await req.json()) as { quoteId: string; type: "deposit" | "balance" };
  const db = await getDB();
  const q = db.quotes.find((x) => x.id === quoteId);
  if (!q) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (q.final_total == null) return NextResponse.json({ error: "Confirm the firm price first" }, { status: 400 });

  const depositPct = db.settings.deposit_pct / 100;
  const depositAmt = Math.round(q.final_total * depositPct);
  const amount = type === "deposit" ? depositAmt : q.final_total - depositAmt;

  const actor = await currentUser();
  const actorName = actor?.name ?? "owner";
  const actorId = actor?.id ?? "system";
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
    d.activities.unshift({ id: uid("act_"), quote_id: quoteId, user: actorName, user_id: actorId, type: "invoice", message: `${type === "deposit" ? "Deposit" : "Balance"} invoice ${inv.number} generated — R${amount}.`, created_at: inv.issued_at });
    return inv;
  });

  return NextResponse.json({ ok: true, invoice });
}

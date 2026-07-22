import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { generateInvoice } from "@/lib/invoices";
import { quoteNumber } from "@/lib/pdf";
import { sendDepositInvoiceEmail } from "@/lib/quote-flow";

// Public: client accepts their quote. Idempotent — re-accepting returns the
// existing deposit invoice. Generates the deposit invoice and emails it with
// PayFast + EFT payment options.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDB();
  const quote = db.quotes.find((x) => x.public_token === token);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (quote.final_total == null) {
    return NextResponse.json({ error: "This quote is not ready for acceptance yet." }, { status: 400 });
  }

  const firstAccept = !quote.accepted_at;
  if (firstAccept) {
    await mutate((d) => {
      const q = d.quotes.find((x) => x.id === quote.id);
      if (!q) return;
      const now = new Date().toISOString();
      q.accepted_at = now;
      if (q.status === "new" || q.status === "following_up") q.status = "confirmed";
      q.updated_at = now;
      d.activities.unshift({
        id: uid("act_"),
        quote_id: q.id,
        user: "customer",
        user_id: "customer",
        type: "accept",
        message: `Client accepted quote ${quoteNumber(q)} online.`,
        created_at: now,
      });
    });
  }

  const result = await generateInvoice(quote.id, "deposit", "customer", "customer");
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (firstAccept) {
    const fresh = (await getDB()).quotes.find((x) => x.id === quote.id)!;
    await sendDepositInvoiceEmail(fresh, result.invoice);
  }

  return NextResponse.json({ ok: true, invoiceId: result.invoice.id });
}

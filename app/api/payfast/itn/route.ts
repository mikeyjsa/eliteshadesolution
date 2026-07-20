import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { fakePayfastId } from "@/lib/payfast";
import { sendEmail, render } from "@/lib/email";
import { zar } from "@/lib/format";
import { adminNotificationEmails, absUrl } from "@/lib/site";

// Mock PayFast ITN (Instant Transaction Notification). On the real gateway
// this is server-to-server and signature-verified; here the /pay page posts
// { invoiceId } to simulate a successful payment.
export async function POST(req: NextRequest) {
  const { invoiceId } = await req.json();
  const now = new Date().toISOString();

  const out = await mutate((db) => {
    const inv = db.invoices.find((i) => i.id === invoiceId);
    if (!inv || inv.status === "paid") return null;
    inv.status = "paid";
    inv.payfast_id = fakePayfastId();
    inv.paid_at = now;

    const q = db.quotes.find((x) => x.id === inv.quote_id);
    if (q && inv.type === "deposit" && (q.status === "confirmed" || q.status === "following_up" || q.status === "new")) {
      q.status = "deposit_paid";
      q.updated_at = now;
    }
    if (q && inv.type === "balance") {
      q.status = "installed";
      q.updated_at = now;
    }
    db.activities.unshift({ id: uid("act_"), quote_id: inv.quote_id, user: "system", user_id: "system", type: "payment", message: `${inv.type === "deposit" ? "Deposit" : "Balance"} paid via PayFast (${inv.payfast_id}) — ${zar(inv.amount)}.`, created_at: now });
    return { inv, q };
  });

  if (!out) return NextResponse.json({ error: "Already paid or missing" }, { status: 400 });

  // notify customer (mock email)
  const db = await getDB();
  const q = db.quotes.find((x) => x.id === out.inv.quote_id);
  const c = q && db.customers.find((x) => x.id === q.customer_id);
  const adminInboxes = adminNotificationEmails({ settings: db.settings, users: db.users });
  if (c) {
    await sendEmail(c.email, "Payment received — Elite Shade", render("Hi {{name}}, we've received your {{type}} of {{amt}}. Thank you! We'll be in touch about scheduling.", { name: c.name, type: out.inv.type, amt: zar(out.inv.amount) }));
    for (const inbox of adminInboxes) {
      await sendEmail(
        inbox,
        `Payment received — ${out.inv.number}`,
        `${out.inv.type === "deposit" ? "Deposit" : "Balance"} payment has been received via PayFast.\n\nClient: ${c.name}\nInvoice: ${out.inv.number}\nAmount: ${zar(out.inv.amount)}\nStatus: ${out.inv.status}\nCRM: ${absUrl(`/admin/invoices/${out.inv.id}`)}`
      );
    }
  }

  return NextResponse.json({ ok: true });
}

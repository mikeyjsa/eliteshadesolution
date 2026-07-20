import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { promises as fs } from "fs";
import { zar } from "@/lib/format";
import { PAYMENT_PROOFS_DIR } from "@/lib/storage-paths";
import { adminNotificationEmails, absUrl } from "@/lib/site";

async function saveProof(dataUrl: string, originalName?: string): Promise<string> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid proof upload");
  const [, mime, base64] = match;
  const safeExtFromName = originalName?.toLowerCase().match(/\.(pdf|png|jpg|jpeg|webp)$/)?.[1];
  const ext =
    safeExtFromName ??
    ({ "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[mime] || "bin");
  const file = `${uid("proof_")}.${ext}`;
  await fs.mkdir(PAYMENT_PROOFS_DIR, { recursive: true });
  await fs.writeFile(`${PAYMENT_PROOFS_DIR}/${file}`, Buffer.from(base64, "base64"));
  return `/uploads/payment-proofs/${file}`;
}

// Edit an invoice (amount / type / status) or delete it.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  const actor = await currentUser();
  const actorName = actor?.name ?? "owner";
  const actorId = actor?.id ?? "system";
  const nextProofUrl =
    typeof body.proofDataUrl === "string" && body.proofDataUrl
      ? await saveProof(body.proofDataUrl, typeof body.proofName === "string" ? body.proofName : undefined)
      : null;

  const result = await mutate((db) => {
    const inv = db.invoices.find((i) => i.id === id);
    if (!inv) return null;
    const quote = db.quotes.find((q) => q.id === inv.quote_id);
    const priceLocked = quote?.final_total != null;

    if (!priceLocked && typeof body.amount === "number") inv.amount = Math.round(body.amount);
    if (!priceLocked && (body.type === "deposit" || body.type === "balance")) inv.type = body.type;
    if (body.status === "paid" || body.status === "unpaid") {
      const was = inv.status;
      inv.status = body.status;
      if (body.status === "paid" && was !== "paid") {
        inv.paid_at = now;
        if (!inv.payfast_id) inv.payfast_id = "MANUAL";
        if (quote && inv.type === "deposit" && (quote.status === "confirmed" || quote.status === "following_up" || quote.status === "new")) {
          quote.status = "deposit_paid";
          quote.updated_at = now;
        }
        if (quote && inv.type === "balance") {
          quote.status = "installed";
          quote.updated_at = now;
        }
      }
      if (body.status === "unpaid") {
        inv.paid_at = null;
      }
    }
    if (typeof body.payment_note === "string") inv.payment_note = body.payment_note;
    if (nextProofUrl) inv.proof_url = nextProofUrl;
    if (body.remove_proof) inv.proof_url = null;

    const activityParts = [`Invoice ${inv.number}`];
    if (!priceLocked && typeof body.amount === "number") activityParts.push(`amount ${zar(inv.amount)}`);
    if (!priceLocked && (body.type === "deposit" || body.type === "balance")) activityParts.push(`type ${inv.type}`);
    if (body.status === "paid" || body.status === "unpaid") activityParts.push(`status ${inv.status}`);
    if (typeof body.payment_note === "string" && body.payment_note.trim()) activityParts.push("payment note saved");
    if (nextProofUrl) activityParts.push("proof uploaded");
    db.activities.unshift({
      id: uid("act_"),
      quote_id: inv.quote_id,
      user: actorName,
      user_id: actorId,
      type: body.status === "paid" || nextProofUrl || typeof body.payment_note === "string" ? "payment" : "invoice_edit",
      message: `${activityParts.join(" · ")}.`,
      created_at: now,
    });
    return inv;
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = await getDB();
  const quote = db.quotes.find((item) => item.id === result.quote_id);
  const customer = quote ? db.customers.find((item) => item.id === quote.customer_id) : null;
  const adminInboxes = adminNotificationEmails({ settings: db.settings, users: db.users });
  const changedStatus = body.status === "paid" || body.status === "unpaid";
  const touchedPayment = changedStatus || nextProofUrl || typeof body.payment_note === "string";

  if (customer && touchedPayment) {
    const noteSummary =
      typeof body.payment_note === "string" && body.payment_note.trim()
        ? `\nPayment note: ${body.payment_note.trim()}`
        : "";
    for (const inbox of adminInboxes) {
      await sendEmail(
        inbox,
        `Invoice updated — ${result.number}`,
        `An invoice payment record was updated in the admin.\n\nClient: ${customer.name}\nInvoice: ${result.number}\nAmount: ${zar(result.amount)}\nStatus: ${result.status}${nextProofUrl ? "\nProof of payment uploaded: yes" : ""}${noteSummary}\nCRM: ${absUrl(`/admin/invoices/${result.id}`)}`
      );
    }
  }
  return NextResponse.json({ ok: true, invoice: result });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await mutate((db) => {
    db.invoices = db.invoices.filter((i) => i.id !== id);
  });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { pushAdminNotification } from "@/lib/notifications";
import { ensureQuoteToken, quoteUrl, sendQuoteEmail } from "@/lib/quote-flow";
import { STAGES, type QuoteInputs, type QuoteLineItem, type QuoteStage } from "@/lib/types";
import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/storage-paths";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  const actor = await currentUser();
  const actorName = actor?.name ?? "owner";
  const actorId = actor?.id ?? "system";

  const mapItems = (raw: unknown): QuoteLineItem[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((li): li is { label?: string; amount?: unknown } => Boolean(li) && typeof li === "object")
      .filter((li) => typeof li.label === "string")
      .map((li) => ({ label: li.label as string, amount: Number(li.amount) || 0 }));
  };

  // Update customer address if provided.
  if (typeof body.address === "string") {
    await mutate((db) => {
      const q = db.quotes.find((x) => x.id === id);
      if (!q) return;
      const c = db.customers.find((x) => x.id === q.customer_id);
      if (c) c.address = body.address;
    });
  }

  const result = await mutate((db) => {
    const q = db.quotes.find((x) => x.id === id);
    if (!q) return null;
    const customer = db.customers.find((x) => x.id === q.customer_id);
    const pricingLocked = q.status === "scheduled" || q.status === "installed";
    const notificationParts: string[] = [];

    if (body.status && body.status !== q.status) {
      const label = STAGES.find((s) => s.key === body.status)?.label ?? body.status;
      q.status = body.status as QuoteStage;
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "stage_change", message: `Moved to ${label}.`, created_at: now });
      notificationParts.push(`stage moved to ${label}`);
    }
    if (typeof body.notes === "string") q.notes = body.notes;

    if (!pricingLocked && body.inputs && typeof body.inputs === "object") {
      q.inputs = body.inputs as QuoteInputs;
    }
    if (!pricingLocked && Array.isArray(body.line_items)) {
      q.line_items = mapItems(body.line_items);
    }
    if (!pricingLocked && typeof body.net_label === "string") q.net_label = body.net_label;
    if (!pricingLocked && typeof body.subtotal === "number") q.subtotal = body.subtotal;
    if (!pricingLocked && typeof body.vat === "number") q.vat = body.vat;
    if (!pricingLocked && typeof body.estimate_low === "number") q.estimate_low = body.estimate_low;
    if (!pricingLocked && typeof body.estimate_high === "number") q.estimate_high = body.estimate_high;
    if (!pricingLocked && typeof body.exceeded === "boolean") q.exceeded = body.exceeded;
    if (!pricingLocked && body.estimate_recalculated) {
      db.activities.unshift({
        id: uid("act_"),
        quote_id: id,
        user: actorName,
        user_id: actorId,
        type: "estimate",
        message: `Estimate recalculated to R${q.estimate_low}–R${q.estimate_high} using ${q.net_label}.`,
        created_at: now,
      });
      notificationParts.push(`estimate recalculated to R${q.estimate_low}–R${q.estimate_high}`);
    }

    if (!pricingLocked && Array.isArray(body.final_line_items)) {
      const items = mapItems(body.final_line_items);
      q.final_line_items = items;
      q.final_total = items.reduce((s: number, li: { amount: number }) => s + li.amount, 0);
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "price", message: `Firm price set to R${q.final_total} (${items.length} line items).`, created_at: now });
      notificationParts.push(`firm price set at R${q.final_total}`);
    } else if (!pricingLocked && typeof body.final_total === "number") {
      q.final_total = body.final_total;
    }

    if (typeof body.archived === "boolean") {
      q.archived = body.archived;
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "archive", message: body.archived ? "Archived." : "Restored from archive.", created_at: now });
      notificationParts.push(body.archived ? "lead archived" : "lead restored");
    }
    if (body.activity) {
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "note", message: body.activity, created_at: now });
      notificationParts.push(`note added by ${actorName}`);
    }
    if (typeof body.address === "string") {
      notificationParts.push("invoice address updated");
    }
    if (notificationParts.length) {
      pushAdminNotification(db, {
        title: `Lead updated — ${customer?.name ?? id.slice(0, 8)}`,
        message: notificationParts.map((part, index) => `${index + 1}. ${part}`).join("\n"),
        href: `/admin/quotes/${id}`,
        kind: "lead",
        quote_id: id,
        created_at: now,
      });
    }
    q.updated_at = now;
    return q;
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Email the client their confirmed quote with a view/download/accept link.
  let quoteLink: string | null = null;
  if (body.send_quote_email && result.final_total != null) {
    const token = await ensureQuoteToken(id);
    if (token) {
      quoteLink = quoteUrl(token);
      const fresh = (await getDB()).quotes.find((x) => x.id === id);
      if (fresh) await sendQuoteEmail(fresh);
    }
  }

  return NextResponse.json({ ok: true, quote: result, quoteLink });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = await getDB();
  const quote = db.quotes.find((item) => item.id === id);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const proofUrls = db.invoices
    .filter((invoice) => invoice.quote_id === id)
    .map((invoice) => invoice.proof_url)
    .filter((url): url is string => Boolean(url));

  await mutate((state) => {
    const deletingQuote = state.quotes.find((item) => item.id === id);
    if (!deletingQuote) return;

    state.invoices = state.invoices.filter((invoice) => invoice.quote_id !== id);
    state.installations = state.installations.filter((installation) => installation.quote_id !== id);
    state.activities = state.activities.filter((activity) => activity.quote_id !== id);
    state.notifications = state.notifications.filter((notification) => notification.quote_id !== id);
    state.quotes = state.quotes.filter((item) => item.id !== id);

    const stillReferenced = state.quotes.some((item) => item.customer_id === deletingQuote.customer_id);
    if (!stillReferenced) {
      state.customers = state.customers.filter((customer) => customer.id !== deletingQuote.customer_id);
    }
  });

  for (const url of proofUrls) {
    const relative = url.replace(/^\/+/, "");
    const absolute = path.join(DATA_DIR, relative.replace(/^uploads\//, "uploads/"));
    await fs.unlink(absolute).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

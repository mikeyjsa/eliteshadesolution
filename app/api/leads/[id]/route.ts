import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { STAGES, type QuoteInputs, type QuoteLineItem, type QuoteStage } from "@/lib/types";

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
    const pricingLocked = q.status === "scheduled" || q.status === "installed";

    if (body.status && body.status !== q.status) {
      const label = STAGES.find((s) => s.key === body.status)?.label ?? body.status;
      q.status = body.status as QuoteStage;
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "stage_change", message: `Moved to ${label}.`, created_at: now });
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
    }

    if (!pricingLocked && Array.isArray(body.final_line_items)) {
      const items = mapItems(body.final_line_items);
      q.final_line_items = items;
      q.final_total = items.reduce((s: number, li: { amount: number }) => s + li.amount, 0);
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "price", message: `Firm price set to R${q.final_total} (${items.length} line items).`, created_at: now });
    } else if (!pricingLocked && typeof body.final_total === "number") {
      q.final_total = body.final_total;
    }

    if (typeof body.archived === "boolean") {
      q.archived = body.archived;
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "archive", message: body.archived ? "Archived." : "Restored from archive.", created_at: now });
    }
    if (body.activity) {
      db.activities.unshift({ id: uid("act_"), quote_id: id, user: actorName, user_id: actorId, type: "note", message: body.activity, created_at: now });
    }
    q.updated_at = now;
    return q;
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, quote: result });
}

import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import type { PricingRate } from "@/lib/types";

// Add a custom rate item (available as a quick-add line item on quotes).
export async function POST(req: NextRequest) {
  const { label, unit, rate } = await req.json();
  if (!label) return NextResponse.json({ error: "Label required" }, { status: 400 });
  const item: PricingRate = await mutate((db) => {
    const it: PricingRate = { key: uid("rate_"), label, unit: unit || "each", rate: Number(rate) || 0, group: "custom" };
    db.pricing.push(it);
    return it;
  });
  return NextResponse.json({ ok: true, item });
}

// Remove a custom rate item (built-in keys are protected).
export async function DELETE(req: NextRequest) {
  const { key } = await req.json();
  await mutate((db) => {
    const it = db.pricing.find((p) => p.key === key);
    if (it && it.group === "custom") db.pricing = db.pricing.filter((p) => p.key !== key);
  });
  return NextResponse.json({ ok: true });
}

// Update editable rates and/or deposit %. These flow straight into live quotes.
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await mutate((db) => {
    if (Array.isArray(body.rates)) {
      for (const r of body.rates) {
        const row = db.pricing.find((p) => p.key === r.key);
        if (row && typeof r.rate === "number") row.rate = r.rate;
      }
    }
    if (typeof body.deposit_pct === "number") db.settings.deposit_pct = body.deposit_pct;
    if (typeof body.vat_enabled === "boolean") db.settings.vat_enabled = body.vat_enabled;
  });
  return NextResponse.json({ ok: true });
}

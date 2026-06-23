import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { sendEmail, render } from "@/lib/email";
import { currentUser } from "@/lib/auth";
import { dateZA } from "@/lib/format";

export async function POST(req: NextRequest) {
  const { quoteId, date, installer } = await req.json();
  const now = new Date().toISOString();
  const actor = await currentUser();
  const actorName = actor?.name ?? "owner";
  const actorId = actor?.id ?? "system";

  const inst = await mutate((db) => {
    const q = db.quotes.find((x) => x.id === quoteId);
    if (q && (q.status === "scheduled" || q.status === "installed")) {
      return null;
    }
    const existing = db.installations.find((i) => i.quote_id === quoteId);
    if (existing) {
      existing.scheduled_date = date;
      existing.installer = installer || existing.installer;
    } else {
      db.installations.unshift({ id: uid("ins_"), quote_id: quoteId, scheduled_date: date, installer: installer || "Crew A", status: "pending", notes: "" });
    }
    if (q && (q.status === "deposit_paid" || q.status === "confirmed")) {
      q.status = "scheduled";
      q.updated_at = now;
    }
    db.activities.unshift({ id: uid("act_"), quote_id: quoteId, user: actorName, user_id: actorId, type: "schedule", message: `Installation scheduled for ${dateZA(date)} (${installer || "Crew A"}).`, created_at: now });
    return db.installations.find((i) => i.quote_id === quoteId)!;
  });

  if (!inst) return NextResponse.json({ error: "This lead is already locked for scheduling changes" }, { status: 400 });

  const db = await getDB();
  const q = db.quotes.find((x) => x.id === quoteId);
  const c = q && db.customers.find((x) => x.id === q.customer_id);
  if (c) {
    const tpl = db.settings.email_templates.scheduled;
    await sendEmail(c.email, tpl.subject, render(tpl.body, { name: c.name, date: dateZA(date) }));
  }

  return NextResponse.json({ ok: true, installation: inst });
}

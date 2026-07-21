import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import { sendEmail, render } from "@/lib/email";
import { currentUser } from "@/lib/auth";
import { dateZA } from "@/lib/format";
import { pushAdminNotification } from "@/lib/notifications";
import { adminNotificationEmails, absUrl } from "@/lib/site";

export async function POST(req: NextRequest) {
  const { quoteId, date, installer, teamId } = await req.json();
  const now = new Date().toISOString();
  const actor = await currentUser();
  const actorName = actor?.name ?? "owner";
  const actorId = actor?.id ?? "system";

  const inst = await mutate((db) => {
    const q = db.quotes.find((x) => x.id === quoteId);
    if (q && (q.status === "scheduled" || q.status === "installed")) {
      return null;
    }
    const team = typeof teamId === "string" ? db.teams.find((item) => item.id === teamId && item.active) : null;
    const installerName = team?.name || installer || "Crew A";
    const customer = q ? db.customers.find((item) => item.id === q.customer_id) : null;
    const existing = db.installations.find((i) => i.quote_id === quoteId);
    if (existing) {
      existing.scheduled_date = date;
      existing.installer = installerName || existing.installer;
      existing.team_id = team?.id ?? existing.team_id ?? null;
    } else {
      db.installations.unshift({ id: uid("ins_"), quote_id: quoteId, scheduled_date: date, installer: installerName, team_id: team?.id ?? null, status: "pending", notes: "" });
    }
    if (q && (q.status === "deposit_paid" || q.status === "confirmed")) {
      q.status = "scheduled";
      q.updated_at = now;
    }
    db.activities.unshift({ id: uid("act_"), quote_id: quoteId, user: actorName, user_id: actorId, type: "schedule", message: `Installation scheduled for ${dateZA(date)} (${installerName}).`, created_at: now });
    pushAdminNotification(db, {
      title: `Job scheduled — ${customer?.name ?? "Customer"}`,
      message: `Scheduled for ${dateZA(date)} and assigned to ${installerName}.`,
      href: `/admin/quotes/${quoteId}`,
      kind: "schedule",
      quote_id: quoteId,
      created_at: now,
    });
    return db.installations.find((i) => i.quote_id === quoteId)!;
  });

  if (!inst) return NextResponse.json({ error: "This lead is already locked for scheduling changes" }, { status: 400 });

  const db = await getDB();
  const q = db.quotes.find((x) => x.id === quoteId);
  const c = q && db.customers.find((x) => x.id === q.customer_id);
  const team = inst.team_id ? db.teams.find((item) => item.id === inst.team_id) : db.teams.find((item) => item.name === inst.installer);
  const adminInboxes = adminNotificationEmails({ settings: db.settings, users: db.users });
  if (c) {
    const tpl = db.settings.email_templates.scheduled;
    await sendEmail(c.email, tpl.subject, render(tpl.body, { name: c.name, date: dateZA(date) }));
    for (const inbox of adminInboxes) {
      await sendEmail(
        inbox,
        `Installation booked — ${c.name}`,
        `Installation has been scheduled in the admin.\n\nClient: ${c.name}\nDate: ${dateZA(date)}\nInstaller: ${team?.name || installer || inst.installer || "Crew A"}\nQuote ID: ${quoteId}\nCRM: ${absUrl(`/admin/quotes/${quoteId}`)}`
      );
    }
    if (team?.email) {
      await sendEmail(
        team.email,
        `New job assigned — ${c.name}`,
        `A job has been assigned to ${team.name}.\n\nClient: ${c.name}\nDate: ${dateZA(date)}\nSuburb: ${c.suburb || "—"}\nPhone: ${c.phone || "—"}\nEmail: ${c.email}\nCRM: ${absUrl(`/admin/quotes/${quoteId}`)}`
      );
    }
  }

  return NextResponse.json({ ok: true, installation: inst });
}

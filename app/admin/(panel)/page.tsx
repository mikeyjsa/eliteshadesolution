import Link from "next/link";
import { getDB } from "@/lib/db";
import { zar, dateZA } from "@/lib/format";
import { STAGES } from "@/lib/types";
import AdminHead from "@/components/AdminHead";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const db = await getDB();
  const quotes = db.quotes;
  const open = quotes.filter((q) => q.status !== "installed");
  const paidInvoices = db.invoices.filter((i) => i.status === "paid");
  const revenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
  const outstanding = db.invoices.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);
  const newLeads = quotes.filter((q) => q.status === "new").length;
  const weekAhead = db.installations.filter((i) => {
    const d = new Date(i.scheduled_date).getTime();
    return d >= Date.now() && d <= Date.now() + 7 * 86400000;
  });
  const cust = (id: string) => db.customers.find((c) => c.id === id);

  const kpis = [
    { label: "New leads", value: newLeads, sub: "awaiting first call", accent: true },
    { label: "Open pipeline", value: open.length, sub: "live jobs" },
    { label: "Revenue collected", value: zar(revenue), sub: `${paidInvoices.length} payments` },
    { label: "Outstanding", value: zar(outstanding), sub: "unpaid invoices" },
  ];

  return (
    <>
      <AdminHead eyebrow="Mission control" title="Dashboard">
        <Link href="/admin/leads" className="btn-brass" style={{ padding: "0.6rem 1.1rem", fontSize: 13 }}>Open pipeline →</Link>
      </AdminHead>

      <div style={{ padding: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }} className="es-kpi">
          {kpis.map((k) => (
            <div key={k.label} className="card" style={{ padding: "20px 22px", borderTop: `3px solid ${k.accent ? "var(--color-brass)" : "var(--color-navy)"}` }}>
              <div style={{ fontSize: 12, color: "var(--color-steel)", textTransform: "uppercase", letterSpacing: ".06em" }}>{k.label}</div>
              <div className="display tnum" style={{ fontSize: 30, color: "var(--color-navy)", margin: "6px 0 2px" }}>{k.value}</div>
              <div style={{ fontSize: 12.5, color: "var(--color-steel)" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="es-2col">
          {/* Pipeline snapshot */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="display" style={{ fontSize: 17, color: "var(--color-navy)", marginBottom: 14 }}>Pipeline snapshot</h3>
            {STAGES.map((s) => {
              const n = quotes.filter((q) => q.status === s.key).length;
              const max = Math.max(1, ...STAGES.map((x) => quotes.filter((q) => q.status === x.key).length));
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 120, fontSize: 13, color: "var(--color-steel)" }}>{s.label}</div>
                  <div style={{ flex: 1, background: "var(--color-mist)", borderRadius: 6, height: 22, overflow: "hidden" }}>
                    <div style={{ width: `${(n / max) * 100}%`, height: "100%", background: "var(--color-navy)", borderRadius: 6, minWidth: n ? 6 : 0 }} />
                  </div>
                  <div className="tnum" style={{ width: 24, textAlign: "right", fontWeight: 700, color: "var(--color-navy)" }}>{n}</div>
                </div>
              );
            })}
          </div>

          {/* This week */}
          <div className="card" style={{ padding: 24 }}>
            <h3 className="display" style={{ fontSize: 17, color: "var(--color-navy)", marginBottom: 14 }}>Today &amp; this week</h3>
            {newLeads > 0 && (
              <TaskRow tone="brass" title={`${newLeads} new quote${newLeads > 1 ? "s" : ""} to follow up`} sub="Call before the lead goes cold" href="/admin/leads" />
            )}
            {weekAhead.length === 0 && newLeads === 0 && <p style={{ color: "var(--color-steel)", fontSize: 14 }}>Nothing urgent. Nice and quiet.</p>}
            {weekAhead.map((i) => {
              const q = quotes.find((x) => x.id === i.quote_id);
              const c = q && cust(q.customer_id);
              return (
                <TaskRow key={i.id} tone="green" title={`Install — ${c?.name ?? "Job"}`} sub={`${dateZA(i.scheduled_date)} · ${i.installer}`} href="/admin/schedule" />
              );
            })}
            {db.invoices.filter((i) => i.status === "unpaid").slice(0, 3).map((inv) => {
              const q = quotes.find((x) => x.id === inv.quote_id);
              const c = q && cust(q.customer_id);
              return <TaskRow key={inv.id} tone="steel" title={`Awaiting ${inv.type} — ${c?.name ?? ""}`} sub={`${inv.number} · ${zar(inv.amount)}`} href="/admin/invoices" />;
            })}
          </div>
        </div>
      </div>
      <style>{`@media (max-width:900px){ .es-kpi{ grid-template-columns:1fr 1fr !important; } .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

function TaskRow({ tone, title, sub, href }: { tone: "brass" | "green" | "steel"; title: string; sub: string; href: string }) {
  const colors = { brass: "var(--color-brass)", green: "var(--color-signal)", steel: "var(--color-steel)" };
  return (
    <Link href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-mist)", textDecoration: "none" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: colors[tone], flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--color-navy)", fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--color-steel)" }}>{sub}</div>
      </div>
      <span style={{ color: "var(--color-silver)" }}>→</span>
    </Link>
  );
}

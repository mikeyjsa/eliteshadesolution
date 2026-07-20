import { getDB } from "@/lib/db";
import { zar } from "@/lib/format";
import { STAGES } from "@/lib/types";
import AdminHead from "@/components/AdminHead";

export const dynamic = "force-dynamic";

export default async function Reports() {
  const db = await getDB();
  const quotes = db.quotes;
  const closed = quotes.filter((q) => ["deposit_paid", "scheduled", "installed"].includes(q.status));
  const collected = db.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = db.invoices.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);
  const finals = quotes.filter((q) => q.final_total != null).map((q) => q.final_total!);
  const avgJob = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : 0;
  const conv = quotes.length ? Math.round((closed.length / quotes.length) * 100) : 0;
  const gaId = db.settings.ga_measurement_id?.trim() || "";
  const gaLive = Boolean(gaId);

  // sources
  const sourceCounts: Record<string, number> = {};
  for (const q of quotes) {
    const c = db.customers.find((x) => x.id === q.customer_id);
    const s = c?.source ?? "Unknown";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }
  // most-quoted nets
  const netCounts: Record<string, number> = {};
  for (const q of quotes) netCounts[q.net_label] = (netCounts[q.net_label] || 0) + 1;
  const topNets = Object.entries(netCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <AdminHead eyebrow="Insight" title="Reports" />
      <div style={{ padding: 28 }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }} className="es-kpi">
          {[
            ["Revenue collected", zar(collected), "var(--color-signal)"],
            ["Outstanding", zar(outstanding), "var(--color-warn)"],
            ["Avg job value", zar(avgJob), "var(--color-navy)"],
            ["Quote → close", conv + "%", "var(--color-brass)"],
          ].map(([l, v, c]) => (
            <div key={l} className="card" style={{ padding: "18px 22px", borderTop: `3px solid ${c}` }}>
              <div style={{ fontSize: 12, color: "var(--color-steel)", textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
              <div className="display tnum" style={{ fontSize: 26, color: "var(--color-navy)", marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="es-2col">
          {/* Pipeline funnel */}
          <Panel title="Pipeline by stage">
            {STAGES.map((s) => {
              const n = quotes.filter((q) => q.status === s.key).length;
              const max = Math.max(1, ...STAGES.map((x) => quotes.filter((q) => q.status === x.key).length));
              return <Bar key={s.key} label={s.label} value={n} pct={(n / max) * 100} />;
            })}
          </Panel>

          {/* Lead source */}
          <Panel title="Lead source attribution">
            {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([s, n]) => {
              const max = Math.max(...Object.values(sourceCounts));
              return <Bar key={s} label={s} value={n} pct={(n / max) * 100} color="var(--color-steel)" />;
            })}
          </Panel>

          {/* Most-quoted nets */}
          <Panel title="Most-quoted nets">
            {topNets.map(([net, n]) => {
              const max = topNets[0][1];
              return <Bar key={net} label={net.replace("Standard ", "Std ").replace("Extreme ", "Ext ")} value={n} pct={(n / max) * 100} color="var(--color-brass)" />;
            })}
          </Panel>

          {/* Operations */}
          <Panel title="Operations">
            <Stat k="Installs scheduled" v={String(db.installations.filter((i) => new Date(i.scheduled_date) >= new Date()).length)} />
            <Stat k="Awaiting balance" v={String(db.quotes.filter((q) => q.status === "scheduled").length)} />
            <Stat k="Jobs completed" v={String(db.quotes.filter((q) => q.status === "installed").length)} />
            <Stat k="Total leads captured" v={String(quotes.length)} />
            <Stat k="Estimate emails sent" v={String(db.emails.length)} />
          </Panel>

          <Panel title="Website analytics">
            <Stat k="GA4 tracking status" v={gaLive ? "Connected" : "Not configured"} />
            <Stat k="Measurement ID" v={gaId || "Add in Settings"} />
            <Stat k="Tracked site events" v="quote_submitted, estimate_email_intent, contact_submitted" />
            <Stat k="Tracking scope" v="All public pages" />
          </Panel>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 18 }}>
          CRM figures read live from the same store as the pipeline, while GA4 handles public-site traffic attribution. Add or change the GA4 Measurement ID in Settings and it loads across every public page automatically.
        </p>
      </div>
      <style>{`@media (max-width:900px){ .es-kpi{ grid-template-columns:1fr 1fr !important; } .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}
function Bar({ label, value, pct, color = "var(--color-navy)" }: { label: string; value: number; pct: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
      <div style={{ width: 130, fontSize: 12.5, color: "var(--color-steel)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ flex: 1, background: "var(--color-mist)", borderRadius: 6, height: 20, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, minWidth: value ? 6 : 0, transition: "width .5s" }} />
      </div>
      <div className="tnum" style={{ width: 22, textAlign: "right", fontWeight: 700, color: "var(--color-navy)", fontSize: 13 }}>{value}</div>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-mist)" }}>
      <span style={{ fontSize: 13.5, color: "var(--color-steel)" }}>{k}</span>
      <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)" }}>{v}</span>
    </div>
  );
}

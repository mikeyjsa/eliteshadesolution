import Link from "next/link";
import { getDB } from "@/lib/db";
import { zar } from "@/lib/format";
import { STAGES } from "@/lib/types";
import AdminHead from "@/components/AdminHead";
import { getGoogleAnalyticsDashboard } from "@/lib/google-analytics";

export const dynamic = "force-dynamic";

type TabKey = "overview" | "google-analytics";

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

function Table({ headers, rows }: { headers: string[]; rows: Array<Array<string>> }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={{ textAlign: "left", padding: "0 0 10px", color: "var(--color-steel)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--color-line)" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} style={{ padding: "10px 0", borderBottom: "1px solid var(--color-mist)", color: cellIndex === 0 ? "var(--color-navy)" : "var(--color-ink)", fontWeight: cellIndex === 0 ? 600 : 500 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: "18px 22px" }}>
      <div style={{ fontSize: 12, color: "var(--color-steel)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div className="display tnum" style={{ fontSize: 26, color: "var(--color-navy)", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function num(value: number) {
  return new Intl.NumberFormat("en-ZA").format(Math.round(value));
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function seconds(value: number) {
  if (!value) return "0s";
  const mins = Math.floor(value / 60);
  const secs = Math.round(value % 60);
  return mins ? `${mins}m ${secs}s` : `${secs}s`;
}

export default async function Reports({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolved = (await searchParams) || {};
  const activeTab: TabKey = resolved.tab === "google-analytics" ? "google-analytics" : "overview";
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
  const gaDashboard = await getGoogleAnalyticsDashboard(db.settings);

  const sourceCounts: Record<string, number> = {};
  for (const q of quotes) {
    const c = db.customers.find((x) => x.id === q.customer_id);
    const s = c?.source ?? "Unknown";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }

  const netCounts: Record<string, number> = {};
  for (const q of quotes) netCounts[q.net_label] = (netCounts[q.net_label] || 0) + 1;
  const topNets = Object.entries(netCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const quoteViews = db.activities.filter((item) => item.type === "view" && item.message === "Quote").length;
  const quoteAccepted = quotes.filter((quote) => Boolean(quote.accepted_at)).length;
  const publicQuoteLinks = quotes.filter((quote) => Boolean(quote.public_token)).length;
  const depositInvoices = db.invoices.filter((invoice) => invoice.type === "deposit");
  const paidDeposits = depositInvoices.filter((invoice) => invoice.status === "paid").length;
  const quoteEmails = db.emails.filter((mail) => /quote/i.test(mail.subject)).length;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "google-analytics", label: "Google Analytics" },
  ];

  return (
    <>
      <AdminHead eyebrow="Insight" title="Reports">
        <Link href="/admin/settings" className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: 13 }}>Reporting settings →</Link>
      </AdminHead>
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={`/admin/reports?tab=${tab.key}`}
                style={{
                  padding: "8px 16px",
                  borderRadius: 9,
                  border: "1px solid var(--color-line)",
                  background: active ? "var(--color-navy)" : "#fff",
                  color: active ? "#fff" : "var(--color-navy)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: ".03em",
                  textDecoration: "none",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {activeTab === "overview" ? (
          <>
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
              <Panel title="Pipeline by stage">
                {STAGES.map((s) => {
                  const n = quotes.filter((q) => q.status === s.key).length;
                  const max = Math.max(1, ...STAGES.map((x) => quotes.filter((q) => q.status === x.key).length));
                  return <Bar key={s.key} label={s.label} value={n} pct={(n / max) * 100} />;
                })}
              </Panel>

              <Panel title="Lead source attribution">
                {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([s, n]) => {
                  const max = Math.max(...Object.values(sourceCounts));
                  return <Bar key={s} label={s} value={n} pct={(n / max) * 100} color="var(--color-steel)" />;
                })}
              </Panel>

              <Panel title="Most-quoted nets">
                {topNets.map(([net, n]) => {
                  const max = topNets[0][1];
                  return <Bar key={net} label={net.replace("Standard ", "Std ").replace("Extreme ", "Ext ")} value={n} pct={(n / max) * 100} color="var(--color-brass)" />;
                })}
              </Panel>

              <Panel title="Operations">
                <Stat k="Installs scheduled" v={String(db.installations.filter((i) => new Date(i.scheduled_date) >= new Date()).length)} />
                <Stat k="Awaiting balance" v={String(db.quotes.filter((q) => q.status === "scheduled").length)} />
                <Stat k="Jobs completed" v={String(db.quotes.filter((q) => q.status === "installed").length)} />
                <Stat k="Total leads captured" v={String(quotes.length)} />
                <Stat k="Estimate emails sent" v={String(db.emails.length)} />
              </Panel>
            </div>
          </>
        ) : (
          <>
            {!gaDashboard.configured ? (
              <div className="card" style={{ padding: 24, maxWidth: 860 }}>
                <h3 className="display" style={{ fontSize: 18, color: "var(--color-navy)", marginTop: 0 }}>Finish GA4 reporting setup</h3>
                <p style={{ fontSize: 14, color: "var(--color-steel)", lineHeight: 1.7 }}>
                  The public site can already use the GA4 Measurement ID for tracking, but this reporting tab also needs the GA4 Property ID plus a service account with property access before it can pull live website reports into the CMS.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="es-ga-setup">
                  <MetricCard label="Tracking script" value={gaDashboard.trackingConfigured ? "Ready" : "Missing"} sub={gaDashboard.measurementId || "Add a GA4 Measurement ID"} />
                  <MetricCard label="Property ID" value={gaDashboard.propertyId || "Missing"} sub="Needed for the Data API" />
                  <MetricCard label="Reporting auth" value="Missing" sub="Add service account email + key" />
                </div>
                <ol style={{ margin: "18px 0 0", paddingLeft: 20, color: "var(--color-ink)", fontSize: 13.5, lineHeight: 1.8 }}>
                  <li>Add your GA4 Measurement ID in Settings.</li>
                  <li>Add the GA4 Property ID from Google Analytics.</li>
                  <li>Create a Google Cloud service account, enable the Google Analytics Data API, and paste the service account email + private key into Settings.</li>
                  <li>In Google Analytics Admin, grant that service account Viewer or Analyst access to the property.</li>
                </ol>
              </div>
            ) : gaDashboard.error ? (
              <div className="card" style={{ padding: 24, maxWidth: 860 }}>
                <h3 className="display" style={{ fontSize: 18, color: "var(--color-navy)", marginTop: 0 }}>Google Analytics connection issue</h3>
                <p style={{ fontSize: 14, color: "#a23c34", lineHeight: 1.7, marginBottom: 10 }}>{gaDashboard.error}</p>
                <p style={{ fontSize: 13, color: "var(--color-steel)", marginBottom: 0 }}>
                  Check the GA4 Property ID, the service account email, the private key formatting, and that the service account has access to the GA4 property.
                </p>
              </div>
            ) : gaDashboard.summary ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }} className="es-ga-metrics">
                  <MetricCard label="Active users (30d)" value={num(gaDashboard.summary.activeUsers30d)} sub={`${num(gaDashboard.summary.activeUsers7d)} in the last 7 days`} />
                  <MetricCard label="Sessions (30d)" value={num(gaDashboard.summary.sessions30d)} sub={`${num(gaDashboard.summary.pageViews30d)} page views`} />
                  <MetricCard label="New users (30d)" value={num(gaDashboard.summary.newUsers30d)} sub={`${num(gaDashboard.summary.events30d)} tracked events`} />
                  <MetricCard label="Engagement rate" value={pct(gaDashboard.summary.engagementRate30d)} sub={`${num(gaDashboard.summary.engagedSessions30d)} engaged sessions`} />
                  <MetricCard label="Bounce rate" value={pct(gaDashboard.summary.bounceRate30d)} sub={`Avg session ${seconds(gaDashboard.summary.avgSessionDuration30d)}`} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="es-ga-grid">
                  <Panel title="Quote flow">
                    <Stat k="Quotes created in CRM" v={String(quotes.length)} />
                    <Stat k="Quote emails sent" v={String(quoteEmails)} />
                    <Stat k="Public quote links created" v={String(publicQuoteLinks)} />
                    <Stat k="Quotes accepted online" v={String(quoteAccepted)} />
                    <Stat k="Deposit invoices generated" v={String(depositInvoices.length)} />
                    <Stat k="Deposits paid" v={String(paidDeposits)} />
                    <Stat k="Admin quote view events" v={String(quoteViews)} />
                  </Panel>

                  <Panel title="Connection status">
                    <Stat k="Measurement ID" v={gaDashboard.measurementId || "Missing"} />
                    <Stat k="Property ID" v={gaDashboard.propertyId || "Missing"} />
                    <Stat k="Tracking on public site" v={gaDashboard.trackingConfigured ? "Live" : "Not configured"} />
                    <Stat k="Public GA status" v={gaLive ? "Tracking enabled" : "No measurement ID"} />
                    <Stat k="Report refreshed" v={gaDashboard.generatedAt ? new Date(gaDashboard.generatedAt).toLocaleString("en-ZA") : "—"} />
                  </Panel>

                  <Panel title="Top pages (last 30 days)">
                    <Table headers={["Page", "Views", "Users"]} rows={(gaDashboard.topPages ?? []).map((page) => [`${page.title} (${page.path})`, num(page.views), num(page.activeUsers)])} />
                  </Panel>

                  <Panel title="Traffic channels (last 30 days)">
                    <Table headers={["Channel", "Sessions", "Users"]} rows={(gaDashboard.channels ?? []).map((channel) => [channel.channel, num(channel.sessions), num(channel.activeUsers)])} />
                  </Panel>

                  <Panel title="Tracked events (last 30 days)">
                    <Table headers={["Event", "Count", "Users"]} rows={(gaDashboard.events ?? []).map((event) => [event.name, num(event.count), num(event.users)])} />
                  </Panel>

                  <Panel title="Relevant analytics signals">
                    <Stat k="Tracked public events" v="quote_submitted, estimate_email_intent, contact_submitted" />
                    <Stat k="Accept quote path" v="/q/[token] + accept flow" />
                    <Stat k="Payment intent path" v="/pay/[invoiceId]" />
                    <Stat k="CRM follow-up" v="Quotes, invoices, deposits, scheduling" />
                  </Panel>
                </div>
              </>
            ) : null}
          </>
        )}

        <p style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 18 }}>
          Reports now combine live CRM figures with GA4 public-site reporting in one place. Use the Google Analytics tab for traffic, engagement, and quote-flow visibility, and Settings to maintain the Measurement ID, Property ID, and service-account credentials.
        </p>
      </div>
      <style>{`
        @media (max-width:1100px){
          .es-ga-metrics{ grid-template-columns:1fr 1fr !important; }
        }
        @media (max-width:900px){
          .es-kpi{ grid-template-columns:1fr 1fr !important; }
          .es-2col{ grid-template-columns:1fr !important; }
          .es-ga-grid{ grid-template-columns:1fr !important; }
        }
        @media (max-width:700px){
          .es-ga-metrics{ grid-template-columns:1fr !important; }
          .es-ga-setup{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </>
  );
}

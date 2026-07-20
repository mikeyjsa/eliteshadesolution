import Link from "next/link";
import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import { getGoogleAnalyticsDashboard } from "@/lib/google-analytics";

export const dynamic = "force-dynamic";

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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 16 }}>{title}</h3>
      {children}
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

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string>>;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  textAlign: "left",
                  padding: "0 0 10px",
                  color: "var(--color-steel)",
                  fontSize: 11.5,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  borderBottom: "1px solid var(--color-line)",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid var(--color-mist)",
                    color: cellIndex === 0 ? "var(--color-navy)" : "var(--color-ink)",
                    fontWeight: cellIndex === 0 ? 600 : 500,
                  }}
                >
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

export default async function GoogleAnalyticsPage() {
  const db = await getDB();
  const dashboard = await getGoogleAnalyticsDashboard(db.settings);

  return (
    <>
      <AdminHead eyebrow="Insight" title="Google Analytics">
        <Link href="/admin/settings" className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: 13 }}>GA settings →</Link>
      </AdminHead>
      <div style={{ padding: 28 }}>
        {!dashboard.configured ? (
          <div className="card" style={{ padding: 24, maxWidth: 860 }}>
            <h3 className="display" style={{ fontSize: 18, color: "var(--color-navy)", marginTop: 0 }}>Finish GA4 reporting setup</h3>
            <p style={{ fontSize: 14, color: "var(--color-steel)", lineHeight: 1.7 }}>
              The public site can already use the GA4 Measurement ID for tracking, but this dashboard also needs the GA4 Property ID plus a service account with property access before it can pull live website reports into admin.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="es-ga-setup">
              <MetricCard label="Tracking script" value={dashboard.trackingConfigured ? "Ready" : "Missing"} sub={dashboard.measurementId || "Add a GA4 Measurement ID"} />
              <MetricCard label="Property ID" value={dashboard.propertyId || "Missing"} sub="Needed for the Data API" />
              <MetricCard label="Reporting auth" value="Missing" sub="Add service account email + key" />
            </div>
            <ol style={{ margin: "18px 0 0", paddingLeft: 20, color: "var(--color-ink)", fontSize: 13.5, lineHeight: 1.8 }}>
              <li>Add your GA4 Measurement ID in Settings.</li>
              <li>Add the GA4 Property ID from Google Analytics.</li>
              <li>Create a Google Cloud service account, enable the Google Analytics Data API, and paste the service account email + private key into Settings.</li>
              <li>In Google Analytics Admin, grant that service account Viewer or Analyst access to the property.</li>
            </ol>
          </div>
        ) : dashboard.error ? (
          <div className="card" style={{ padding: 24, maxWidth: 860 }}>
            <h3 className="display" style={{ fontSize: 18, color: "var(--color-navy)", marginTop: 0 }}>Google Analytics connection issue</h3>
            <p style={{ fontSize: 14, color: "#a23c34", lineHeight: 1.7, marginBottom: 10 }}>{dashboard.error}</p>
            <p style={{ fontSize: 13, color: "var(--color-steel)", marginBottom: 0 }}>
              Check the GA4 Property ID, the service account email, the private key formatting, and that the service account has access to the GA4 property.
            </p>
          </div>
        ) : dashboard.summary ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 24 }} className="es-ga-metrics">
              <MetricCard label="Active users (30d)" value={num(dashboard.summary.activeUsers30d)} sub={`${num(dashboard.summary.activeUsers7d)} in the last 7 days`} />
              <MetricCard label="Sessions (30d)" value={num(dashboard.summary.sessions30d)} sub={`${num(dashboard.summary.pageViews30d)} page views`} />
              <MetricCard label="New users (30d)" value={num(dashboard.summary.newUsers30d)} sub={`${num(dashboard.summary.events30d)} tracked events`} />
              <MetricCard label="Engagement rate" value={pct(dashboard.summary.engagementRate30d)} sub={`${num(dashboard.summary.engagedSessions30d)} engaged sessions`} />
              <MetricCard label="Bounce rate" value={pct(dashboard.summary.bounceRate30d)} sub={`Avg session ${seconds(dashboard.summary.avgSessionDuration30d)}`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }} className="es-ga-grid">
              <Panel title="Top pages (last 30 days)">
                <Table
                  headers={["Page", "Views", "Users"]}
                  rows={(dashboard.topPages ?? []).map((page) => [
                    `${page.title} (${page.path})`,
                    num(page.views),
                    num(page.activeUsers),
                  ])}
                />
              </Panel>

              <Panel title="Traffic channels (last 30 days)">
                <Table
                  headers={["Channel", "Sessions", "Users"]}
                  rows={(dashboard.channels ?? []).map((channel) => [
                    channel.channel,
                    num(channel.sessions),
                    num(channel.activeUsers),
                  ])}
                />
              </Panel>

              <Panel title="Top tracked events (last 30 days)">
                <Table
                  headers={["Event", "Count", "Users"]}
                  rows={(dashboard.events ?? []).map((event) => [
                    event.name,
                    num(event.count),
                    num(event.users),
                  ])}
                />
              </Panel>

              <Panel title="Connection status">
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-mist)" }}>
                  <span style={{ fontSize: 13.5, color: "var(--color-steel)" }}>Measurement ID</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)" }}>{dashboard.measurementId || "Missing"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-mist)" }}>
                  <span style={{ fontSize: 13.5, color: "var(--color-steel)" }}>Property ID</span>
                  <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)" }}>{dashboard.propertyId}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-mist)" }}>
                  <span style={{ fontSize: 13.5, color: "var(--color-steel)" }}>Tracking on public site</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: dashboard.trackingConfigured ? "var(--color-signal)" : "var(--color-warn)" }}>
                    {dashboard.trackingConfigured ? "Live" : "Not configured"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0" }}>
                  <span style={{ fontSize: 13.5, color: "var(--color-steel)" }}>Report refreshed</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)" }}>
                    {dashboard.generatedAt ? new Date(dashboard.generatedAt).toLocaleString("en-ZA") : "—"}
                  </span>
                </div>
              </Panel>
            </div>
          </>
        ) : null}
      </div>
      <style>{`
        @media (max-width:1100px){
          .es-ga-metrics{ grid-template-columns:1fr 1fr !important; }
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

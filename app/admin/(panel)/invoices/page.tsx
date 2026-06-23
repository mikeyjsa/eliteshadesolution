import Link from "next/link";
import { getDB } from "@/lib/db";
import { zar, dateZA } from "@/lib/format";
import AdminHead from "@/components/AdminHead";

export const dynamic = "force-dynamic";

export default async function Invoices() {
  const db = await getDB();
  const rows = db.invoices.map((inv) => {
    const q = db.quotes.find((x) => x.id === inv.quote_id);
    const c = q && db.customers.find((x) => x.id === q.customer_id);
    return { inv, q, c };
  });
  const collected = db.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const due = db.invoices.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <AdminHead eyebrow="Money" title="Invoices &amp; PayFast" />
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
          <Stat label="Collected" value={zar(collected)} accent />
          <Stat label="Outstanding" value={zar(due)} />
          <Stat label="Invoices" value={String(db.invoices.length)} />
        </div>

        {rows.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-steel)" }}>
            No invoices yet. Confirm a quote and generate a deposit invoice from the lead detail.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "var(--color-navy)", color: "#fff", textAlign: "left" }}>
                  <th style={{ padding: "11px 16px" }}>Invoice</th>
                  <th style={{ padding: "11px 16px" }}>Customer</th>
                  <th style={{ padding: "11px 16px" }}>Type</th>
                  <th style={{ padding: "11px 16px" }}>Issued</th>
                  <th style={{ padding: "11px 16px", textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "11px 16px" }}>Status</th>
                  <th style={{ padding: "11px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ inv, q, c }) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-navy)" }}>{inv.number}</td>
                    <td style={{ padding: "10px 16px" }}>
                      {q ? <Link href={`/admin/quotes/${q.id}`} style={{ color: "var(--color-steel)", textDecoration: "none" }}>{c?.name}</Link> : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", textTransform: "capitalize" }}>{inv.type}</td>
                    <td style={{ padding: "10px 16px", color: "var(--color-steel)" }}>{dateZA(inv.issued_at)}</td>
                    <td className="tnum" style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>{zar(inv.amount)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: inv.status === "paid" ? "var(--color-signal)" : "var(--color-warn)", background: inv.status === "paid" ? "#eef4f0" : "var(--color-brass-soft)", padding: "3px 9px", borderRadius: 14 }}>{inv.status}</span>
                      {inv.payfast_id && <div style={{ fontSize: 10.5, color: "var(--color-silver)", marginTop: 2 }}>{inv.payfast_id}</div>}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/admin/invoices/${inv.id}`} style={{ color: "var(--color-navy)", fontWeight: 700, fontSize: 12.5, marginRight: 10 }}>View</Link>
                      <a href={inv.pdf_url!} target="_blank" rel="noreferrer" style={{ color: "var(--color-steel)", fontSize: 12.5, marginRight: 10 }}>PDF</a>
                      {inv.status === "unpaid" && <a href={`/pay/${inv.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-brass)", fontWeight: 700, fontSize: 12.5 }}>Pay</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: "16px 22px", borderTop: `3px solid ${accent ? "var(--color-signal)" : "var(--color-navy)"}`, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "var(--color-steel)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div className="display tnum" style={{ fontSize: 24, color: "var(--color-navy)" }}>{value}</div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { zar } from "@/lib/format";
import PayButton from "@/components/PayButton";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const db = await getDB();
  const inv = db.invoices.find((i) => i.id === invoiceId);
  if (!inv) notFound();
  const q = db.quotes.find((x) => x.id === inv.quote_id);
  const c = q && db.customers.find((x) => x.id === q.customer_id);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-lift)", background: "#fff" }}>
        <div style={{ background: "#0a3d62", color: "#fff", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong style={{ fontFamily: "var(--font-display)", letterSpacing: ".05em" }}>PayFast</strong>
          <span style={{ fontSize: 12, opacity: 0.85 }}>Secure checkout (sandbox)</span>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ fontSize: 13, color: "var(--color-steel)" }}>Pay to</div>
          <div className="display" style={{ fontSize: 18, color: "var(--color-navy)", marginBottom: 16 }}>{db.settings.company_name}</div>

          <div style={{ background: "var(--color-mist)", borderRadius: 10, padding: "16px 18px", marginBottom: 18 }}>
            <Row k="Invoice" v={inv.number} />
            <Row k="Type" v={inv.type === "deposit" ? `Deposit (${db.settings.deposit_pct}%)` : "Balance"} />
            <Row k="Customer" v={c?.name ?? ""} />
            <div style={{ borderTop: "1px solid var(--color-line)", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--color-navy)" }}>Amount due</span>
              <span className="display tnum" style={{ fontSize: 24, color: "var(--color-navy)" }}>{zar(inv.amount)}</span>
            </div>
          </div>

          {inv.status === "paid" ? (
            <div style={{ background: "#eef4f0", border: "1px solid var(--color-signal)", borderRadius: 10, padding: "14px 16px", color: "#2c5a3e", fontWeight: 600, textAlign: "center" }}>
              ✓ Paid — thank you. You can close this page.
            </div>
          ) : (
            <PayButton invoiceId={inv.id} />
          )}
          <p style={{ fontSize: 11, color: "var(--color-silver)", textAlign: "center", marginTop: 14 }}>
            Mock gateway — clicking pay simulates a successful PayFast ITN. No real money moves.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "3px 0" }}>
      <span style={{ color: "var(--color-steel)" }}>{k}</span>
      <span style={{ color: "var(--color-navy)", fontWeight: 600 }}>{v}</span>
    </div>
  );
}

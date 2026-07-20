import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDB } from "@/lib/db";
import { zar } from "@/lib/format";
import { quoteNumber } from "@/lib/pdf";
import { paymentOptionsLabel, paymentOptionsSentence } from "@/lib/site";
import AcceptQuote from "@/components/AcceptQuote";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your quote",
  robots: { index: false, follow: false },
};

// Public client-facing quote page, reached via the unguessable token link
// emailed on confirmation. View, download as PDF, and accept online.
export default async function ClientQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDB();
  const quote = db.quotes.find((x) => x.public_token === token);
  if (!quote || quote.final_total == null) notFound();
  const customer = db.customers.find((x) => x.id === quote.customer_id);
  if (!customer) notFound();

  const items = quote.final_line_items ?? quote.line_items;
  const total = quote.final_total;
  const vat = db.settings.vat_enabled ? total * 0.15 : 0;
  const depositAmount = Math.round(total * db.settings.deposit_pct / 100);
  const depositInvoice = db.invoices.find((i) => i.quote_id === quote.id && i.type === "deposit") ?? null;
  const issued = new Date(quote.updated_at || quote.created_at);
  const validUntil = new Date(issued.getTime() + 14 * 24 * 3600 * 1000);
  const accepted = Boolean(quote.accepted_at);

  return (
    <section style={{ background: "var(--color-mist)", padding: "48px 20px 80px", minHeight: "70vh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* header card */}
        <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
          <div style={{ background: "var(--color-navy-deep)", padding: "26px 30px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span className="eyebrow">Quotation · {quoteNumber(quote)}</span>
              <h1 className="display" style={{ fontSize: 26, color: "#fff", margin: "8px 0 4px" }}>
                Prepared for {customer.name}
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-silver)" }}>
                Issued {issued.toLocaleDateString("en-ZA")} · valid until {validUntil.toLocaleDateString("en-ZA")}
              </p>
            </div>
            <span style={{
              background: accepted ? "rgba(63,143,95,.25)" : "rgba(201,162,75,.22)",
              border: `1px solid ${accepted ? "var(--color-signal)" : "var(--color-brass)"}`,
              color: accepted ? "#a9e0bf" : "var(--color-brass)",
              fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
              padding: "6px 14px", borderRadius: 20, whiteSpace: "nowrap",
            }}>
              {accepted ? "Accepted" : "Awaiting acceptance"}
            </span>
          </div>

          {/* line items */}
          <div style={{ padding: "26px 30px" }}>
            {quote.net_label !== "Contact form enquiry" && (
              <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "var(--color-steel)" }}>
                {quote.inputs.length}m × {quote.inputs.width}m · {quote.inputs.poles ? "free-standing (poles)" : "wall-fixed"} · {quote.inputs.colour} · {quote.net_label}
              </p>
            )}
            {items.map((li, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--color-mist)", fontSize: 14.5 }}>
                <span style={{ color: "var(--color-ink)" }}>{li.label}</span>
                <span className="tnum" style={{ fontWeight: 700, color: "var(--color-navy)", whiteSpace: "nowrap" }}>{zar(li.amount)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontSize: 14, color: "var(--color-steel)" }}>
              <span>Subtotal (excl VAT)</span><span className="tnum">{zar(total)}</span>
            </div>
            {db.settings.vat_enabled && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 0", fontSize: 14, color: "var(--color-steel)" }}>
                <span>VAT @ 15%</span><span className="tnum">{zar(vat)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "2px solid var(--color-navy)" }}>
              <span className="display" style={{ fontSize: 17, color: "var(--color-navy)" }}>Quote total</span>
              <span className="display tnum" style={{ fontSize: 26, color: "var(--color-navy)" }}>{zar(total + vat)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-warn)", marginTop: 6 }}>
              <span>Deposit to secure your install date ({db.settings.deposit_pct}%)</span>
              <span className="tnum" style={{ fontWeight: 700 }}>{zar(depositAmount)}</span>
            </div>
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="es-2col">
          <div className="card" style={{ padding: "22px 24px" }}>
            <h2 className="display" style={{ fontSize: 16, color: "var(--color-navy)", margin: "0 0 8px" }}>Keep a copy</h2>
            <p style={{ fontSize: 13.5, color: "var(--color-steel)", margin: "0 0 14px", lineHeight: 1.6 }}>
              Download your full quotation as a branded PDF for your records.
            </p>
            <a href={`/api/quotes/${token}/pdf`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-block" }}>
              Download quote PDF ↓
            </a>
          </div>
          <div className="card" style={{ padding: "22px 24px", borderTop: "3px solid var(--color-brass)" }}>
            <h2 className="display" style={{ fontSize: 16, color: "var(--color-navy)", margin: "0 0 8px" }}>
              {accepted ? "You're all set" : "Ready to go ahead?"}
            </h2>
            <AcceptQuote
              token={token}
              accepted={accepted}
              depositAmount={depositAmount}
              invoiceId={depositInvoice?.id ?? null}
              paymentLabel={paymentOptionsLabel(db.settings)}
              paymentSentence={paymentOptionsSentence(db.settings)}
            />
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--color-steel)", marginTop: 22, lineHeight: 1.7, textAlign: "center" }}>
          Questions about this quote? Reply to the email it arrived in, or reach us at{" "}
          <a href={`mailto:${db.settings.email_from || "sales@eliteshadesolutions.co.za"}`} style={{ color: "var(--color-warn)" }}>
            {db.settings.email_from || "sales@eliteshadesolutions.co.za"}
          </a>. Final scope is confirmed at your free site survey.
        </p>
      </div>
      <style>{`@media (max-width:700px){ .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </section>
  );
}

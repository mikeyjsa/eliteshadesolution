"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zar, dateZA } from "@/lib/format";
import type { Invoice, Quote, Customer } from "@/lib/types";

export default function InvoiceDetail({ invoice, quote, customer }: { invoice: Invoice; quote: Quote; customer: Customer }) {
  const router = useRouter();
  const [amount, setAmount] = useState(invoice.amount);
  const [type, setType] = useState(invoice.type);
  const [status, setStatus] = useState(invoice.status);
  const [paymentNote, setPaymentNote] = useState(invoice.payment_note ?? "");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");

  const items = quote.final_line_items ?? quote.line_items;
  const priceLocked = quote.final_total != null;

  async function toDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read proof file"));
      reader.readAsDataURL(file);
    });
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const proofDataUrl = proofFile ? await toDataUrl(proofFile) : undefined;
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, type, status, payment_note: paymentNote, proofDataUrl, proofName: proofFile?.name }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setProofFile(null);
      setMsg(status === "paid" ? "Payment details saved." : "Invoice updated.");
      router.refresh();
    } else {
      setMsg("Could not save the invoice.");
    }
  }

  const inp: React.CSSProperties = { fontSize: 14, padding: "9px 12px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%" };
  const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--color-line)", borderRadius: 14, padding: 24, marginBottom: 18 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }} className="es-detail-grid">
      {/* Document preview */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid var(--color-navy)", paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <div className="display" style={{ fontSize: 20, color: "var(--color-navy)" }}>{invoice.type === "deposit" ? "Deposit Invoice" : "Balance Invoice"}</div>
            <div style={{ fontSize: 13, color: "var(--color-steel)" }}>{invoice.number} · issued {dateZA(invoice.issued_at)}</div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: invoice.status === "paid" ? "var(--color-signal)" : "var(--color-warn)", background: invoice.status === "paid" ? "#eef4f0" : "var(--color-brass-soft)", padding: "5px 12px", borderRadius: 14 }}>{invoice.status}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, fontSize: 13.5 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--color-silver)" }}>Bill to</div>
            <div style={{ fontWeight: 700, color: "var(--color-navy)" }}>{customer.name}</div>
            <div style={{ color: "var(--color-steel)" }}>{customer.email}</div>
            <div style={{ color: "var(--color-steel)" }}>{customer.phone} · {customer.suburb}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--color-silver)" }}>Project</div>
            <div style={{ color: "var(--color-steel)", maxWidth: 180 }}>{quote.inputs.length}m × {quote.inputs.width}m</div>
            <div style={{ color: "var(--color-steel)", fontSize: 12 }}>{quote.net_label}</div>
          </div>
        </div>

        {items.map((li, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid var(--color-mist)" }}>
            <span style={{ color: "var(--color-ink)" }}>{li.label}</span>
            <span className="tnum" style={{ fontWeight: 600 }}>{zar(li.amount)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontWeight: 800, color: "var(--color-navy)" }}>
          <span>{invoice.type === "deposit" ? "Deposit due" : "Balance due"}</span>
          <span className="display tnum" style={{ fontSize: 20, color: "var(--color-brass)" }}>{zar(invoice.amount)}</span>
        </div>

        <a href={invoice.pdf_url!} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-block", marginTop: 18 }}>↓ Download branded PDF</a>
        {invoice.proof_url && (
          <a href={invoice.proof_url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-block", marginTop: 10, marginLeft: 10 }}>View proof of payment ↗</a>
        )}
      </div>

      {/* Edit */}
      <div>
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Invoice pricing</h3>
          <p style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 0 }}>
            {priceLocked ? "The firm price is confirmed, so amount and invoice type are locked." : "This invoice can still be adjusted until the firm price is locked."}
          </p>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 }}>Amount (R)</label>
          <input type="number" value={amount} onChange={(e) => { setAmount(+e.target.value); setSaved(false); }} style={{ ...inp, marginBottom: 12 }} className="tnum" disabled={priceLocked} />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 }}>Type</label>
          <select value={type} onChange={(e) => { setType(e.target.value as Invoice["type"]); setSaved(false); }} style={{ ...inp, marginBottom: 12 }} disabled={priceLocked}>
            <option value="deposit">Deposit</option><option value="balance">Balance</option>
          </select>
        </div>
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Payments</h3>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 }}>Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value as Invoice["status"]); setSaved(false); }} style={{ ...inp, marginBottom: 16 }}>
            <option value="unpaid">Unpaid</option><option value="paid">Paid (mark manually)</option>
          </select>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 }}>Payment note / reference</label>
          <textarea value={paymentNote} onChange={(e) => { setPaymentNote(e.target.value); setSaved(false); }} style={{ ...inp, marginBottom: 12, minHeight: 88, resize: "vertical" }} placeholder="Optional: EFT reference, payer name, bank confirmation note..." />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 }}>Proof of payment</label>
          <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" onChange={(e) => { setProofFile(e.target.files?.[0] ?? null); setSaved(false); }} style={{ ...inp, marginBottom: 10, padding: "8px 10px" }} />
          <div style={{ fontSize: 12, color: "var(--color-steel)", marginBottom: 16 }}>
            {proofFile ? `Ready to upload: ${proofFile.name}` : invoice.proof_url ? "A proof file is already attached to this invoice." : "Optional. Upload a PDF or image when you record a manual payment."}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn-brass" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            {saved && <span style={{ color: "var(--color-signal)", fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
          </div>
          {msg && <p style={{ fontSize: 12.5, color: msg.startsWith("Could") ? "#a23c34" : "var(--color-steel)", marginBottom: 0 }}>{msg}</p>}
        </div>
        {invoice.status === "unpaid" && (
          <div style={card}>
            <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 8 }}>Take payment</h3>
            <p style={{ fontSize: 13, color: "var(--color-steel)", marginTop: 0 }}>Send the customer the PayFast link, or open it to simulate.</p>
            <a href={`/pay/${invoice.id}`} target="_blank" rel="noreferrer" className="btn-brass" style={{ display: "block", textAlign: "center" }}>Open PayFast page →</a>
          </div>
        )}
      </div>
      <style>{`@media (max-width:900px){ .es-detail-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

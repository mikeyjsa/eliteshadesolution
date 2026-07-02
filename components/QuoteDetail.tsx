"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zar } from "@/lib/format";
import type { Rates } from "@/lib/quote-engine";
import { STAGES, type Quote, type Customer, type Invoice, type Activity, type QuoteLineItem } from "@/lib/types";
import AdminShadeCalculator from "@/components/AdminShadeCalculator";

export default function QuoteDetail({
  quote,
  customer,
  invoices,
  activities,
  depositPct,
  scheduledDate,
  addOptions,
  rates,
}: {
  quote: Quote;
  customer: Customer;
  invoices: Invoice[];
  activities: Activity[];
  depositPct: number;
  scheduledDate: string | null;
  addOptions: QuoteLineItem[];
  rates: Rates;
}) {
  const router = useRouter();
  const [items, setItems] = useState<QuoteLineItem[]>(
    quote.final_line_items ?? quote.line_items.map((li) => ({ ...li }))
  );
  const [address, setAddress] = useState(customer.address ?? "");
  const [addressSaved, setAddressSaved] = useState(false);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(scheduledDate ?? "");
  const [installer, setInstaller] = useState("Crew A");
  const [busy, setBusy] = useState("");
  const [picker, setPicker] = useState("");

  const total = items.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  const locked = quote.final_total != null;
  const scheduleLocked = quote.status === "scheduled" || quote.status === "installed";
  const depositAmt = Math.round(total * depositPct / 100);

  async function patch(body: Record<string, unknown>, tag: string) {
    setBusy(tag);
    await fetch(`/api/leads/${quote.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy("");
    router.refresh();
  }

  function setItem(i: number, patch: Partial<QuoteLineItem>) {
    setItems((arr) => arr.map((li, idx) => (idx === i ? { ...li, ...patch } : li)));
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }
  function addItem(li: QuoteLineItem) {
    setItems((arr) => [...arr, { ...li }]);
  }

  async function confirmPrice() {
    // Locking the price also emails the client their quote with a
    // view/download/accept link.
    await patch({
      final_line_items: items,
      status: quote.status === "new" || quote.status === "following_up" ? "confirmed" : quote.status,
      send_quote_email: true,
    }, "confirm");
  }
  async function resendQuoteEmail() {
    await patch({ send_quote_email: true }, "resend");
  }
  async function genInvoice(type: "deposit" | "balance") {
    setBusy(type);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: quote.id, type }) });
    setBusy("");
    if (res.ok) router.refresh();
    else alert((await res.json()).error);
  }
  async function schedule() {
    if (!date) return;
    setBusy("schedule");
    await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: quote.id, date, installer }) });
    setBusy("");
    router.refresh();
  }
  async function addNote() {
    if (!note.trim()) return;
    await patch({ activity: note.trim() }, "note");
    setNote("");
  }
  async function archive(v: boolean) {
    await patch({ archived: v }, "archive");
  }

  const stageLabel = STAGES.find((s) => s.key === quote.status)?.label ?? quote.status;
  const hasDeposit = invoices.some((i) => i.type === "deposit");
  const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--color-line)", borderRadius: 14, padding: 22, marginBottom: 18 };
  const inp: React.CSSProperties = { fontSize: 14, padding: "9px 12px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }} className="es-detail-grid">
      {/* LEFT */}
      <div>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 className="display" style={{ fontSize: 22, color: "var(--color-navy)", margin: 0 }}>{customer.name}</h2>
              <p style={{ color: "var(--color-steel)", fontSize: 14, margin: "4px 0 0" }}>{customer.email} · {customer.phone || "—"}</p>
              <p style={{ color: "var(--color-steel)", fontSize: 14, margin: "2px 0 0" }}>{customer.suburb} · via {customer.source}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <input
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setAddressSaved(false); }}
                  placeholder="Invoice address (street, suburb, postal code)"
                  style={{ fontSize: 13, padding: "6px 10px", border: "1px solid var(--color-line)", borderRadius: 8, flex: 1 }}
                  disabled={scheduleLocked}
                />
                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" }} onClick={async () => {
                  await fetch(`/api/leads/${quote.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) });
                  setAddressSaved(true);
                }} disabled={scheduleLocked}>Save</button>
                {addressSaved && <span style={{ fontSize: 11, color: "var(--color-signal)" }}>✓</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span style={{ background: "var(--color-navy)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "5px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".04em" }}>{stageLabel}</span>
              {quote.archived && <span style={{ background: "var(--color-mist)", color: "var(--color-steel)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase" }}>Archived</span>}
            </div>
          </div>
        </div>

        {/* Contact form enquiry banner */}
        {quote.net_label === "Contact form enquiry" && (
          <div style={{ ...card, borderLeft: "4px solid var(--color-brass)", background: "var(--color-brass-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: quote.notes ? 10 : 0 }}>
              <span style={{ fontSize: 20 }}>✉</span>
              <div>
                <div className="display" style={{ fontSize: 15, color: "var(--color-navy)" }}>Contact form enquiry</div>
                <div style={{ fontSize: 12.5, color: "var(--color-warn)" }}>No estimate yet — confirm sizing with the customer then build a quote below.</div>
              </div>
            </div>
            {quote.notes && (
              <div style={{ marginTop: 8, padding: "12px 14px", background: "#fff", borderRadius: 9, fontSize: 14, color: "var(--color-ink)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                <strong style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-steel)" }}>Their message</strong><br />
                {quote.notes}
              </div>
            )}
          </div>
        )}

        <AdminShadeCalculator
          quoteId={quote.id}
          initialInputs={quote.inputs}
          initialNetLabel={quote.net_label}
          initialRange={{ low: quote.estimate_low, high: quote.estimate_high }}
          rates={rates}
          onApplyEstimate={(nextItems) => setItems(nextItems)}
          disabled={scheduleLocked}
        />

        {/* Editable breakdown */}
        <div style={{ ...card, opacity: scheduleLocked ? 0.58 : 1, pointerEvents: scheduleLocked ? "none" : "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", margin: 0 }}>{locked ? "Confirmed breakdown" : "Estimate breakdown"}</h3>
            <span style={{ fontSize: 12, color: "var(--color-steel)" }}>{scheduleLocked ? "Locked after scheduling" : "Edit · add · remove items"}</span>
          </div>
          {quote.net_label !== "Contact form enquiry" && (
            <p style={{ fontSize: 13.5, color: "var(--color-steel)", marginTop: 0 }}>
              {quote.inputs.length}m × {quote.inputs.width}m · {quote.inputs.poles ? "free-standing (poles)" : "wall-fixed"} · {quote.net_label}
            </p>
          )}

          {items.map((li, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--color-mist)" }}>
              <input value={li.label} onChange={(e) => setItem(i, { label: e.target.value })} style={{ ...inp, flex: 1, padding: "7px 10px", fontSize: 13 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-steel)", fontSize: 13 }}>R</span>
                <input type="number" value={li.amount} onChange={(e) => setItem(i, { amount: +e.target.value })} className="tnum" style={{ ...inp, width: 92, textAlign: "right", padding: "7px 8px", fontSize: 13 }} />
              </div>
              <button onClick={() => removeItem(i)} title="Remove" style={{ background: "none", border: "none", color: "#a23c34", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}>×</button>
            </div>
          ))}

          {/* add row */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <select value={picker} onChange={(e) => { const o = addOptions.find((a) => a.label === e.target.value); if (o) addItem(o); setPicker(""); }} style={{ ...inp, flex: 1, minWidth: 180 }}>
              <option value="">+ Add item from price list…</option>
              {addOptions.map((o) => <option key={o.label} value={o.label}>{o.label} — {zar(o.amount)}</option>)}
            </select>
            <button className="btn-ghost" onClick={() => addItem({ label: "Custom item", amount: 0 })} style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>+ Blank</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, padding: "14px 0 0", fontWeight: 800, color: "var(--color-navy)" }}>
            <span>{locked ? "Firm total (excl VAT)" : "Working total (excl VAT)"}</span>
            <span className="tnum">{zar(total)}</span>
          </div>
          {!locked && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--color-steel)" }}>
              <span>Original customer-facing range</span><span className="tnum">{zar(quote.estimate_low)} – {zar(quote.estimate_high)}</span>
            </div>
          )}
        </div>

        {/* Activity */}
        <div style={{ ...card, opacity: scheduleLocked ? 0.58 : 1, pointerEvents: scheduleLocked ? "none" : "auto" }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 12 }}>Activity log</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input placeholder="Add a note (call, email, site visit…)" value={note} onChange={(e) => setNote(e.target.value)} style={inp} onKeyDown={(e) => e.key === "Enter" && addNote()} />
            <button className="btn-ghost" onClick={addNote} style={{ padding: "8px 14px" }}>Log</button>
          </div>
          {activities.length === 0 && <p style={{ color: "var(--color-steel)", fontSize: 13.5 }}>No activity yet.</p>}
          {activities.map((a) => (
            <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-mist)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-brass)", marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13.5, color: "var(--color-ink)" }}>{a.message}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-silver)" }}>{new Date(a.created_at).toLocaleString("en-ZA")} · {a.user}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — actions */}
      <div>
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 4 }}>1 · Confirm firm price</h3>
          <p style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 0 }}>{scheduleLocked ? "This quote is already scheduled, so pricing is now frozen." : "Apply or save the refreshed estimate first if needed, then lock the total here."}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--color-steel)" }}>Total of {items.length} items</span>
            <span className="display tnum" style={{ fontSize: 20, color: "var(--color-navy)" }}>{zar(total)}</span>
          </div>
          <button className="btn-brass" onClick={confirmPrice} disabled={scheduleLocked || busy === "confirm"} style={{ width: "100%" }}>
            {busy === "confirm" ? "Saving & emailing…" : locked ? "Update price & re-email quote" : "Confirm price & email quote"}
          </button>
          {locked && <p style={{ fontSize: 12.5, color: "var(--color-signal)", marginTop: 8 }}>Locked: <b className="tnum">{zar(quote.final_total!)}</b> · deposit {zar(depositAmt)}</p>}
          {locked && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--color-mist)", borderRadius: 9 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-steel)", marginBottom: 6 }}>
                Client quote link {quote.accepted_at && <span style={{ color: "var(--color-signal)" }}>· accepted {new Date(quote.accepted_at).toLocaleDateString("en-ZA")}</span>}
              </div>
              {quote.public_token ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <a href={`/q/${quote.public_token}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--color-warn)", fontWeight: 600, wordBreak: "break-all", flex: 1 }}>
                    /q/{quote.public_token.slice(0, 12)}…
                  </a>
                  <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11.5, whiteSpace: "nowrap" }} onClick={resendQuoteEmail} disabled={busy === "resend"}>
                    {busy === "resend" ? "Sending…" : "Resend email"}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--color-steel)" }}>Generated when you confirm the price.</div>
              )}
            </div>
          )}
        </div>

        <div style={{ ...card, opacity: locked ? 1 : 0.5, pointerEvents: locked ? "auto" : "none" }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 4 }}>2 · Invoice &amp; deposit</h3>
          {invoices.length === 0 && <p style={{ fontSize: 12.5, color: "var(--color-steel)" }}>Generate the {depositPct}% deposit invoice to take payment.</p>}
          {invoices.map((inv) => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-mist)" }}>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--color-navy)", fontWeight: 600 }}>{inv.number} · {inv.type}</div>
                <div className="tnum" style={{ fontSize: 12.5, color: "var(--color-steel)" }}>{zar(inv.amount)} · <span style={{ color: inv.status === "paid" ? "var(--color-signal)" : "var(--color-warn)" }}>{inv.status}</span></div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <a href={`/admin/invoices/${inv.id}`} className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>View</a>
                {inv.status === "unpaid" && <a href={`/pay/${inv.id}`} target="_blank" rel="noreferrer" className="btn-brass" style={{ padding: "5px 10px", fontSize: 12 }}>Pay link</a>}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {!hasDeposit && <button className="btn-brass" onClick={() => genInvoice("deposit")} disabled={busy === "deposit"} style={{ flex: 1, padding: "9px", fontSize: 13 }}>Generate deposit</button>}
            {hasDeposit && <button className="btn-ghost" onClick={() => genInvoice("balance")} disabled={busy === "balance"} style={{ flex: 1, padding: "9px", fontSize: 13 }}>Generate balance</button>}
          </div>
        </div>

        <div style={{ ...card, opacity: locked && !scheduleLocked ? 1 : locked ? 0.58 : 0.5, pointerEvents: locked && !scheduleLocked ? "auto" : locked ? "none" : "none" }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 4 }}>3 · Schedule install</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
            <select value={installer} onChange={(e) => setInstaller(e.target.value)} style={inp}>
              <option>Crew A</option><option>Crew B</option>
            </select>
            <button className="btn-brass" onClick={schedule} disabled={busy === "schedule" || !date} style={{ padding: "9px", fontSize: 13 }}>
              {busy === "schedule" ? "…" : scheduleLocked ? "Install scheduled" : "Book & email customer"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a href={`mailto:${customer.email}`} className="btn-ghost" style={{ flex: 1, textAlign: "center" }}>Email {customer.name.split(" ")[0]}</a>
          <button className="btn-ghost" onClick={() => archive(!quote.archived)} style={{ flex: 1 }} disabled={scheduleLocked}>{quote.archived ? "Restore" : "Archive"}</button>
        </div>
      </div>
      <style>{`@media (max-width:900px){ .es-detail-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

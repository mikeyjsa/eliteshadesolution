"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calcQuote, type QuoteResult, type Rates } from "@/lib/quote-engine";
import { zar } from "@/lib/format";
import { FABRIC_COLOURS, type Quote, type QuoteInputs, type QuoteLineItem } from "@/lib/types";

const inp: React.CSSProperties = {
  fontSize: 14,
  padding: "10px 12px",
  border: "1px solid var(--color-line)",
  borderRadius: 9,
  width: "100%",
  background: "#fff",
  color: "var(--color-ink)",
};

export default function AdminShadeCalculator({
  quoteId,
  initialInputs,
  initialNetLabel,
  initialRange,
  rates,
  onApplyEstimate,
  disabled = false,
}: {
  quoteId: string;
  initialInputs: Quote["inputs"];
  initialNetLabel: string;
  initialRange: { low: number; high: number };
  rates: Rates;
  onApplyEstimate: (items: QuoteLineItem[]) => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [inputs, setInputs] = useState<QuoteInputs>(initialInputs);
  const [busy, setBusy] = useState<"" | "save">("");
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => calcQuote(inputs, rates), [inputs, rates]);
  const changed =
    JSON.stringify(inputs) !== JSON.stringify(initialInputs) ||
    result.netLabel !== initialNetLabel ||
    result.low !== initialRange.low ||
    result.high !== initialRange.high;

  function update<K extends keyof QuoteInputs>(key: K, value: QuoteInputs[K]) {
    setSaved(false);
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function applyEstimate() {
    onApplyEstimate(result.lineItems.map((item) => ({ ...item })));
  }

  async function saveEstimate() {
    setBusy("save");
    onApplyEstimate(result.lineItems.map((item) => ({ ...item })));
    const res = await fetch(`/api/leads/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs,
        line_items: result.lineItems,
        net_label: result.netLabel,
        subtotal: result.subtotal,
        vat: result.vat,
        estimate_low: result.low,
        estimate_high: result.high,
        exceeded: result.exceeded,
        estimate_recalculated: true,
      }),
    });
    setBusy("");
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--color-line)", borderRadius: 14, padding: 22, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", margin: 0 }}>Admin shade calculator</h3>
          <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "6px 0 0" }}>
            Re-use the live quote engine, then choose whether to apply the refreshed estimate locally or save it back to the lead.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-silver)" }}>Estimate range</div>
          <div className="display tnum" style={{ fontSize: 20, color: "var(--color-navy)", marginTop: 4 }}>
            {zar(result.low)} – {zar(result.high)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }} className="es-admin-calc-grid">
        <Field label="Area length (m)">
          <input type="number" min={0} step={0.1} value={inputs.length} onChange={(e) => update("length", Number(e.target.value) || 0)} style={inp} disabled={disabled} />
        </Field>
        <Field label="Area width (m)">
          <input type="number" min={0} step={0.1} value={inputs.width} onChange={(e) => update("width", Number(e.target.value) || 0)} style={inp} disabled={disabled} />
        </Field>
        <Field label="Preferred shape">
          <select value={inputs.shape} onChange={(e) => update("shape", e.target.value as QuoteInputs["shape"])} style={inp} disabled={disabled}>
            <option value="auto">Auto</option>
            <option value="square">Square</option>
            <option value="rectangle">Rectangle</option>
            <option value="triangle">Triangle</option>
          </select>
        </Field>
        <Field label="Kalahari range">
          <select value={inputs.range} onChange={(e) => update("range", e.target.value as QuoteInputs["range"])} style={inp} disabled={disabled}>
            <option value="any">Best value</option>
            <option value="Standard">Standard</option>
            <option value="Extreme">Extreme</option>
          </select>
        </Field>
        <Field label="Fixing method">
          <select value={inputs.poles ? "yes" : "no"} onChange={(e) => update("poles", e.target.value === "yes")} style={inp} disabled={disabled}>
            <option value="yes">Free-standing poles</option>
            <option value="no">Existing walls</option>
          </select>
        </Field>
        <Field label="Fabric colour">
          <select value={inputs.colour} onChange={(e) => update("colour", e.target.value as QuoteInputs["colour"])} style={inp} disabled={disabled}>
            {FABRIC_COLOURS.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <div
        style={{
          marginTop: 16,
          background: result.exceeded ? "rgba(162,60,52,.08)" : "var(--color-mist)",
          border: `1px solid ${result.exceeded ? "rgba(162,60,52,.18)" : "var(--color-line)"}`,
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 13.5, color: "var(--color-navy)", fontWeight: 700, marginBottom: 6 }}>{result.netLabel || "No recommendation yet"}</div>
        <div style={{ fontSize: 12.5, color: "var(--color-steel)", lineHeight: 1.55 }}>{result.message}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 12, fontSize: 12.5, color: "var(--color-steel)" }}>
          {result.lineItems.map((li) => (
            <LineItemPreview key={li.label} item={li} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 10, marginTop: 10, borderTop: "1px solid var(--color-line)" }}>
          <span style={{ fontSize: 12.5, color: "var(--color-steel)" }}>Subtotal {zar(result.subtotal)} · VAT {zar(result.vat)}</span>
          <span style={{ fontSize: 12.5, color: saved ? "var(--color-signal)" : changed ? "var(--color-warn)" : "var(--color-steel)", fontWeight: 700 }}>
            {saved ? "Saved to lead" : changed ? "Unsaved calculator changes" : "Matches saved estimate"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <button className="btn-ghost" onClick={applyEstimate} disabled={disabled}>
          Apply recalculated estimate
        </button>
        <button className="btn-brass" onClick={saveEstimate} disabled={disabled || busy === "save" || !result.ok}>
          {busy === "save" ? "Saving…" : "Save inputs & estimate"}
        </button>
        <span style={{ fontSize: 12.5, color: "var(--color-steel)", alignSelf: "center" }}>
          {disabled ? "This quote is scheduled, so estimate inputs are now locked." : "Firm price still stays separate and only changes when you use Confirm firm price."}
        </span>
      </div>

      <style>{`@media (max-width:860px){ .es-admin-calc-grid{ grid-template-columns:1fr 1fr !important; } } @media (max-width:560px){ .es-admin-calc-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "flex", flexDirection: "column", gap: 5 }}>
      {label}
      {children}
    </label>
  );
}

function LineItemPreview({ item }: { item: QuoteResult["lineItems"][number] }) {
  return (
    <>
      <span>{item.label}</span>
      <span className="tnum" style={{ color: "var(--color-navy)", fontWeight: 700, textAlign: "right" }}>{zar(item.amount)}</span>
    </>
  );
}

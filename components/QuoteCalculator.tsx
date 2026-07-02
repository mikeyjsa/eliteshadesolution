"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { calcQuote, type Rates } from "@/lib/quote-engine";
import { zar } from "@/lib/format";
import { gtagEvent } from "@/lib/gtag";
import type { QuoteInputs, FabricColour } from "@/lib/types";
import { FABRIC_COLOURS } from "@/lib/types";
import { QUOTE_PHOTOS_BY_COLOUR } from "@/components/SitePhotos";

export default function QuoteCalculator({ rates }: { rates: Rates }) {
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(3);
  const [shape, setShape] = useState<QuoteInputs["shape"]>("auto");
  const [range, setRange] = useState<QuoteInputs["range"]>("any");
  const [poles, setPoles] = useState(true);
  const [colour, setColour] = useState<FabricColour>("Charcoal");

  const [sent, setSent] = useState<null | "sending" | "done">(null);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", suburb: "" });
  const [showForm, setShowForm] = useState(false);

  const inputs: QuoteInputs = { length, width, shape, range, poles, colour };
  const result = useMemo(() => calcQuote(inputs, rates), [length, width, shape, range, poles, colour, rates]);

  async function submit() {
    setSent("sending");
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs, contact }),
    });
    if (res.ok) {
      setSent("done");
      gtagEvent("quote_submitted", { colour, range, length, width });
    } else {
      setSent(null);
    }
  }

  const sel = FABRIC_COLOURS.find((f) => f.name === colour)!;
  const photo = QUOTE_PHOTOS_BY_COLOUR[colour];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-lift)", border: "1px solid var(--color-line)" }} className="es-quote-grid">
      {/* ---- FORM ---- */}
      <div style={{ background: "#fff", padding: "30px 30px 34px" }}>
        <span className="eyebrow">Step 1 — your area</span>
        <h3 className="display" style={{ fontSize: 22, color: "var(--color-navy)", margin: "8px 0 20px" }}>Tell us what to shade</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Area length (m)">
            <input type="number" min={1} max={20} step={0.1} value={length} onChange={(e) => setLength(+e.target.value)} style={inp} id="q_L" />
          </Field>
          <Field label="Area width (m)">
            <input type="number" min={1} max={20} step={0.1} value={width} onChange={(e) => setWidth(+e.target.value)} style={inp} id="q_W" />
          </Field>
        </div>

        <div style={{ marginTop: 14 }}>
          <Field label="Preferred shape">
            <select value={shape} onChange={(e) => setShape(e.target.value as QuoteInputs["shape"])} style={inp} id="q_shape">
              <option value="auto">Auto — best fit (recommended)</option>
              <option value="square">Square</option>
              <option value="rectangle">Rectangle</option>
              <option value="triangle">Triangle</option>
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Kalahari range">
            <select value={range} onChange={(e) => setRange(e.target.value as QuoteInputs["range"])} style={inp} id="q_range">
              <option value="any">Best value — cheapest that fits</option>
              <option value="Standard">Standard — permanent, 90% UV</option>
              <option value="Extreme">Extreme — 285 GSM, reinforced for wind</option>
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Do you need support poles installed?">
            <select value={poles ? "yes" : "no"} onChange={(e) => setPoles(e.target.value === "yes")} style={inp} id="q_poles">
              <option value="yes">Yes — free-standing (poles)</option>
              <option value="no">No — fix to existing walls</option>
            </select>
          </Field>
        </div>

        {/* ---- COLOUR PICKER ---- */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-navy)", marginBottom: 10, letterSpacing: ".02em" }}>Fabric colour <span style={{ fontWeight: 500, color: "var(--color-steel)" }}>— no price difference</span></div>
          <div style={{ display: "flex", gap: 10 }}>
            {FABRIC_COLOURS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColour(c.name)}
                title={c.name}
                style={{
                  flex: 1,
                  padding: 0,
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  outline: colour === c.name ? `3px solid var(--color-brass)` : "3px solid transparent",
                  outlineOffset: 2,
                  transition: "outline 0.15s, transform 0.15s",
                  transform: colour === c.name ? "scale(1.08)" : "scale(1)",
                  overflow: "hidden",
                }}
              >
                <div style={{ background: c.hex, height: 38, borderRadius: 8 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: colour === c.name ? "var(--color-navy)" : "var(--color-steel)", padding: "5px 0 6px", letterSpacing: ".04em", textTransform: "uppercase", textAlign: "center" }}>{c.name}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-steel)" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: sel.hex, border: "1px solid rgba(0,0,0,.15)", marginRight: 6, verticalAlign: "middle" }} />
            {colour === "Black" ? "Most architectural — hides dust, strong contrast" :
             colour === "Charcoal" ? "Popular all-rounder — works with any outdoor palette" :
             colour === "Sand" ? "Warm and natural — brightens the space underneath" :
             "Light and airy — reflects light, stays cool below"}
          </div>
        </div>
      </div>

      {/* ---- RESULT ---- */}
      <div style={{ background: "var(--color-navy-deep)", color: "#fff", padding: "30px 28px", display: "flex", flexDirection: "column" }}>

        <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 760px) 100vw, 420px"
            style={{ objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 55%,rgba(18,28,38,.78))" }} />
          <div style={{ position: "absolute", left: 14, bottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: sel.hex, border: "1px solid rgba(255,255,255,.7)" }} />
            Selected finish: {colour}
          </div>
        </div>

        <div
          style={{
            background: result.exceeded ? "rgba(162,60,52,.18)" : "var(--color-brass-soft)",
            color: result.exceeded ? "#ffcac4" : "var(--color-navy-deep)",
            border: `1px solid ${result.exceeded ? "rgba(240,205,202,.4)" : "var(--color-brass)"}`,
            fontSize: 13.5, padding: "11px 14px", borderRadius: 9, marginBottom: 14, lineHeight: 1.55, fontWeight: 600,
          }}
          id="q_match"
        >
          {result.message}
        </div>

        <div style={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-silver)" }}>
          Estimate range (excl VAT)
        </div>
        <div className="display tnum" style={{ fontSize: 28, color: "#fff", margin: "6px 0 2px" }} id="q_range_out">
          {zar(result.low)} – {zar(result.high)}
        </div>
        <div className="tnum" style={{ fontSize: 13, color: "var(--color-brass)", fontWeight: 600 }}>
          Subtotal ≈ {zar(result.subtotal)} · VAT {zar(result.vat)}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.12)", margin: "14px 0", paddingTop: 12, fontSize: 12.5, color: "#c3ccd4", display: "flex", flexDirection: "column", gap: 6 }}>
          {result.lineItems.map((li) => (
            <div key={li.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{li.label}</span>
              <span className="tnum" style={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{zar(li.amount)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,.08)", color: "#aab4bd" }}>
            <span>Fabric colour</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>{colour}</span>
          </div>
        </div>

        {!showForm && sent !== "done" && (
          <button className="btn-brass" style={{ width: "100%" }} onClick={() => { setShowForm(true); gtagEvent("estimate_email_intent", { colour, range, length, width }); }}>
            Email my estimate →
          </button>
        )}

        {showForm && sent !== "done" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
            {(["name", "email", "phone", "suburb"] as const).map((k) => (
              <input
                key={k}
                placeholder={k === "suburb" ? "Suburb" : k[0].toUpperCase() + k.slice(1)}
                value={contact[k]}
                onChange={(e) => setContact({ ...contact, [k]: e.target.value })}
                style={{ ...inp, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", color: "#fff" }}
              />
            ))}
            <button className="btn-brass" disabled={sent === "sending" || !contact.name || !contact.email} style={{ width: "100%", opacity: sent === "sending" || !contact.name || !contact.email ? 0.6 : 1 }} onClick={submit}>
              {sent === "sending" ? "Sending…" : "Send me this estimate →"}
            </button>
          </div>
        )}

        {sent === "done" && (
          <div style={{ background: "rgba(63,143,95,.18)", border: "1px solid rgba(63,143,95,.5)", color: "#a9e0bf", borderRadius: 10, padding: "14px 16px", fontSize: 14 }}>
            <strong>Estimate on its way ✓</strong>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#cdeed9" }}>
              We've saved your details and one of us will call to confirm the exact price after a quick free survey.
            </p>
          </div>
        )}

        <p style={{ fontSize: 11, color: "var(--color-silver)", marginTop: 14, textAlign: "center", lineHeight: 1.5 }}>
          Indicative estimate excl VAT and travel, based on standard access &amp; ground conditions. Final price confirmed after a free on-site survey.
        </p>
      </div>

      <style>{`@media (max-width: 760px){ .es-quote-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

const inp: React.CSSProperties = {
  fontSize: 14,
  padding: "10px 12px",
  border: "1px solid var(--color-line)",
  borderRadius: 9,
  width: "100%",
  background: "#fff",
  color: "var(--color-ink)",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "flex", flexDirection: "column", gap: 5 }}>
      {label}
      {children}
    </label>
  );
}

"use client";
/* Interactive homepage widgets — the "play with it" layer on top of the
   passive animation system in AnimationLayer.tsx. All match the
   "engineered tension" identity: navy/brass, technical, no gimmicks. */
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { calcQuote, type Rates } from "@/lib/quote-engine";
import { zar } from "@/lib/format";
import { FABRIC_COLOURS, type FabricColour } from "@/lib/types";
import { SITE_PHOTOS } from "@/components/SitePhotos";

/* ============================================================
   1. MINI ESTIMATOR — sliders + live sail plan-view + real price
   ============================================================ */
export function MiniEstimator({ rates }: { rates: Rates }) {
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(4);
  const [poles, setPoles] = useState(true);
  const [colour, setColour] = useState<FabricColour>("Charcoal");

  const result = useMemo(
    () => calcQuote({ length, width, shape: "auto", range: "any", poles, colour }, rates),
    [length, width, poles, colour, rates]
  );
  const sel = FABRIC_COLOURS.find((c) => c.name === colour)!;

  // Plan-view geometry — fixed px-per-metre so size changes are visible.
  const PX = 25;
  const w = length * PX;
  const h = width * PX;
  const cx = 160, cy = 118;

  return (
    <div className="card es-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", borderTop: "3px solid var(--color-brass)", boxShadow: "var(--shadow-lift)" }}>
      {/* ---- CONTROLS ---- */}
      <div style={{ padding: "30px 30px 32px" }}>
        <span className="eyebrow">Try it right here</span>
        <h3 className="display" style={{ fontSize: 24, color: "var(--color-navy)", margin: "8px 0 22px" }}>Drag. Watch the price move.</h3>

        {[
          { label: "Area length", val: length, set: setLength },
          { label: "Area width", val: width, set: setWidth },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)" }}>{label}</span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--color-brass)" }}>{val.toFixed(1)} m</span>
            </div>
            <input type="range" min={2} max={8} step={0.5} value={val} onChange={(e) => set(+e.target.value)} className="es-range" aria-label={label} />
          </div>
        ))}

        {/* fixings toggle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)", marginBottom: 8 }}>Fixings</div>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--color-line)" }}>
            {[
              { on: true, t: "Free-standing poles" },
              { on: false, t: "Fix to walls" },
            ].map((o) => (
              <button
                key={o.t}
                onClick={() => setPoles(o.on)}
                style={{
                  flex: 1, padding: "10px 8px", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12.5, letterSpacing: ".02em",
                  background: poles === o.on ? "var(--color-navy)" : "#fff",
                  color: poles === o.on ? "#fff" : "var(--color-steel)",
                  transition: "background .2s, color .2s",
                }}
              >
                {o.t}
              </button>
            ))}
          </div>
        </div>

        {/* colour chips */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)", marginBottom: 8 }}>Fabric colour <span style={{ fontWeight: 500, color: "var(--color-steel)" }}>— same price</span></div>
          <div style={{ display: "flex", gap: 10 }}>
            {FABRIC_COLOURS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColour(c.name)}
                title={c.name}
                aria-label={`Fabric colour ${c.name}`}
                style={{
                  width: 36, height: 36, borderRadius: "50%", cursor: "pointer", background: c.hex,
                  border: "2px solid #fff",
                  outline: colour === c.name ? "3px solid var(--color-brass)" : "1px solid var(--color-line)",
                  transform: colour === c.name ? "scale(1.12)" : "scale(1)",
                  transition: "transform .18s cubic-bezier(.34,1.56,.64,1), outline .15s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- LIVE PREVIEW + PRICE ---- */}
      <div style={{ background: "linear-gradient(160deg, #35485c 0%, #2a3a4a 100%)", padding: "26px 28px", display: "flex", flexDirection: "column" }}>
        <svg viewBox="0 0 320 236" style={{ width: "100%", height: "auto", display: "block", flex: 1 }} aria-hidden="true">
          {/* area to shade */}
          <rect
            x={cx - w / 2 - 11} y={cy - h / 2 - 11} width={w + 22} height={h + 22} rx="8"
            fill="none" stroke="var(--color-brass)" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.55"
            style={{ transition: "all .45s cubic-bezier(.22,1,.36,1)" }}
          />
          {/* sail — normalised 100×100 path, scaled to the live dimensions */}
          <g style={{ transform: `translate(${cx - w / 2}px, ${cy - h / 2}px) scale(${w / 100}, ${h / 100})`, transition: "transform .45s cubic-bezier(.22,1,.36,1)" }}>
            <path d="M6 6 Q50 17 94 6 Q83 50 94 94 Q50 83 6 94 Q17 50 6 6 Z" fill={sel.hex} opacity="0.94" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" style={{ transition: "fill .3s" }} />
          </g>
          {/* corner fixings */}
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
            <circle key={i} r="4.5" fill="var(--color-brass)"
              cx={cx + (sx * w) / 2} cy={cy + (sy * h) / 2}
              style={{ transition: "all .45s cubic-bezier(.22,1,.36,1)" }}
            />
          ))}
          {/* dimension labels */}
          <text x={cx} y={cy - h / 2 - 20} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="11" fill="#aab4bd" style={{ transition: "all .45s cubic-bezier(.22,1,.36,1)" }}>{length.toFixed(1)} m</text>
          <text x={cx - w / 2 - 20} y={cy + 3} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="11" fill="#aab4bd" style={{ transition: "all .45s cubic-bezier(.22,1,.36,1)" }}>{width.toFixed(1)}</text>
        </svg>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-silver)", fontWeight: 700 }}>Estimated range · {result.netLabel.replace("Kalahari ", "")}</div>
          <div key={result.low} className="display es-price-flash tnum" style={{ fontSize: "clamp(24px, 3vw, 32px)", color: "#fff", margin: "6px 0 2px" }}>
            {zar(result.low)} – {zar(result.high)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-silver)" }}>
            Net + {poles ? `${result.poleCount} poles` : `${result.points} wall fixings`} + hardware + labour · excl. VAT
          </div>
          <Link href="/quote" className="btn-brass" style={{ marginTop: 16, fontSize: 14.5, width: "100%" }}>
            Continue to the full quote →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   2. SUN / SHADE COMPARISON — draggable before/after slider
   ============================================================ */
export function CompareSlider() {
  const [pct, setPct] = useState(55);
  const photo = SITE_PHOTOS.garden;

  return (
    <div className="es-compare" style={{ position: "relative", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-lift)", aspectRatio: "16 / 9", minHeight: 320, userSelect: "none" }}>
      {/* base — harsh sun */}
      <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 900px) 100vw, 1040px" style={{ objectFit: "cover", filter: "saturate(1.35) brightness(1.28) contrast(1.06) sepia(.22)" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,190,80,.22), rgba(255,150,40,.12))" }} />

      {/* top — under the sail, clipped to the left portion */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
        <Image src={photo.src} alt="" fill sizes="(max-width: 900px) 100vw, 1040px" style={{ objectFit: "cover" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(28,39,51,.16), rgba(28,39,51,.06))" }} />
      </div>

      {/* labels */}
      <span style={{ position: "absolute", top: 14, left: 14, background: "rgba(28,39,51,.85)", color: "#fff", fontSize: 11.5, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: ".06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 20, pointerEvents: "none" }}>
      Under the sail — 90% UV blocked
      </span>
      <span style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.88)", color: "var(--color-warn)", fontSize: 11.5, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: ".06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 20, pointerEvents: "none" }}>
        Full Cape sun
      </span>

      {/* handle */}
      <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, left: `${pct}%`, width: 3, background: "var(--color-brass)", transform: "translateX(-50%)", boxShadow: "0 0 14px rgba(201,162,75,.6)", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "var(--color-brass)", color: "var(--color-navy-deep)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 17, boxShadow: "0 4px 16px rgba(0,0,0,.35)" }}>⇄</div>
      </div>

      {/* invisible full-surface range input = drag + keyboard accessible */}
      <input
        type="range" min={4} max={96} value={pct}
        onChange={(e) => setPct(+e.target.value)}
        aria-label="Compare full sun with shade sail coverage"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", margin: 0 }}
      />
    </div>
  );
}

/* ============================================================
   3. PROCESS TIMELINE — auto-advancing, clickable 5-step rail
   ============================================================ */
const TIMELINE_STEPS = [
  { n: "01", t: "Instant estimate", d: "Enter your area online — we match a genuine Kalahari net and show a real, itemised price range on the spot. No callback needed." },
  { n: "02", t: "We confirm", d: "A quick call or a free Cape Metro site check confirms ground conditions, access and exact fixing points." },
  { n: "03", t: "Firm quote", d: "You get a locked price on a branded invoice — in most cases inside the range the calculator showed you." },
  { n: "04", t: "Pay deposit", d: "A 50% deposit via PayFast secures the sale and books your installation date. You'll get the date by email." },
  { n: "05", t: "Installed", d: "Poles set and cured, sail tensioned into a taut hypar form that sheds the Southeaster. Balance due on completion." },
];

export function ProcessTimeline() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % TIMELINE_STEPS.length), 4000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* progress rail */}
      <div style={{ position: "relative", height: 3, background: "var(--color-line)", borderRadius: 2, marginBottom: 22 }}>
        <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${(active / (TIMELINE_STEPS.length - 1)) * 100}%`, background: "var(--color-brass)", borderRadius: 2, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
        {TIMELINE_STEPS.map((s, i) => (
          <button
            key={s.n}
            onClick={() => setActive(i)}
            aria-label={`Step ${s.n}: ${s.t}`}
            style={{
              position: "absolute", top: "50%", left: `${(i / (TIMELINE_STEPS.length - 1)) * 100}%`,
              transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", cursor: "pointer",
              border: `3px solid ${i <= active ? "var(--color-brass)" : "var(--color-line)"}`,
              background: i <= active ? "var(--color-brass)" : "#fff",
              transition: "background .3s, border-color .3s, transform .2s",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0 }} className="es-steps">
        {TIMELINE_STEPS.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.n}
              onClick={() => setActive(i)}
              style={{
                textAlign: "left", cursor: "pointer", border: "none", borderTop: `3px solid ${isActive ? "var(--color-brass)" : "var(--color-line)"}`,
                borderRight: i < 4 ? "1px solid var(--color-line)" : "none",
                background: isActive ? "var(--color-brass-soft)" : "#fff",
                padding: "18px 16px 20px", transition: "background .3s, border-color .3s, opacity .3s",
                opacity: isActive ? 1 : 0.62,
              }}
            >
              <div className="eyebrow" style={{ color: "var(--color-brass)" }}>{s.n}</div>
              <h4 className="display" style={{ fontSize: 15, color: "var(--color-navy)", margin: "6px 0 4px" }}>{s.t}</h4>
              <p style={{
                fontSize: 12.5, color: "var(--color-steel)", margin: 0, lineHeight: 1.55,
                maxHeight: isActive ? 120 : 0, overflow: "hidden", transition: "max-height .45s cubic-bezier(.22,1,.36,1)",
              }}>{s.d}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   4. STICKY QUOTE BAR — slides up after the hero, dismissible
   ============================================================ */
export function StickyQuoteBar() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 680);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="es-sticky-bar" style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 90,
      background: "rgba(28,39,51,.96)", backdropFilter: "blur(8px)",
      borderTop: "1px solid rgba(201,162,75,.35)",
      padding: "12px 20px calc(12px + env(safe-area-inset-bottom))",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 18, flexWrap: "wrap",
    }}>
      <div style={{ color: "#fff", fontSize: 14, display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="display" style={{ fontSize: 17, color: "var(--color-brass)" }}>From {zar(899)}</span>
        <span style={{ color: "var(--color-silver)", fontSize: 12.5 }}>· real estimate in 2 minutes</span>
      </div>
      <Link href="/quote" className="btn-brass" style={{ fontSize: 14, padding: "0.65rem 1.3rem" }}>Get my instant estimate →</Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--color-silver)", fontSize: 20, cursor: "pointer", padding: 6, lineHeight: 1 }}
      >×</button>
    </div>
  );
}

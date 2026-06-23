import Link from "next/link";
import { CoverageDiagram, UVDial } from "@/components/Illustrations";
import { FAQ } from "@/components/Interactive";
import { PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";

export const metadata = {
  title: "How it works",
  description: "See how Elite Shade moves from instant estimate to firm quote, deposit, and engineered installation with the right fixings at every corner.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  ["Instant online estimate", "Enter the area you want shaded and your fixings. Our calculator auto-matches the best genuine Kalahari net and returns a real price range in seconds — no callback, no waiting."],
  ["We confirm with you", "One of the two owners calls to confirm the details and book a free Cape Metro site survey. Real fixings, ground conditions and access vary — this is how we lock an exact price."],
  ["Firm quote", "You receive a numbered, VAT-ready branded quote with the final price. No surprises, no mystery line items."],
  ["50% deposit secures it", "Pay your deposit securely via PayFast (card, EFT, Instant EFT or SnapScan). That triggers ordering and books your installation date."],
  ["Engineered installation", "We install with galvanised posts, stainless fittings and correct tensioning — built for the Southeaster. The 50% balance is due on completion."],
];

const NET_FAQ = [
  { q: "Standard or Extreme — how do I choose?", a: "Choose Standard for typical patios, pools and play areas in normal conditions — it still blocks up to 90% of UV. Choose Extreme where sun and wind are relentless (exposed coastal plots, west-facing yards, big spans): its 285 GSM fabric, wider webbing and reinforced stitching take more punishment. Extreme always costs a bit more for the same size." },
  { q: "How much area does one net actually cover?", a: "Kalahari nets stretch about 1m when correctly tensioned, so a net comfortably covers an area up to ~0.8m larger per side than its nominal size before you need to size up. Our calculator factors this in automatically and picks the smallest net that still covers you." },
  { q: "What are the maximum sizes?", a: "5.4 × 5.4m for a square, 5 × 3m for a rectangle, and 5 × 5 × 5m for a triangle. Beyond those we either combine two sails or build a custom shade-port — confirmed on the free site survey." },
  { q: "What colours are available?", a: "Black, Charcoal, Sand and Silver, at no price difference. Darker colours read more architectural and hide dust; lighter colours stay cooler underneath and brighten a space." },
];

export default function HowItWorks() {
  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.howItWorks}
        eyebrow="The process & the product"
        title="How Elite shade works"
        description="Instant online estimate, human confirmation, firm quote, deposit and an engineered installation with the right tension at every corner."
        objectPosition="center"
      />

      {/* PROCESS */}
      <section style={{ background: "#fff", padding: "64px 28px 30px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <span className="eyebrow">Step by step</span>
          <h2 className="display" style={{ fontSize: 28, color: "var(--color-navy)", margin: "8px 0 30px" }}>From estimate to shade</h2>
          {STEPS.map(([t, d], i) => (
            <div key={t} style={{ display: "flex", gap: 22, paddingBottom: i < STEPS.length - 1 ? 36 : 0 }} className="reveal">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="display" style={{ width: 48, height: 48, borderRadius: 12, background: "var(--color-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{i + 1}</div>
                {i < STEPS.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--color-line)", marginTop: 6 }} />}
              </div>
              <div style={{ paddingBottom: 8 }}>
                <h3 className="display" style={{ fontSize: 20, color: "var(--color-navy)", margin: "8px 0 6px" }}>{t}</h3>
                <p style={{ color: "var(--color-steel)", fontSize: 15.5, margin: 0 }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NET TYPES — TECHNICAL */}
      <section style={{ background: "var(--color-mist)", padding: "64px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
            <span className="eyebrow">The fabric, technically</span>
            <h2 className="display" style={{ fontSize: 30, color: "var(--color-navy)", margin: "10px 0" }}>Two ranges, one job: permanent shade</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 16 }}>Both ranges are knitted UV-stabilised HDPE designed for permanent installation. The difference is how much weather they're built to take.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="es-2col">
            {[
              { name: "Standard", tag: "Permanent · 90% UV", photo: SITE_PHOTOS.standard, blurb: "The everyday workhorse. Knitted HDPE that blocks up to 90% of UV, breathes in wind and resists fading, mould and mildew. Perfect for patios, pools and play areas in normal Cape conditions.", points: ["Up to 90% UV block", "Breathable — sheds heat", "Fade / mould / mildew resistant", "Permanent install"], accent: false },
              { name: "Extreme", tag: "285 GSM · Reinforced", photo: SITE_PHOTOS.extreme, blurb: "The heavy-duty option. 285 GSM fabric with wider webbing and reinforced stitching for harsher exposure — strong wind and intense, relentless sun. Specify it for exposed and coastal plots, or larger spans.", points: ["Heavier 285 GSM fabric", "Wider reinforced webbing", "Reinforced corner stitching", "Best for wind & extreme sun"], accent: true },
            ].map((r) => (
              <div key={r.name} className="card reveal" style={{ padding: 0, overflow: "hidden", borderTop: `4px solid ${r.accent ? "var(--color-brass)" : "var(--color-navy)"}` }}>
                <div style={{ padding: "22px 24px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="display" style={{ fontSize: 24, color: "var(--color-navy)", margin: 0 }}>{r.name}</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: r.accent ? "var(--color-warn)" : "var(--color-steel)", background: r.accent ? "var(--color-brass-soft)" : "var(--color-mist)", padding: "4px 10px", borderRadius: 20 }}>{r.tag}</span>
                  </div>
                  <p style={{ color: "var(--color-steel)", fontSize: 14.5 }}>{r.blurb}</p>
                </div>
                <PhotoFrame photo={r.photo} sizes="(max-width: 760px) 100vw, 50vw" style={{ aspectRatio: "4 / 3", marginTop: 16 }} />
                <ul style={{ listStyle: "none", padding: "16px 24px 24px", margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {r.points.map((p) => (
                    <li key={p} style={{ fontSize: 13, color: "var(--color-navy)", display: "flex", gap: 7 }}><span style={{ color: "var(--color-brass)" }}>▸</span>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE + UV */}
      <section style={{ background: "#fff", padding: "64px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="es-2col">
          <div className="reveal">
            <span className="eyebrow">Sizing &amp; coverage</span>
            <h2 className="display" style={{ fontSize: 26, color: "var(--color-navy)", margin: "10px 0 12px" }}>How far a net really reaches</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 15.5, marginBottom: 18 }}>
              A net's printed size isn't its limit. Tensioned correctly, Kalahari
              fabric stretches roughly a metre — about 0.8m of extra reach per side —
              so the smallest net that fits is often a size down from what you'd guess.
              That's exactly what the calculator works out for you.
            </p>
            <div className="card" style={{ padding: 22 }}><CoverageDiagram /></div>
          </div>
          <div className="reveal">
            <span className="eyebrow">Sun protection</span>
            <h2 className="display" style={{ fontSize: 26, color: "var(--color-navy)", margin: "10px 0 12px" }}>Up to 90% of UV, blocked</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 15.5, marginBottom: 18 }}>
              Both ranges block up to 90% of UV — meaningful protection for skin,
              furniture and decking under fierce Cape summers. Because the fabric is
              knitted and breathable, it cools the space beneath without trapping a
              pocket of hot air or catching wind like a solid canopy.
            </p>
            <div className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, alignItems: "center" }}>
              <UVDial pct={90} />
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--color-navy)" }}>
                <li>▸ Skin &amp; eye protection</li>
                <li>▸ Less fading of furniture &amp; decking</li>
                <li>▸ Cooler, breathable shade</li>
                <li>▸ Rated for permanent install</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FIXINGS / ANATOMY */}
      <section style={{ background: "var(--color-navy-deep)", color: "#fff", padding: "64px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }} className="es-2col">
          <div className="reveal">
            <PhotoFrame
              photo={SITE_PHOTOS.tensionHardware}
              sizes="(max-width: 820px) 100vw, 50vw"
              style={{ aspectRatio: "4 / 4.4", borderRadius: 16, boxShadow: "0 24px 48px rgba(0,0,0,.24)" }}
              overlay="linear-gradient(180deg, rgba(14,22,31,0.06) 0%, rgba(14,22,31,0.34) 100%)"
            />
          </div>
          <div className="reveal">
            <span className="eyebrow">The fixings</span>
            <h2 className="display" style={{ fontSize: 28, color: "#fff", margin: "10px 0 12px" }}>Every corner is a kit</h2>
            <p style={{ color: "#cdd6de", fontSize: 15.5, marginBottom: 16 }}>
              Triangles have three tension points, squares and rectangles four. Each
              point gets a turnbuckle and a length of tensioning chain to pull the
              sail taut — then either a drilled pad eye on a wall, or an eye-bolt on a
              galvanised pole set in concrete.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Turnbuckle", "Tensions each point"],
                ["Chain", "Fine-tunes the pull"],
                ["Pad eye", "Drilled wall anchor"],
                ["Eye-bolt", "On a galvanised pole"],
              ].map(([t, d]) => (
                <div key={t} style={{ background: "rgba(255,255,255,.06)", borderRadius: 10, padding: "12px 14px" }}>
                  <div className="display" style={{ fontSize: 14.5, color: "var(--color-brass)" }}>{t}</div>
                  <div style={{ fontSize: 12.5, color: "#aab4bd" }}>{d}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "#9fb0bd", fontSize: 13, marginTop: 16 }}>Spans over 6m add intermediate poles for support. All metalwork is galvanised or stainless to survive coastal air.</p>
          </div>
        </div>
      </section>

      {/* NET FAQ */}
      <section style={{ background: "#fff", padding: "64px 28px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="eyebrow">Net questions</span>
            <h2 className="display" style={{ fontSize: 28, color: "var(--color-navy)", margin: "8px 0 0" }}>Choosing the right sail</h2>
          </div>
          <FAQ items={NET_FAQ} />
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/quote" className="btn-brass" style={{ fontSize: 16 }}>Price your sail now →</Link>
          </div>
        </div>
      </section>
      <style>{`@media (max-width:820px){ .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

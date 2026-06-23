import Link from "next/link";
import { PRODUCTS } from "@/lib/quote-engine";
import { zar } from "@/lib/format";
import { UVDial } from "@/components/Illustrations";
import { PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";

export const metadata = {
  title: "Shade sails",
  description: "Explore the Standard and Extreme Kalahari shade sail ranges, fixed sizes, colours, and how Elite picks the right net for your space.",
  alternates: { canonical: "/shade-sails" },
};

const COLOURS = [
  { name: "Black", hex: "#1c2733" },
  { name: "Charcoal", hex: "#454f57" },
  { name: "Sand", hex: "#cdbfa3" },
  { name: "Silver", hex: "#aab4bd" },
];

export default function ShadeSails() {
  const standard = PRODUCTS.filter((p) => p.range === "Standard");
  const extreme = PRODUCTS.filter((p) => p.range === "Extreme");

  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.extreme}
        eyebrow="The range"
        title="Genuine Kalahari shade sails"
        description="Permanent, breathable shade in genuine ready-made sizes, professionally tensioned for a clean architectural finish."
        objectPosition="center 48%"
      />

      <section style={{ background: "#fff", padding: "60px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="es-2col">
          <RangeCard
            title="Standard"
            tag="Permanent · 90% UV"
            blurb="Permanent-install knitted-HDPE nets that block up to 90% of UV. Ideal for patios, play areas and pools in normal conditions."
            products={standard}
          />
          <RangeCard
            title="Extreme"
            tag="285 GSM · Reinforced"
            blurb="Heavier 285 GSM fabric, wider webbing and reinforced stitching — built for harsher conditions: strong wind and intense sun."
            products={extreme}
            accent
          />
        </div>
        <div style={{ maxWidth: 1100, margin: "30px auto 0", background: "var(--color-brass-soft)", borderLeft: "4px solid var(--color-brass)", padding: "14px 18px", borderRadius: "0 8px 8px 0", fontSize: 13.5, color: "#6b5524" }}>
          Nets stretch ~1m on tensioning, so a net covers an area up to ~0.8m larger per side before a bigger size is needed.
          The calculator uses this to pick the cheapest net that fits. Colours carry no price difference.
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/quote" className="btn-brass" style={{ fontSize: 16 }}>Price your sail now →</Link>
        </div>
      </section>

      <section style={{ background: "var(--color-navy-deep)", padding: "56px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span className="eyebrow" style={{ color: "var(--color-brass)" }}>Seen in context</span>
            <h2 className="display" style={{ fontSize: 26, color: "#fff", margin: "8px 0 0" }}>Standard for patios · Extreme for bigger exposed spans</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="es-2col">
            <div>
              <PhotoFrame photo={SITE_PHOTOS.standard} sizes="(max-width: 760px) 100vw, 50vw" style={{ aspectRatio: "4 / 3", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }} />
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <span className="display" style={{ fontSize: 16, color: "var(--color-brass)" }}>Standard</span>
                <span style={{ color: "var(--color-silver)", fontSize: 13.5 }}> — breathable comfort for patios and seating zones</span>
              </div>
            </div>
            <div>
              <PhotoFrame photo={SITE_PHOTOS.extreme} sizes="(max-width: 760px) 100vw, 50vw" style={{ aspectRatio: "4 / 3", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }} />
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <span className="display" style={{ fontSize: 16, color: "var(--color-brass)" }}>Extreme</span>
                <span style={{ color: "var(--color-silver)", fontSize: 13.5 }}> — heavier-duty coverage for more demanding sites</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--color-mist)", padding: "60px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 40, alignItems: "center" }} className="es-2col">
          <div>
            <span className="eyebrow">Four colours · no price difference</span>
            <h2 className="display" style={{ fontSize: 28, color: "var(--color-navy)", margin: "10px 0 16px" }}>Pick a tone for your space</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="es-4col">
              {COLOURS.map((c) => (
                <div key={c.name} style={{ textAlign: "center" }}>
                  <div style={{ aspectRatio: "1", borderRadius: 12, background: c.hex, border: "1px solid var(--color-line)", boxShadow: "var(--shadow-card)" }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)", marginTop: 8 }}>{c.name}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--color-steel)", fontSize: 14.5, marginTop: 18 }}>
              Darker tones read more architectural and hide dust; lighter tones stay cooler underneath and brighten a patio. All four are the same price — choose on looks alone.
            </p>
          </div>
          <div className="card" style={{ padding: 28, display: "grid", placeItems: "center", textAlign: "center" }}>
            <UVDial pct={90} />
            <p style={{ color: "var(--color-steel)", fontSize: 13.5, margin: "10px 0 0" }}>Every net — Standard and Extreme — blocks up to 90% of UV.</p>
          </div>
        </div>
      </section>
      <style>{`@media (max-width:760px){ .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

function RangeCard({ title, tag, blurb, products, accent }: { title: string; tag: string; blurb: string; products: typeof PRODUCTS; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderTop: `4px solid ${accent ? "var(--color-brass)" : "var(--color-navy)"}` }}>
      <div style={{ padding: "24px 26px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="display" style={{ fontSize: 26, color: "var(--color-navy)", margin: 0 }}>{title}</h2>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: accent ? "var(--color-warn)" : "var(--color-steel)", background: accent ? "var(--color-brass-soft)" : "var(--color-mist)", padding: "4px 10px", borderRadius: 20 }}>{tag}</span>
        </div>
        <p style={{ color: "var(--color-steel)", fontSize: 14.5 }}>{blurb}</p>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: "var(--color-navy)", color: "#fff" }}>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600 }}>Shape</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600 }}>Size</th>
            <th style={{ textAlign: "right", padding: "10px 14px", fontWeight: 600 }}>From</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.label} style={{ borderBottom: "1px solid var(--color-line)" }}>
              <td style={{ padding: "9px 14px", textTransform: "capitalize" }}>{p.shape}</td>
              <td style={{ padding: "9px 14px", color: "var(--color-steel)" }}>{p.label.replace(/^(Standard|Extreme) [^0-9]*/, "")}</td>
              <td className="tnum" style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: "var(--color-navy)" }}>{zar(p.p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

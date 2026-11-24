import QuoteCalculator from "@/components/QuoteCalculator";
import { getDB } from "@/lib/db";
import { ratesFromPricing } from "@/lib/quote-engine";
import { PageHero, SITE_PHOTOS } from "@/components/SitePhotos";

export const metadata = {
  title: "Get your instant estimate",
  description: "Use the Elite Shade calculator to get a real Cape Town shade sail estimate based on size, range, poles, and fabric colour.",
  alternates: { canonical: "/quote" },
};

export default async function QuotePage() {
  const db = await getDB();
  const rates = ratesFromPricing(db.pricing);

  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.standard}
        eyebrow="The conversion engine"
        title="Get your instant estimate"
        description="Choose your sail and fixings — we auto-match the best genuine Kalahari net and price it live, including poles, hardware and labour."
        objectPosition="center 48%"
      />

      <section style={{ background: "var(--color-mist)", padding: "42px 28px 70px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }} className="es-3col">
            {[
              ["No obligation", "See the range before sharing your details"],
              ["Itemised live pricing", "Net, fixings, poles and labour included"],
              ["Free local confirmation", "Cape Metro site survey before firm pricing"],
            ].map(([title, text]) => (
              <div key={title} className="card" style={{ padding: "14px 16px" }}>
                <strong style={{ display: "block", fontSize: 13.5, color: "var(--color-navy)" }}>{title}</strong>
                <span style={{ fontSize: 12, color: "var(--color-steel)" }}>{text}</span>
              </div>
            ))}
          </div>
          <QuoteCalculator rates={rates} />
          <details style={{ marginTop: 18, color: "var(--color-steel)", fontSize: 12.5 }}>
            <summary style={{ cursor: "pointer", color: "var(--color-navy)", fontWeight: 700 }}>How the estimate is calculated</summary>
            <p style={{ maxWidth: 1040, lineHeight: 1.7, marginBottom: 0 }}>
              The tool offers only genuine Kalahari nets in their real sizes. It picks the cheapest net that covers your
              area (allowing ~0.8m of fabric stretch per side), then adds poles, a tension kit for every corner and labour.
              It shows a ±12% range with VAT listed separately. Areas beyond the maximum ready-made net are flagged for
              a possible second sail or custom shade-port.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}

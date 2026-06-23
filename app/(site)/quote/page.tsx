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
          <QuoteCalculator rates={rates} />
          <p style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 18, maxWidth: 1040, lineHeight: 1.7 }}>
            The tool offers only genuine Kalahari nets in their real sizes. It picks the cheapest net that covers your
            area (allowing ~0.8m of fabric stretch per side), then adds poles (per-pole installed rate, pole points only),
            a per-point tension kit (turnbuckle + chain + eye-bolt on a pole, or a pad eye on a wall), plus labour — and
            shows a ±12% range with VAT @ 15% listed separately. Areas beyond our maximum net are quoted at the largest
            size and flagged for a possible second sail or custom shade-port.
          </p>
        </div>
      </section>
    </>
  );
}

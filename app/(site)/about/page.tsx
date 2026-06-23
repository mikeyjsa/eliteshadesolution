import Link from "next/link";
import { PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";

export const metadata = {
  title: "About",
  description: "Learn about Elite Shade Solutions, our owner-led installation approach, and why our engineered Cape Town shade sails are built for coastal conditions.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.courtyard}
        eyebrow="Owner-run · Cape Town"
        title="The architect of outdoor comfort"
        description="A two-person, owner-run team turning engineering tension into dependable, understated shade for Western Cape homes."
        objectPosition="center 58%"
      />

      <section style={{ background: "#fff", padding: "60px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }} className="es-2col">
          <div className="card" style={{ padding: 28 }}>
            <h3 className="display" style={{ fontSize: 20, color: "var(--color-navy)" }}>Precision and craft</h3>
            <p style={{ color: "var(--color-steel)", fontSize: 15 }}>
              We don't patch. Every sail is properly anchored, correctly tensioned
              and built to survive the Cape Southeaster — galvanised posts,
              stainless fittings, genuine Kalahari fabric.
            </p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <h3 className="display" style={{ fontSize: 20, color: "var(--color-navy)" }}>Local and personal</h3>
            <p style={{ color: "var(--color-steel)", fontSize: 15 }}>
              Two owners handle every job from estimate to install — reachable,
              hands-on, and accountable. The same people who quote you are the
              people who show up.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "40px auto 0" }}>
          <h3 className="display" style={{ fontSize: 22, color: "var(--color-navy)", marginBottom: 10 }}>Areas we serve</h3>
          <p style={{ color: "var(--color-steel)", fontSize: 15.5 }}>
            Southern Suburbs · Northern Suburbs · Helderberg · Atlantic Seaboard ·
            Cape Winelands. Free site surveys across the Cape Metro.
          </p>
          <div style={{ marginTop: 30 }}>
            <Link href="/quote" className="btn-brass">Get my estimate →</Link>
          </div>
        </div>
      </section>

      {/* Install photo strip */}
      <section style={{ background: "var(--color-mist)", padding: "48px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span className="eyebrow">What we install</span>
          <h2 className="display" style={{ fontSize: 24, color: "var(--color-navy)", margin: "8px 0 20px" }}>From garden play areas to estate carports</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="es-2col">
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-line)" }}>
              <PhotoFrame photo={SITE_PHOTOS.garden} sizes="(max-width: 640px) 100vw, 50vw" style={{ aspectRatio: "4 / 3" }} />
              <div style={{ padding: "12px 16px", background: "#fff" }}>
                <strong style={{ fontSize: 14, color: "var(--color-navy)" }}>Play areas &amp; gardens</strong>
                <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "4px 0 0" }}>Triangle sails, 3 poles, 90% UV protection where it counts.</p>
              </div>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-line)" }}>
              <PhotoFrame photo={SITE_PHOTOS.heroHouse} sizes="(max-width: 640px) 100vw, 50vw" style={{ aspectRatio: "4 / 3" }} />
              <div style={{ padding: "12px 16px", background: "#fff" }}>
                <strong style={{ fontSize: 14, color: "var(--color-navy)" }}>Patios &amp; outdoor rooms</strong>
                <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "4px 0 0" }}>Larger-span sails that make a high-use entertainment area feel finished.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style>{`@media (max-width:640px){ .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { GALLERY_CARD_FALLBACKS, PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";
import { getDB } from "@/lib/db";

export const metadata = {
  title: "Gallery",
  description: "Browse completed shade sail installs across Cape Town patios, pools, gardens, courtyards, and carports.",
  alternates: { canonical: "/gallery" },
};

const FEATURED = [
  { photo: SITE_PHOTOS.heroHouse, tag: "Patio", title: "Poolside cover — Constantia", detail: "Large-format tensioned sail over a residential entertainment patio." },
  { photo: SITE_PHOTOS.terracePatio, tag: "Patio", title: "Entertainment deck — Sea Point", detail: "Clean wall-fixed sail with neat tension lines and shaded seating." },
  { photo: SITE_PHOTOS.garden, tag: "Garden", title: "Play area — Durbanville", detail: "Freestanding sail structure with galvanised poles and good garden coverage." },
  { photo: SITE_PHOTOS.courtyard, tag: "Courtyard", title: "Alfresco dining — Stellenbosch", detail: "Wide-span shade over an open courtyard for all-day outdoor use." },
  { photo: SITE_PHOTOS.galleryPool, tag: "Pool", title: "Family outdoor room — Bishopscourt", detail: "Architectural shade that turns a patio edge into a usable summer room." },
  { photo: SITE_PHOTOS.standard, tag: "Garden", title: "Relaxed terrace shade — Helderberg", detail: "Light-toned sail keeping the seating area cooler without closing it in." },
];

export default async function Gallery() {
  const db = await getDB();
  const cmsItems = db.content.filter((c) => c.type === "gallery" && c.published);
  const hasCms = cmsItems.length > 0;

  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.galleryPool}
        eyebrow="Cape Town installs"
        title="Engineered shade in the wild"
        description="Explore completed shade-sail spaces for patios, gardens, pools and courtyards across the Western Cape."
        objectPosition="center 54%"
      />

      <section style={{ background: "#fff", padding: "56px 28px 72px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 20 }} className="es-gal">
            {FEATURED.map((g, i) => (
              <div key={`${g.title}-${i}`} className="reveal es-tile" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-line)", transitionDelay: `${(i % 3) * 70}ms` }}>
                <div style={{ position: "relative" }}>
                  <PhotoFrame photo={g.photo} sizes="(max-width: 520px) 100vw, (max-width: 820px) 50vw, 33vw" style={{ aspectRatio: "4 / 3" }} />
                  <span style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(255,255,255,.92)", color: "var(--color-navy)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".05em" }}>{g.tag}</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <strong style={{ fontSize: 14.5, color: "var(--color-navy)" }}>{g.title}</strong>
                  <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "5px 0 0" }}>{g.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {hasCms && (
            <>
              <h3 className="display" style={{ fontSize: 20, color: "var(--color-navy)", margin: "36px 0 16px" }}>Recent uploads</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="es-gal">
                {cmsItems.map((g, i) => (
                  <div key={g.id} className="card reveal" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ position: "relative" }}>
                      {g.image ? (
                        <div style={{ position: "relative", aspectRatio: "4 / 3" }}>
                          <Image src={g.image} alt={g.title} fill sizes="(max-width: 520px) 100vw, (max-width: 820px) 50vw, 33vw" style={{ objectFit: "cover" }} />
                        </div>
                      ) : (
                        <PhotoFrame photo={GALLERY_CARD_FALLBACKS[i % GALLERY_CARD_FALLBACKS.length]} sizes="(max-width: 520px) 100vw, (max-width: 820px) 50vw, 33vw" style={{ aspectRatio: "4 / 3" }} />
                      )}
                      <span style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(255,255,255,.92)", color: "var(--color-navy)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".05em" }}>{g.meta.tag}</span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <strong style={{ fontSize: 14.5, color: "var(--color-navy)" }}>{g.title}</strong>
                      <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "5px 0 0" }}>{g.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ textAlign: "center", marginTop: 52 }}>
            <Link href="/quote" className="btn-brass" style={{ fontSize: 16 }}>Get yours priced →</Link>
          </div>
        </div>
      </section>
      <style>{`
        @media (max-width:820px){ .es-gal{ grid-template-columns:1fr 1fr !important; } }
        @media (max-width:520px){ .es-gal{ grid-template-columns:1fr !important; } }
        .es-tile{ transition: transform .25s ease, box-shadow .25s ease; }
        .es-tile:hover{ transform: translateY(-4px); box-shadow: var(--shadow-lift); }
      `}</style>
    </>
  );
}

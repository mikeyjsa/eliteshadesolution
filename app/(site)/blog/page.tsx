import Link from "next/link";
import Image from "next/image";
import { PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";
import { getDB } from "@/lib/db";
import { dateZA } from "@/lib/format";

export const metadata = {
  title: "Guides",
  description: "Read practical guides on shade sail sizing, fixings, fabric ranges, wind exposure, and caring for permanent Kalahari installs.",
  alternates: { canonical: "/blog" },
};

function readTime(body: string) {
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
}

const CATEGORIES = ["Sizing", "Installation", "Materials", "Maintenance", "Wind & Weather"];
function categoryFor(title: string) {
  if (/size|cover|area/i.test(title)) return "Sizing";
  if (/pole|wall|fix|anchor/i.test(title)) return "Installation";
  if (/standard|extreme|fabric|gsm/i.test(title)) return "Materials";
  if (/care|clean|maint/i.test(title)) return "Maintenance";
  return "Wind & Weather";
}

const GUIDE_PHOTOS = [SITE_PHOTOS.standard, SITE_PHOTOS.extreme, SITE_PHOTOS.terracePatio, SITE_PHOTOS.howItWorks, SITE_PHOTOS.garden];

export default async function Blog() {
  const db = await getDB();
  const posts = db.content.filter((c) => c.type === "post" && c.published);
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.garden}
        eyebrow="Buyer guides"
        title="Know before you buy"
        description="Everything you need about sizing, fixings, fabric grades and keeping your sail performing through Cape winters and southeasters."
        objectPosition="center 48%"
      />

      <section style={{ background: "#fff", padding: "56px 28px 80px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* ── FEATURED GUIDE ── */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="es-tile reveal" style={{ display: "block", textDecoration: "none", borderRadius: 18, overflow: "hidden", border: "1px solid var(--color-line)", marginBottom: 36, boxShadow: "var(--shadow-lift)" }}>
              <div style={{ position: "relative", height: "clamp(220px, 36vw, 380px)" }}>
                {featured.image
                  ? <Image src={featured.image} alt={featured.title} fill sizes="900px" style={{ objectFit: "cover" }} />
                  : <PhotoFrame photo={GUIDE_PHOTOS[0]} sizes="900px" style={{ position: "absolute", inset: 0 }} />
                }
                <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(18,28,38,.88) 100%)" }} />
                <div style={{ position: "absolute", top: 18, left: 20, display: "flex", gap: 8 }}>
                  <span style={badge}>Featured</span>
                  <span style={{ ...badge, background: "var(--color-navy-deep)" }}>{categoryFor(featured.title)}</span>
                  <span style={{ ...badge, background: "rgba(28,39,51,.7)" }}>{readTime(featured.body)} min read</span>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 28px" }}>
                  <span style={{ fontSize: 12, color: "var(--color-silver)" }}>{dateZA(featured.created_at)}</span>
                  <h2 className="display" style={{ fontSize: "clamp(22px, 3vw, 32px)", color: "#fff", margin: "6px 0 8px" }}>{featured.title}</h2>
                  <p style={{ color: "#cdd6de", fontSize: 15, margin: "0 0 14px", maxWidth: 620 }}>{featured.meta.excerpt}</p>
                  <span style={{ color: "var(--color-brass)", fontWeight: 800, fontFamily: "var(--font-display)", fontSize: 14 }}>Read guide →</span>
                </div>
              </div>
            </Link>
          )}

          {/* ── GUIDE GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="es-blog-grid">
            {rest.map((p, i) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card es-tile reveal" style={{ textDecoration: "none", display: "flex", flexDirection: "column", overflow: "hidden", transitionDelay: `${(i % 2) * 60}ms` }}>
                <div style={{ position: "relative", aspectRatio: "16/8" }}>
                  {p.image
                    ? <Image src={p.image} alt={p.title} fill sizes="(max-width: 760px) 100vw, 450px" style={{ objectFit: "cover" }} />
                    : <PhotoFrame photo={GUIDE_PHOTOS[(i + 1) % GUIDE_PHOTOS.length]} sizes="(max-width: 760px) 100vw, 450px" style={{ position: "absolute", inset: 0 }} />
                  }
                  <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 50%,rgba(28,39,51,.6))" }} />
                  <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                    <span style={{ ...badge, fontSize: 10, padding: "2px 8px" }}>{categoryFor(p.title)}</span>
                    <span style={{ ...badge, fontSize: 10, padding: "2px 8px", background: "rgba(28,39,51,.7)" }}>{readTime(p.body)} min</span>
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 0 12px 14px" }}>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,.75)" }}>{dateZA(p.created_at)}</span>
                  </div>
                </div>
                <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 className="display" style={{ fontSize: 17.5, color: "var(--color-navy)", margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h3>
                  <p style={{ color: "var(--color-steel)", fontSize: 13.5, margin: 0, flex: 1, lineHeight: 1.6 }}>{p.meta.excerpt}</p>
                  <span style={{ color: "var(--color-brass)", fontWeight: 700, fontSize: 13, display: "inline-block", marginTop: 14 }}>Read guide →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* empty state */}
          {posts.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--color-steel)", padding: "32px 0" }}>Guides coming soon.</p>
          )}

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/quote" className="btn-brass" style={{ fontSize: 16 }}>Get your instant estimate →</Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px){ .es-blog-grid{ grid-template-columns: 1fr !important; } }
        .es-tile{ transition: transform .25s ease, box-shadow .25s ease; }
        .es-tile:hover{ transform: translateY(-4px); box-shadow: var(--shadow-lift); }
      `}</style>
    </>
  );
}

const badge: React.CSSProperties = {
  background: "rgba(201,162,75,.85)",
  color: "#1c2733",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".04em",
  textTransform: "uppercase",
  padding: "3px 10px",
  borderRadius: 20,
  backdropFilter: "blur(4px)",
};

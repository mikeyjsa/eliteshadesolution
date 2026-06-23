import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { dateZA } from "@/lib/format";
import { PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";
import { absUrl, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

function readTime(body: string) {
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
}

const FALLBACK_PHOTOS = [SITE_PHOTOS.standard, SITE_PHOTOS.extreme, SITE_PHOTOS.terracePatio, SITE_PHOTOS.howItWorks, SITE_PHOTOS.garden];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDB();
  const post = db.content.find((c) => c.type === "post" && c.slug === slug && c.published);
  if (!post) {
    return { title: "Guide not found" };
  }
  const image = post.image || "/opengraph-image";
  const desc = post.meta.excerpt || post.body.split("\n\n")[0]?.slice(0, 160) || `Read this guide from ${SITE_NAME}.`;
  return {
    title: post.title,
    description: desc,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: desc,
      url: absUrl(`/blog/${post.slug}`),
      publishedTime: post.created_at,
      images: [{ url: absUrl(image), alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: desc,
      images: [absUrl(image)],
    },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDB();
  const post = db.content.find((c) => c.type === "post" && c.slug === slug && c.published);
  if (!post) notFound();

  const paragraphs = post.body.split("\n\n").filter(Boolean);
  const related = db.content.filter((c) => c.type === "post" && c.published && c.id !== post.id).slice(0, 2);
  const rt = readTime(post.body);
  const fallbackIdx = db.content.filter((c) => c.type === "post").findIndex((c) => c.id === post.id) % FALLBACK_PHOTOS.length;

  // "In this guide" — first 5 words of each paragraph as anchor text
  const tocItems = paragraphs.slice(0, 6).map((p, i) => ({
    id: `para-${i}`,
    label: p.split(/\s+/).slice(0, 5).join(" ") + "…",
  }));

  return (
    <article>
      {/* ── HERO ── (always uses the overlay-div pattern; PageHero only accepts typed SITE_PHOTOS) */}
      {(
        <div style={{ position: "relative", overflow: "hidden" }}>
          {post.image
            ? <div style={{ position: "absolute", inset: 0 }}><Image src={post.image} alt={post.title} fill sizes="100vw" style={{ objectFit: "cover" }} /></div>
            : <PhotoFrame photo={FALLBACK_PHOTOS[fallbackIdx]} sizes="100vw" style={{ position: "absolute", inset: 0 }} />
          }
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(18,28,38,.95) 0%,rgba(28,39,51,.75) 50%,rgba(28,39,51,.25) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 1240, margin: "0 auto", padding: "80px 28px 72px" }}>
            <div style={{ maxWidth: 680 }}>
              <Link href="/blog" style={{ color: "var(--color-silver)", fontSize: 13, textDecoration: "none" }}>← All guides</Link>
              <div style={{ display: "flex", gap: 10, margin: "14px 0 10px", flexWrap: "wrap" }}>
                <span style={{ background: "rgba(201,162,75,.85)", color: "#1c2733", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{rt} min read</span>
                <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{dateZA(post.created_at)}</span>
              </div>
              <h1 className="display" style={{ fontSize: "clamp(28px,4.5vw,46px)", color: "#fff", margin: "0 0 12px", lineHeight: 1.1 }}>{post.title}</h1>
              {post.meta.excerpt && <p style={{ color: "#dfe6eb", fontSize: 17, margin: 0 }}>{post.meta.excerpt}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── BODY + SIDEBAR ── */}
      <div style={{ background: "#fff", padding: "56px 28px 72px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 300px", gap: 52, alignItems: "start" }} className="es-article-grid">

          {/* Body */}
          <div>
            {paragraphs.map((para, i) => (
              <div key={i} id={`para-${i}`}>
                {i === 0 ? (
                  /* Pull-quote: first paragraph */
                  <p style={{ fontSize: 20, fontStyle: "italic", lineHeight: 1.75, color: "var(--color-navy)", borderLeft: "4px solid var(--color-brass)", paddingLeft: 22, margin: "0 0 28px" }}>{para}</p>
                ) : (
                  <p style={{ fontSize: 16.5, lineHeight: 1.85, color: "var(--color-ink)", margin: "0 0 22px" }}>{para}</p>
                )}
                {/* Guyline divider every 3rd paragraph */}
                {i > 0 && i % 3 === 0 && (
                  <div className="guyline" style={{ margin: "32px 0" }} />
                )}
              </div>
            ))}

            {/* Bottom CTA strip */}
            <div style={{ background: "linear-gradient(135deg,var(--color-navy-deep),var(--color-steel))", borderRadius: 16, padding: "32px 28px", marginTop: 40, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ color: "var(--color-brass)" }}>Ready to get yours?</div>
                <h3 className="display" style={{ fontSize: 22, color: "#fff", margin: "6px 0 0" }}>Get your instant estimate now.</h3>
              </div>
              <Link href="/quote" className="btn-brass" style={{ fontSize: 15 }}>Price my sail →</Link>
            </div>

            {/* Related guides */}
            {related.length > 0 && (
              <div style={{ marginTop: 52 }}>
                <h3 className="display" style={{ fontSize: 20, color: "var(--color-navy)", marginBottom: 18 }}>More guides</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="es-rel-grid">
                  {related.map((r, i) => (
                    <Link key={r.id} href={`/blog/${r.slug}`} className="card es-tile" style={{ textDecoration: "none", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <div style={{ position: "relative", aspectRatio: "16/8" }}>
                        {r.image
                          ? <Image src={r.image} alt={r.title} fill sizes="400px" style={{ objectFit: "cover" }} />
                          : <PhotoFrame photo={FALLBACK_PHOTOS[(i + fallbackIdx + 1) % FALLBACK_PHOTOS.length]} sizes="400px" style={{ position: "absolute", inset: 0 }} />
                        }
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <h4 className="display" style={{ fontSize: 15.5, color: "var(--color-navy)", margin: "0 0 5px" }}>{r.title}</h4>
                        <p style={{ fontSize: 13, color: "var(--color-steel)", margin: 0 }}>{r.meta.excerpt}</p>
                        <span style={{ color: "var(--color-brass)", fontWeight: 700, fontSize: 12.5, display: "inline-block", marginTop: 10 }}>Read guide →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ position: "sticky", top: 100 }}>
            {/* In this guide */}
            <div className="card" style={{ padding: "20px 22px", marginBottom: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>In this guide</div>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {tocItems.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} style={{ fontSize: 13, color: "var(--color-steel)", textDecoration: "none", display: "block", padding: "4px 0", borderBottom: "1px solid var(--color-mist)" }}>
                      <span style={{ color: "var(--color-brass)", marginRight: 6 }}>→</span>{t.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA */}
            <div style={{ background: "var(--color-navy)", borderRadius: 14, padding: "22px 20px", textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--color-brass)" }}>Free site survey</div>
              <p className="display" style={{ fontSize: 17, color: "#fff", margin: "8px 0 14px", lineHeight: 1.3 }}>Get a real price<br />in two minutes.</p>
              <Link href="/quote" className="btn-brass" style={{ display: "block", textAlign: "center", fontSize: 14 }}>Get my estimate →</Link>
              <p style={{ fontSize: 11.5, color: "var(--color-silver)", marginTop: 12 }}>Cape Metro site surveys are free.</p>
            </div>

            {/* Reading info */}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--color-silver)" }}>
              {rt} min read · {dateZA(post.created_at)}<br />
              <Link href="/blog" style={{ color: "var(--color-steel)", textDecoration: "none" }}>← All guides</Link>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px){ .es-article-grid{ grid-template-columns: 1fr !important; } aside{ position: static !important; } }
        @media (max-width: 580px){ .es-rel-grid{ grid-template-columns: 1fr !important; } }
        .es-tile{ transition: transform .25s ease, box-shadow .25s ease; }
        .es-tile:hover{ transform: translateY(-3px); box-shadow: var(--shadow-lift); }
      `}</style>
    </article>
  );
}

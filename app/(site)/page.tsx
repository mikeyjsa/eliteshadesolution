import Link from "next/link";
import type { Metadata } from "next";
import { UVDial } from "@/components/Illustrations";
import { Counter, FAQ } from "@/components/Interactive";
import { MiniEstimator, CompareSlider, ProcessTimeline, StickyQuoteBar } from "@/components/HomeInteractive";
import { PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";
import { getDB } from "@/lib/db";
import { ratesFromPricing } from "@/lib/quote-engine";
import { zar } from "@/lib/format";
import { readBlockMeta, readBlockItems } from "@/lib/page-blocks";
import { absUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Default content — overridden by CMS blocks from /admin/content → Page Blocks
const D_TESTIMONIALS = [
  { name: "Megan D.", suburb: "Constantia", text: "Had a real price in minutes instead of waiting a week for a callback. The sail's survived two southeasters without a flutter." },
  { name: "Riaan K.", suburb: "Durbanville", text: "Proper galvanised posts, neat stainless fittings — you can see it's engineered, not bolted on. Worth every rand." },
  { name: "Thandi M.", suburb: "Bishopscourt", text: "Booked the deposit online, install date confirmed the same week. Easiest home project we've done." },
];
const D_FAQS = [
  { q: "How accurate is the online estimate?", a: "It's a genuine, itemised range — net, poles, hardware and labour — not a teaser. We only firm it up after a free on-site survey because ground conditions, access and exact fixings vary. In most cases the final quote lands inside the range you saw online." },
  { q: "What makes Kalahari nets different from hardware-store sails?", a: "Kalahari nets are knitted UV-stabilised HDPE built for permanent installation — they block up to 90% of UV, breathe in wind, and resist fading, mould and mildew. The Extreme range adds 285 GSM fabric, wider webbing and reinforced stitching for harsher sun and wind." },
  { q: "Do I need poles, or can you fix to my walls?", a: "Both work. Where you have a sound wall or fascia we anchor with a drilled pad eye — cheaper and tidy. Where there's nothing to fix to, we install galvanised poles set in concrete. The calculator prices either option." },
  { q: "How long does installation take?", a: "A typical single-sail residential install is a one-day job once poles have cured. We confirm the schedule when your deposit is paid and email you the date." },
  { q: "What's the deposit and when do I pay the balance?", a: "A 50% deposit secures the sale and books your install, paid securely via PayFast. The balance is due on completion of installation." },
  { q: "Which areas do you cover?", a: "The greater Cape Metro — Southern Suburbs, Northern Suburbs, Helderberg, Atlantic Seaboard and the Winelands. Site surveys in the Cape Metro are free." },
];
const D_USPS = [
  { title: "Instant estimate", desc: "A self-serve calculator gives a real price range on the spot. Competitors all gate pricing behind a call." },
  { title: "Engineered for the Cape", desc: "Galvanised posts, stainless fittings and correct tensioning, built for the Southeaster — not a patch job." },
  { title: "Genuine Kalahari product", desc: "Permanent-install nets, 90% UV block, breathable UV-stabilised fabric. Extreme range is 285 GSM, reinforced." },
];
const D_STATS = [
  { n: "138", suffix: "+", label: "sails installed across the Cape" },
  { n: "2", suffix: " min", label: "to a real online estimate" },
  { n: "90", suffix: "%", label: "UV blocked by Kalahari fabric" },
  { n: "285", suffix: " GSM", label: "Extreme reinforced fabric" },
];
const D_HERO = { headline: "Know your price\nin two minutes.\nInstalled by experts.", subheadline: "Premium Kalahari shade sails — engineered for the Southeaster, priced transparently online. No callback, no mystery quote, no pushy sales visit before you see a number.", cta: "Get my instant estimate →" };

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Know your price in two minutes",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const db = await getDB();
  const gallery = db.content.filter((c) => c.type === "gallery" && c.published).slice(0, 4);
  const rates = ratesFromPricing(db.pricing);
  const s = db.settings;

  // CMS-driven blocks — use the module-level helpers to avoid <T> JSX ambiguity
  const heroMeta = readBlockMeta(db, "home_hero");
  const heroHeadline = heroMeta.headline ?? D_HERO.headline;
  const heroSub = heroMeta.subheadline ?? D_HERO.subheadline;
  const heroCta = heroMeta.cta ?? D_HERO.cta;
  const stats = readBlockItems(db, "home_stats") ?? D_STATS;
  const usps = readBlockItems(db, "home_usps") ?? D_USPS;
  const testimonials = readBlockItems(db, "home_testimonials") ?? D_TESTIMONIALS;
  const faqs = readBlockItems(db, "home_faq") ?? D_FAQS;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absUrl("/"),
    email: s.sales_email || s.email_from || "sales@eliteshadesolutions.co.za",
    areaServed: "Cape Town, Western Cape, South Africa",
    image: absUrl("/opengraph-image"),
    serviceType: "Shade sail supply and installation",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        name: s.sales_name || "Jean-Pierre Miller",
        telephone: s.sales_phone ? `+27 ${s.sales_phone.replace(/\D/g, "").replace(/^0/, "")}` : "+27 67 618 2422",
        email: s.sales_email || s.email_from || "sales@eliteshadesolutions.co.za",
      },
      {
        "@type": "ContactPoint",
        contactType: "marketing / online sales",
        name: s.marketing_name || "Michael Theron",
        telephone: s.marketing_phone ? `+27 ${s.marketing_phone.replace(/\D/g, "").replace(/^0/, "")}` : "+27 60 949 1197",
        email: s.info_email || "info@eliteshadesolutions.co.za",
      },
    ],
    makesOffer: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: absUrl("/quote"),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* ===== HERO ===== */}
      <section className="hero-spotlight" style={{ background: "linear-gradient(160deg,#1c2733 0%,#283746 55%,#384a5b 100%)", color: "#fff", overflow: "hidden", position: "relative" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "70px 28px 60px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 30, alignItems: "center" }} className="es-hero-grid">
          <div>
            <span className="eyebrow" style={{ animation: "fade-in-up 0.6s ease .1s both" }}>Cape Town · Western Cape</span>
            <h1 className="display" style={{ fontSize: "clamp(38px, 6vw, 68px)", margin: "16px 0 10px", color: "#fff", lineHeight: 1.05 }}>
              {heroHeadline.split("\n").map((line, lineIdx, lines) => {
                const wordOffset = lines.slice(0, lineIdx).join(" ").split(/\s+/).filter(Boolean).length;
                const words = line.split(/\s+/).filter(Boolean);
                return (
                  <span key={lineIdx} style={{ display: "block" }}>
                    {words.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className="hero-word"
                        style={{
                          animationDelay: `${(wordOffset + wIdx) * 0.09 + 0.2}s`,
                          color: lineIdx === 1 ? "var(--color-brass)" : undefined,
                          marginRight: wIdx < words.length - 1 ? "0.28em" : 0,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                );
              })}
            </h1>
            <p style={{ fontSize: 18, color: "#dfe6eb", maxWidth: 520, lineHeight: 1.65, animation: "fade-in-up 0.7s ease 0.7s both" }}>{heroSub}</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 30, animation: "fade-in-up 0.7s ease 0.85s both" }}>
              <Link href="/quote" className="btn-brass" style={{ fontSize: 16 }}>{heroCta}</Link>
              <Link href="/how-it-works" className="btn-ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,.3)" }}>How it works</Link>
            </div>
            <div style={{ display: "flex", gap: 30, marginTop: 38, flexWrap: "wrap" }}>
              {[["90%", "UV blocked"], ["Genuine", "Kalahari nets"], ["Free", "Cape Metro survey"]].map(([a, b]) => (
                <div key={b}>
                  <div className="display" style={{ fontSize: 24, color: "var(--color-brass)" }}>{a}</div>
                  <div style={{ fontSize: 12.5, color: "var(--color-silver)", letterSpacing: ".04em", textTransform: "uppercase" }}>{b}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-parallax" style={{ position: "relative", animation: "fade-in-up 0.9s ease 0.3s both" }}>
            <PhotoFrame
              photo={SITE_PHOTOS.heroHouse}
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
              style={{ minHeight: 480, borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}
              overlay="linear-gradient(180deg, rgba(18,26,35,0.04) 0%, rgba(18,26,35,0.38) 100%)"
            >
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: 20 }}>
                <div style={{ background: "rgba(255,255,255,.9)", color: "var(--color-navy-deep)", borderRadius: 14, padding: "10px 12px", maxWidth: 240 }}>
                  <div className="display" style={{ fontSize: 15 }}>Real installed shade</div>
                  <div style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 2 }}>Tensioned sail, steel posts, clean residential finish.</div>
                </div>
              </div>
            </PhotoFrame>
          </div>
        </div>
        {/* trust strip */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", background: "rgba(0,0,0,.15)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 28px", display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", fontSize: 13, color: "var(--color-silver)", letterSpacing: ".02em" }}>
            <span>★ Owner-run, Cape Town</span><span>★ Galvanised &amp; stainless fittings</span><span>★ Wind-rated tensioning</span><span>★ PayFast secure deposits</span>
          </div>
        </div>
      </section>

      {/* ===== STATS BAND (animated) ===== */}
      <section style={{ background: "#fff", padding: "44px 28px", borderBottom: "1px solid var(--color-line)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22 }} className="es-4col">
          {(stats as {n?: string; suffix?: string; label?: string}[]).map((s, i) => (
            <div key={i} style={{ textAlign: "center" }} className="reveal">
              <div className="display" style={{ fontSize: 38, color: "var(--color-navy)" }}>
                <Counter to={parseInt(s.n ?? "0") || 0} suffix={s.suffix ?? ""} />
              </div>
              <div style={{ fontSize: 13, color: "var(--color-steel)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== THE WEDGE ===== */}
      <section style={{ background: "#fff", padding: "72px 28px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
            <span className="eyebrow">Why Elite</span>
            <h2 className="display" style={{ fontSize: 34, color: "var(--color-navy)", margin: "10px 0" }}>Every other installer hides the price.</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 17 }}>
              We standardised on genuine Kalahari sizes so we can show you a real
              estimate the moment you want one — then confirm it with a free survey.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }} className="es-3col">
            {(usps as {title?: string; desc?: string}[]).map((u, i) => (
              <div key={i} className="card reveal tilt-card" style={{ padding: "28px 26px", transitionDelay: `${i * 80}ms` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--color-brass-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-warn)", fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 14 }}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className="display" style={{ fontSize: 19, color: "var(--color-navy)", marginBottom: 8 }}>{u.title}</h3>
                <p style={{ color: "var(--color-steel)", fontSize: 14.5, margin: 0 }}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MINI ESTIMATOR (interactive) ===== */}
      <section style={{ background: "var(--color-mist)", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 34px" }}>
            <span className="eyebrow">No forms, no waiting</span>
            <h2 className="display" style={{ fontSize: 32, color: "var(--color-navy)", margin: "10px 0" }}>Play with a real price right now</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 16 }}>
              The same engine that powers our full quote tool — drag the sliders and
              watch the sail and the price respond.
            </p>
          </div>
          <div className="reveal">
            <MiniEstimator rates={rates} />
          </div>
        </div>
      </section>

      {/* ===== ENGINEERING / ANATOMY ===== */}
      <section style={{ background: "var(--color-mist)", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="es-2col">
          <div className="reveal">
            <span className="eyebrow">The engineering</span>
            <h2 className="display" style={{ fontSize: 32, color: "var(--color-navy)", margin: "10px 0 14px" }}>Tension is the whole game</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 16, marginBottom: 18 }}>
              A shade sail only performs if it's properly anchored and correctly
              tensioned into a double-curved form. Each corner gets a kit built for
              the job — a turnbuckle and chain to tension it, plus a drilled pad eye
              on walls or an eye-bolt on a galvanised pole.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Galvanised poles", "Set in concrete footings, rust-resistant for the coast"],
                ["Stainless fittings", "Turnbuckles, chain and eyes that won't seize or corrode"],
                ["Correct tensioning", "A taut hypar form that sheds wind instead of flapping"],
              ].map(([t, d]) => (
                <li key={t} style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "var(--color-brass)", fontWeight: 800, fontFamily: "var(--font-display)" }}>▸</span>
                  <span><b style={{ color: "var(--color-navy)" }}>{t}</b> <span style={{ color: "var(--color-steel)" }}>— {d}</span></span>
                </li>
              ))}
            </ul>
            <Link href="/how-it-works" className="btn-ghost" style={{ display: "inline-block", marginTop: 24 }}>See the full spec →</Link>
          </div>
          <div className="reveal">
            <PhotoFrame
              photo={SITE_PHOTOS.howItWorks}
              sizes="(max-width: 820px) 100vw, 50vw"
              style={{ minHeight: 420, borderRadius: 18, boxShadow: "var(--shadow-lift)" }}
              imageStyle={{ objectPosition: "90% center" }}
              overlay="linear-gradient(180deg, rgba(18,28,38,0.1) 0%, rgba(18,28,38,0.42) 100%)"
            >
              <div style={{ display: "flex", alignItems: "flex-end", padding: 20 }}>
                <div style={{ background: "rgba(255,255,255,.92)", color: "var(--color-navy)", borderRadius: 14, padding: "10px 12px", maxWidth: 260 }}>
                  <div className="display" style={{ fontSize: 14.5 }}>Real corner tensioning</div>
                  <div style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 2 }}>Installed hardware doing the actual work, not just a diagram.</div>
                </div>
              </div>
            </PhotoFrame>
          </div>
        </div>
      </section>

      {/* ===== PROCESS STRIP ===== */}
      <section style={{ background: "#fff", padding: "64px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="display reveal" style={{ fontSize: 28, color: "var(--color-navy)", marginBottom: 28 }}>From estimate to shade in five steps</h2>
          <div className="reveal">
            <ProcessTimeline />
          </div>
        </div>
      </section>

      {/* ===== PHOTO STRIP — 3 large install visuals ===== */}
      <section style={{ background: "var(--color-navy-deep)", padding: "56px 0 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px 28px" }}>
          <span className="eyebrow">Installed in Cape Town homes</span>
          <h2 className="display reveal" style={{ fontSize: 28, color: "#fff", margin: "8px 0 24px" }}>Pools · patios · play areas · carports</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 3 }} className="es-scene-strip">
          <PhotoFrame photo={SITE_PHOTOS.terracePatio} sizes="(max-width: 820px) 100vw, 44vw" style={{ minHeight: 360 }} />
          <PhotoFrame photo={SITE_PHOTOS.courtyard} sizes="(max-width: 820px) 100vw, 28vw" style={{ minHeight: 360 }} />
          <PhotoFrame photo={SITE_PHOTOS.garden} sizes="(max-width: 820px) 100vw, 28vw" style={{ minHeight: 360 }} />
        </div>
      </section>

      {/* ===== SUN vs SHADE COMPARISON (draggable) ===== */}
      <section style={{ background: "#fff", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 30px" }}>
            <span className="eyebrow">Feel the difference</span>
            <h2 className="display" style={{ fontSize: 32, color: "var(--color-navy)", margin: "10px 0" }}>Drag to see what 90% UV block looks like</h2>
            <p style={{ color: "var(--color-steel)", fontSize: 16 }}>
              Kalahari knitted HDPE takes the sting out of the Cape sun while
              letting hot air escape. Slide the handle across the photo.
            </p>
          </div>
          <div className="reveal">
            <CompareSlider />
          </div>
        </div>
      </section>

      {/* ===== GALLERY TEASER ===== */}
      <section style={{ background: "var(--color-mist)", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
            <div>
              <span className="eyebrow">Recent work</span>
              <h2 className="display" style={{ fontSize: 30, color: "var(--color-navy)", margin: "8px 0 0" }}>Engineered across the Cape</h2>
            </div>
            <Link href="/gallery" className="btn-ghost">View the gallery →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="es-4col">
            {[
              { photo: SITE_PHOTOS.heroHouse, tag: "Patio", title: gallery[0]?.title || "Poolside shade — Constantia", sub: "Large-span sail over an outdoor living area" },
              { photo: SITE_PHOTOS.terracePatio, tag: "Patio", title: gallery[1]?.title || "Entertainment deck — Sea Point", sub: "Wall-fixed sail with crisp edge tensioning" },
              { photo: SITE_PHOTOS.garden, tag: "Garden", title: gallery[2]?.title || "Play area — Durbanville", sub: "Freestanding sail with pole-set anchoring" },
              { photo: SITE_PHOTOS.courtyard, tag: "Courtyard", title: gallery[3]?.title || "Carport cover — Somerset West", sub: "Wide projection shade for larger footprints" },
            ].map((g, i) => (
              <div key={`${g.tag}-${i}`} className="reveal es-tile" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-line)", background: "#fff", transitionDelay: `${i * 70}ms` }}>
                <div style={{ overflow: "hidden", position: "relative" }}>
                  <PhotoFrame photo={g.photo} sizes="(max-width: 520px) 100vw, (max-width: 820px) 50vw, 25vw" style={{ aspectRatio: "4 / 3" }} />
                  <span style={{ position: "absolute", bottom: 10, left: 12, background: "rgba(255,255,255,.92)", color: "var(--color-navy)", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".05em" }}>{g.tag}</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <strong style={{ fontSize: 13.5, color: "var(--color-navy)" }}>{g.title}</strong>
                  <p style={{ fontSize: 12, color: "var(--color-steel)", margin: "4px 0 0" }}>{g.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section style={{ background: "#fff", padding: "70px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="eyebrow">What Cape homeowners say</span>
            <h2 className="display" style={{ fontSize: 30, color: "var(--color-navy)", margin: "8px 0 0" }}>Built to be lived under</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }} className="es-3col">
            {(testimonials as {name?: string; suburb?: string; text?: string}[]).map((t, i) => (
              <div key={t.name} className="card reveal tilt-card" style={{ padding: "26px 24px", transitionDelay: `${i * 80}ms` }}>
                <div style={{ color: "var(--color-brass)", fontSize: 18, letterSpacing: 2, marginBottom: 10 }}>★★★★★</div>
                <p style={{ color: "var(--color-ink)", fontSize: 15, lineHeight: 1.7, fontStyle: "italic", margin: "0 0 16px" }}>“{t.text}”</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--color-navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-display)" }}>{t.name?.[0] ?? "?"}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-navy)" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-steel)" }}>{t.suburb}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== UV / PRODUCT SPLIT ===== */}
      <section className="hero-spotlight" style={{ background: "var(--color-navy-deep)", color: "#fff", padding: "64px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "center" }} className="es-2col">
          <div style={{ display: "grid", placeItems: "center", background: "rgba(255,255,255,.05)", borderRadius: 16, padding: 24 }}>
            <UVDial pct={90} />
          </div>
          <div>
            <span className="eyebrow">The fabric</span>
            <h2 className="display" style={{ fontSize: 30, color: "#fff", margin: "10px 0 12px" }}>UV-stabilised, breathable, built to last</h2>
            <p style={{ color: "#cdd6de", fontSize: 16, maxWidth: 560 }}>
              Kalahari knitted HDPE blocks up to 90% of UV while letting hot air
              escape — so it cools without ballooning in wind. It resists fading,
              mould and mildew, and comes in Black, Charcoal, Sand and Silver at no
              price difference. Choose Extreme (285 GSM) where sun and wind are harshest.
            </p>
            <Link href="/shade-sails" className="btn-brass" style={{ display: "inline-block", marginTop: 22 }}>Explore the range →</Link>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ background: "#fff", padding: "70px 28px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 34 }}>
            <span className="eyebrow">Good to know</span>
            <h2 className="display" style={{ fontSize: 30, color: "var(--color-navy)", margin: "8px 0 0" }}>Questions, answered</h2>
          </div>
          <FAQ items={faqs as {q:string;a:string}[]} />
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section style={{ background: "linear-gradient(135deg,var(--color-navy-deep),var(--color-steel))", padding: "64px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 className="display" style={{ fontSize: 34, color: "#fff", marginBottom: 10 }}>Get your estimate before summer.</h2>
          <p style={{ color: "#cdd6de", fontSize: 17, marginBottom: 26 }}>From {zar(899)} for a genuine Kalahari net. Two minutes online, no obligation.</p>
          <Link href="/quote" className="btn-brass" style={{ fontSize: 16 }}>Get my instant estimate →</Link>
        </div>
      </section>

      {/* ===== STICKY QUOTE BAR ===== */}
      <StickyQuoteBar />

      <style>{`
        @media (max-width: 900px){ .es-hero-grid{ grid-template-columns: 1fr !important; } .es-2col{ grid-template-columns: 1fr !important; } }
        @media (max-width: 820px){ .es-3col, .es-steps, .es-4col{ grid-template-columns: 1fr 1fr !important; } .es-scene-strip{ grid-template-columns: 1fr !important; } }
        @media (max-width: 520px){ .es-3col, .es-steps, .es-4col{ grid-template-columns: 1fr !important; } }
        .es-tile{ transition: transform .25s ease, box-shadow .25s ease, opacity .7s, translate .7s; }
        .es-tile:hover{ transform: translateY(-4px); box-shadow: var(--shadow-lift); }
      `}</style>
    </>
  );
}

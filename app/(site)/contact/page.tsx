import ContactForm from "@/components/ContactForm";
import { PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Contact",
  description: "Contact Elite Shade Solutions for a Cape Town shade sail site survey, estimate follow-up, or installation advice.",
  alternates: { canonical: "/contact" },
};

export default async function Contact() {
  const db = await getDB();
  const s = db.settings;
  const block = db.content.find((item) => item.type === "block" && item.slug === "contact_info");
  const info = {
    sales_name: block?.meta.sales_name || s.sales_name || "Jean-Pierre Miller",
    sales_role: block?.meta.sales_role || s.sales_role || "Sales",
    sales_phone: block?.meta.sales_phone || s.sales_phone || "067 618 2422",
    sales_whatsapp: block?.meta.sales_whatsapp || s.sales_whatsapp || s.whatsapp || "27676182422",
    marketing_name: block?.meta.marketing_name || s.marketing_name || "Michael Theron",
    marketing_role: block?.meta.marketing_role || s.marketing_role || "Marketing / Online sales",
    marketing_phone: block?.meta.marketing_phone || s.marketing_phone || "060 949 1197",
    sales_email: block?.meta.sales_email || s.sales_email || s.email_from || "sales@eliteshadesolutions.co.za",
    info_email: block?.meta.info_email || s.info_email || "info@eliteshadesolutions.co.za",
    areas: block?.meta.areas || "Southern & Northern Suburbs, Helderberg, Atlantic Seaboard, Winelands.",
  };
  return (
    <>
      <PageHero
        photo={SITE_PHOTOS.terracePatio}
        eyebrow="Reach us"
        title="Let's talk shade"
        description="Prefer a number first? Use the instant calculator — otherwise drop us a line and an owner will reply."
        objectPosition="center 54%"
      />

      <section style={{ background: "var(--color-mist)", padding: "50px 28px 70px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 30 }} className="es-2col">
          <ContactForm />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a href={`https://wa.me/${info.sales_whatsapp}`} target="_blank" rel="noreferrer" className="card" style={{ padding: 22, textDecoration: "none", borderLeft: "4px solid var(--color-signal)" }}>
              <strong className="display" style={{ color: "var(--color-navy)", fontSize: 16 }}>WhatsApp sales</strong>
              <p style={{ color: "var(--color-steel)", fontSize: 14, margin: "6px 0 0" }}>{info.sales_name} · {info.sales_phone}</p>
            </a>
            <div className="card" style={{ padding: 22 }}>
              <strong className="display" style={{ color: "var(--color-navy)", fontSize: 16 }}>Team contacts</strong>
              <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)" }}>{info.sales_name}</div>
                  <div style={{ color: "var(--color-steel)", fontSize: 13.5 }}>{info.sales_role} · {info.sales_phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)" }}>{info.marketing_name}</div>
                  <div style={{ color: "var(--color-steel)", fontSize: 13.5 }}>{info.marketing_role} · {info.marketing_phone}</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <strong className="display" style={{ color: "var(--color-navy)", fontSize: 16 }}>Shared email</strong>
              <p style={{ color: "var(--color-steel)", fontSize: 14, margin: "6px 0 0" }}>
                <a href={`mailto:${info.sales_email}`} style={{ color: "inherit", textDecoration: "none" }}>{info.sales_email}</a><br />
                <a href={`mailto:${info.info_email}`} style={{ color: "inherit", textDecoration: "none" }}>{info.info_email}</a>
              </p>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <PhotoFrame photo={SITE_PHOTOS.garden} sizes="(max-width: 760px) 100vw, 30vw" style={{ aspectRatio: "4 / 3" }} />
              <div style={{ padding: 16 }}>
                <strong className="display" style={{ color: "var(--color-navy)", fontSize: 15 }}>Service area</strong>
                <p style={{ color: "var(--color-steel)", fontSize: 13.5, margin: "5px 0 0" }}>{info.areas}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style>{`@media (max-width: 760px){ .es-2col{ grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}

import ContactForm from "@/components/ContactForm";
import { PageHero, PhotoFrame, SITE_PHOTOS } from "@/components/SitePhotos";
import { getDB } from "@/lib/db";
import { getBlock } from "@/lib/blocks";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Contact",
  description: "Contact Elite Shade Solutions for a Cape Town shade sail site survey, estimate follow-up, or installation advice.",
  alternates: { canonical: "/contact" },
};

const D_CONTACT = { phone: "082 123 4567", email: "quotes@eliteshadesolutions.co.za", whatsapp: "27821234567", areas: "Southern & Northern Suburbs, Helderberg, Atlantic Seaboard, Winelands." };

export default async function Contact() {
  const db = await getDB();
  const info = getBlock(db, "contact_info", D_CONTACT);
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
            <a href={`https://wa.me/${info.whatsapp}`} target="_blank" rel="noreferrer" className="card" style={{ padding: 22, textDecoration: "none", borderLeft: "4px solid var(--color-signal)" }}>
              <strong className="display" style={{ color: "var(--color-navy)", fontSize: 16 }}>WhatsApp us</strong>
              <p style={{ color: "var(--color-steel)", fontSize: 14, margin: "6px 0 0" }}>{info.phone} — fastest reply</p>
            </a>
            <div className="card" style={{ padding: 22 }}>
              <strong className="display" style={{ color: "var(--color-navy)", fontSize: 16 }}>Email</strong>
              <p style={{ color: "var(--color-steel)", fontSize: 14, margin: "6px 0 0" }}>{info.email}</p>
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

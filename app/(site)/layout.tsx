import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GAScript from "@/components/GAScript";
import GAPageTracker from "@/components/GAPageTracker";
import AnimationLayer from "@/components/AnimationLayer";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const db = await getDB();
  const s = db.settings;
  const gaId = s.ga_measurement_id || "";
  const contact = db.content.find((item) => item.type === "block" && item.slug === "contact_info");
  const footer = db.content.find((item) => item.type === "block" && item.slug === "footer_info");
  const fbUrl = footer?.meta.facebook_url || "";
  const igUrl = footer?.meta.instagram_url || "";

  return (
    <>
      <GAScript id={gaId} />
      <GAPageTracker id={gaId} />
      <Nav />
      <main style={{ minHeight: "70vh" }}>{children}</main>
      <Footer
        facebookUrl={fbUrl}
        instagramUrl={igUrl}
        brandName={footer?.meta.brand_name}
        tagline={footer?.meta.tagline}
        blurb={footer?.meta.blurb}
        location={footer?.meta.location}
        legalNote={footer?.meta.legal_note}
        salesName={contact?.meta.sales_name}
        salesRole={contact?.meta.sales_role}
        salesPhone={contact?.meta.sales_phone}
        marketingName={contact?.meta.marketing_name}
        marketingRole={contact?.meta.marketing_role}
        marketingPhone={contact?.meta.marketing_phone}
        salesEmail={contact?.meta.sales_email}
        infoEmail={contact?.meta.info_email}
      />
      <Reveal />
      <AnimationLayer />
    </>
  );
}

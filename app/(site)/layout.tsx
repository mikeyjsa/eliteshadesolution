import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GAScript from "@/components/GAScript";
import AnimationLayer from "@/components/AnimationLayer";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const db = await getDB();
  const s = db.settings;
  const gaId = s.ga_measurement_id || "";
  const fbUrl = s.facebook_url || "";
  const igUrl = s.instagram_url || "";

  return (
    <>
      <GAScript id={gaId} />
      <Nav />
      <main style={{ minHeight: "70vh" }}>{children}</main>
      <Footer
        facebookUrl={fbUrl}
        instagramUrl={igUrl}
        salesName={s.sales_name}
        salesRole={s.sales_role}
        salesPhone={s.sales_phone}
        marketingName={s.marketing_name}
        marketingRole={s.marketing_role}
        marketingPhone={s.marketing_phone}
        salesEmail={s.sales_email}
        infoEmail={s.info_email}
      />
      <Reveal />
      <AnimationLayer />
    </>
  );
}

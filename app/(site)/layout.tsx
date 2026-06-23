import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GAScript from "@/components/GAScript";
import AnimationLayer from "@/components/AnimationLayer";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const db = await getDB();
  const gaId = db.settings.ga_measurement_id || "";
  const fbUrl = db.settings.facebook_url || "";
  const igUrl = db.settings.instagram_url || "";

  return (
    <>
      <GAScript id={gaId} />
      <Nav />
      <main style={{ minHeight: "70vh" }}>{children}</main>
      <Footer facebookUrl={fbUrl} instagramUrl={igUrl} />
      <Reveal />
      <AnimationLayer />
    </>
  );
}

import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import PricingEditor from "@/components/PricingEditor";

export const dynamic = "force-dynamic";

export default async function Pricing() {
  const db = await getDB();
  return (
    <>
      <AdminHead eyebrow="Configure" title="Pricing" />
      <div style={{ padding: 28 }}>
        <PricingEditor pricing={db.pricing} depositPct={db.settings.deposit_pct} vatEnabled={db.settings.vat_enabled} />
      </div>
    </>
  );
}

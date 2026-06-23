import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = await getDB();
  return (
    <>
      <AdminHead eyebrow="Configure" title="Settings" />
      <div style={{ padding: 28 }}>
        <SettingsForm settings={db.settings} emails={db.emails} />
      </div>
    </>
  );
}

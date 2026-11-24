import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await currentUser();
  if (!me || me.role !== "admin") redirect("/admin");

  const db = await getDB();
  return (
    <>
      <AdminHead eyebrow="Configure" title="Settings" />
      <div style={{ padding: 28 }}>
        <SettingsForm
          settings={{ ...db.settings, admin_password: "", smtp_pass: "", ga_service_account_private_key: "" }}
          emails={db.emails}
          hasSmtpPassword={!!db.settings.smtp_pass}
          hasAnalyticsKey={!!db.settings.ga_service_account_private_key?.trim()}
          testRecipient={me.email}
        />
      </div>
    </>
  );
}

import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import NotificationCenter from "@/components/NotificationCenter";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const db = await getDB();

  return (
    <>
      <AdminHead eyebrow="Admin" title="Notifications" />
      <div style={{ padding: 28 }}>
        <NotificationCenter initial={db.notifications} />
      </div>
    </>
  );
}

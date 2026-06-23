import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import ContentManager from "@/components/ContentManager";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const db = await getDB();
  return (
    <>
      <AdminHead eyebrow="Configure" title="Content (CMS)" />
      <div style={{ padding: 28 }}>
        <ContentManager items={db.content} />
      </div>
    </>
  );
}

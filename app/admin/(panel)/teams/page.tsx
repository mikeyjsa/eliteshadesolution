import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import TeamManager from "@/components/TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const db = await getDB();

  return (
    <>
      <AdminHead eyebrow="Operations" title="Teams" />
      <div style={{ padding: 28 }}>
        <TeamManager initial={db.teams} />
      </div>
    </>
  );
}

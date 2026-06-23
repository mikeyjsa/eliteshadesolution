import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import UserManager from "@/components/UserManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await currentUser();
  // Managers cannot view this page — redirect to dashboard
  if (!me || me.role !== "admin") redirect("/admin");

  const db = await getDB();
  const users = db.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, created_at: u.created_at }));

  return (
    <>
      <AdminHead eyebrow="Settings" title="User Management" />
      <UserManager users={users} currentUserId={me.id} />
    </>
  );
}

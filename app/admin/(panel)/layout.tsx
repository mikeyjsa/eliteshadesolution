import { redirect } from "next/navigation";
import { isAuthed, currentUser } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect("/admin/login");
  const user = await currentUser();
  return (
    <div style={{ display: "flex", background: "#f1f4f6", minHeight: "100vh" }}>
      <AdminSidebar userName={user?.name} userRole={user?.role} userId={user?.id} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

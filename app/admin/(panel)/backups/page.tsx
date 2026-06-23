import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listBackups } from "@/lib/backups";
import AdminHead from "@/components/AdminHead";
import BackupsManager from "@/components/BackupsManager";

export const dynamic = "force-dynamic";

export default async function BackupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const me = await currentUser();
  if (!me || me.role !== "admin") redirect("/admin");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 10;
  const all = await listBackups();
  const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return (
    <>
      <AdminHead eyebrow="Admin only" title="Backups" />
      <BackupsManager backups={all.slice(start, start + pageSize)} page={safePage} pageCount={pageCount} />
    </>
  );
}

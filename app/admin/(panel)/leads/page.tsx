import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import KanbanBoard, { type Card } from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function Leads() {
  const db = await getDB();
  const cards: Card[] = db.quotes.map((q) => {
    const c = db.customers.find((x) => x.id === q.customer_id);
    return {
      id: q.id,
      name: c?.name ?? "Unknown",
      suburb: c?.suburb ?? "",
      source: c?.source ?? "",
      status: q.status,
      estLow: q.estimate_low,
      estHigh: q.estimate_high,
      final: q.final_total,
      net: q.net_label,
      archived: q.archived,
    };
  });

  return (
    <>
      <AdminHead eyebrow="Sales" title="CRM Pipeline" />
      <div style={{ padding: 24 }}>
        <KanbanBoard initial={cards} />
      </div>
    </>
  );
}

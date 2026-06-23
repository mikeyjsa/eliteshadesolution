import Link from "next/link";
import { getDB } from "@/lib/db";
import { dateZA } from "@/lib/format";
import AdminHead from "@/components/AdminHead";

export const dynamic = "force-dynamic";

export default async function Schedule() {
  const db = await getDB();

  // Build a 5-week calendar grid starting this week's Monday.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday

  const byDate: Record<string, { name: string; installer: string; id: string }[]> = {};
  for (const inst of db.installations) {
    const q = db.quotes.find((x) => x.id === inst.quote_id);
    const c = q && db.customers.find((x) => x.id === q.customer_id);
    (byDate[inst.scheduled_date] ||= []).push({ name: c?.name ?? "Job", installer: inst.installer, id: q?.id ?? "" });
  }

  const weeks: Date[][] = [];
  for (let w = 0; w < 5; w++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      row.push(day);
    }
    weeks.push(row);
  }
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const upcoming = db.installations
    .filter((i) => new Date(i.scheduled_date) >= today)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  return (
    <>
      <AdminHead eyebrow="Operations" title="Installation Schedule" />
      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }} className="es-2col">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--color-steel)", textAlign: "center", padding: 4 }}>{d}</div>
            ))}
          </div>
          {weeks.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
              {row.map((day) => {
                const key = iso(day);
                const jobs = byDate[key] || [];
                const isToday = key === iso(today);
                return (
                  <div key={key} style={{ minHeight: 78, background: isToday ? "var(--color-brass-soft)" : "var(--color-mist)", border: isToday ? "1px solid var(--color-brass)" : "1px solid transparent", borderRadius: 8, padding: 6 }}>
                    <div className="tnum" style={{ fontSize: 11, color: "var(--color-steel)", fontWeight: isToday ? 800 : 500 }}>{day.getDate()}</div>
                    {jobs.map((j) => (
                      <Link key={j.id} href={`/admin/quotes/${j.id}`} style={{ display: "block", background: "var(--color-navy)", color: "#fff", fontSize: 10.5, borderRadius: 5, padding: "3px 5px", marginTop: 3, textDecoration: "none", lineHeight: 1.3 }}>
                        {j.name}<br /><span style={{ opacity: 0.7 }}>{j.installer}</span>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 12 }}>Upcoming installs</h3>
          {upcoming.length === 0 && <p style={{ color: "var(--color-steel)", fontSize: 13.5 }}>Nothing scheduled. Book installs from a confirmed lead.</p>}
          {upcoming.map((i) => {
            const q = db.quotes.find((x) => x.id === i.quote_id);
            const c = q && db.customers.find((x) => x.id === q.customer_id);
            return (
              <Link key={i.id} href={q ? `/admin/quotes/${q.id}` : "#"} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid var(--color-mist)", textDecoration: "none" }}>
                <div style={{ fontSize: 13.5, color: "var(--color-navy)", fontWeight: 600 }}>{c?.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--color-steel)" }}>{dateZA(i.scheduled_date)} · {i.installer} · {c?.suburb}</div>
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`@media (max-width:900px){ .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </>
  );
}

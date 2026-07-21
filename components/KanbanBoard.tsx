"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STAGES, type QuoteStage } from "@/lib/types";
import { zar } from "@/lib/format";

export interface Card {
  id: string;
  name: string;
  suburb: string;
  source: string;
  status: QuoteStage;
  estLow: number;
  estHigh: number;
  final: number | null;
  net: string;
  archived: boolean;
}

const DOT: Record<QuoteStage, string> = {
  new: "var(--color-brass)",
  following_up: "var(--color-steel)",
  confirmed: "var(--color-navy)",
  deposit_paid: "var(--color-signal)",
  scheduled: "var(--color-signal)",
  installed: "var(--color-signal)",
};

export default function KanbanBoard({ initial }: { initial: Card[] }) {
  const [cards, setCards] = useState(initial);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<QuoteStage | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const active = cards.filter((c) => !c.archived);
  const archived = cards.filter((c) => c.archived);
  const paidArchivable = active.filter((c) => c.status === "installed").length;

  async function move(id: string, status: QuoteStage) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    router.refresh();
  }
  async function setArchived(id: string, value: boolean) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, archived: value } : c)));
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: value }) });
    router.refresh();
  }
  async function removeArchived(id: string) {
    if (!confirm("Delete this lead permanently? This will remove linked invoices, activities, schedule entries, and payment proofs too.")) return;
    setCards((cs) => cs.filter((c) => c.id !== id));
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      router.refresh();
      return;
    }
    router.refresh();
  }
  async function removeLead(id: string) {
    if (!confirm("Delete this quote or enquiry permanently? This will remove linked invoices, activities, schedule entries, and payment proofs too.")) return;
    setCards((cs) => cs.filter((c) => c.id !== id));
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      router.refresh();
      return;
    }
    router.refresh();
  }
  async function archiveAllPaid() {
    if (!paidArchivable) return;
    setBusy(true);
    setCards((cs) => cs.map((c) => (c.status === "installed" ? { ...c, archived: true } : c)));
    await fetch("/api/leads/archive", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["active", "archived"] as const).map((t) => (
          <button key={t} onClick={() => setView(t)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--color-line)", background: view === t ? "var(--color-navy)" : "#fff", color: view === t ? "#fff" : "var(--color-navy)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".04em" }}>
            {t === "active" ? `Pipeline (${active.length})` : `Archived (${archived.length})`}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {view === "active" && <span style={{ fontSize: 12.5, color: "var(--color-steel)" }}>Drag cards between stages</span>}
          {view === "active" && (
            <button className="btn-ghost" onClick={archiveAllPaid} disabled={busy || !paidArchivable} style={{ padding: "7px 14px", fontSize: 13, opacity: paidArchivable ? 1 : 0.5 }}>
              Archive all paid{paidArchivable ? ` (${paidArchivable})` : ""}
            </button>
          )}
        </div>
      </div>

      {view === "active" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(170px,1fr))", gap: 12, overflowX: "auto", padding: "4px 0" }}>
          {STAGES.map((s) => {
            const col = active.filter((c) => c.status === s.key);
            return (
              <div
                key={s.key}
                onDragOver={(e) => { e.preventDefault(); setOver(s.key); }}
                onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
                onDrop={() => { if (drag) move(drag, s.key); setDrag(null); setOver(null); }}
                style={{ background: over === s.key ? "#e3ebf0" : "#eef2f4", borderRadius: 12, padding: 10, minHeight: 320, transition: "background .12s", outline: over === s.key ? "2px dashed var(--color-brass)" : "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "2px 4px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--color-navy)" }}>{s.label}</span>
                  <span className="tnum" style={{ fontSize: 11, color: "var(--color-steel)", background: "#fff", borderRadius: 10, padding: "1px 7px" }}>{col.length}</span>
                </div>
                {col.map((c) => (
                  <div key={c.id} style={{ position: "relative" }}>
                    <Link
                      href={`/admin/quotes/${c.id}`}
                      draggable
                      onDragStart={() => setDrag(c.id)}
                      onDragEnd={() => { setDrag(null); setOver(null); }}
                      style={{ display: "block", background: "#fff", border: "1px solid var(--color-line)", borderRadius: 9, padding: "10px 12px", marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,.05)", textDecoration: "none", cursor: "grab", opacity: drag === c.id ? 0.45 : 1 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOT[c.status], flexShrink: 0 }} />
                        <strong style={{ fontSize: 12.5, color: "var(--color-navy)" }}>{c.name}</strong>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--color-steel)" }}>{c.suburb} · {c.source}</div>
                      <div style={{ marginTop: 5 }}>
                        {c.net === "Contact form enquiry" ? (
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--color-warn)", background: "var(--color-brass-soft)", padding: "2px 8px", borderRadius: 10 }}>
                            Enquiry — no estimate yet
                          </span>
                        ) : (
                          <span className="tnum" style={{ fontSize: 12.5, color: "var(--color-navy)", fontWeight: 700 }}>
                            {c.final != null ? zar(c.final) : `${zar(c.estLow)}–${zar(c.estHigh)}`}
                          </span>
                        )}
                      </div>
                    </Link>
                    {c.status === "installed" && (
                      <button onClick={() => setArchived(c.id, true)} title="Archive" style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", color: "var(--color-silver)", cursor: "pointer", fontSize: 13 }}>⤓</button>
                    )}
                    <button onClick={() => removeLead(c.id)} title="Delete" style={{ position: "absolute", bottom: 8, right: 8, background: "none", border: "none", color: "#a23c34", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>Delete</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {archived.length === 0 ? (
            <p style={{ padding: 32, textAlign: "center", color: "var(--color-steel)" }}>No archived jobs yet. Completed &amp; paid jobs land here.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "var(--color-navy)", color: "#fff", textAlign: "left" }}>
                  <th style={{ padding: "11px 16px" }}>Customer</th>
                  <th style={{ padding: "11px 16px" }}>Suburb</th>
                  <th style={{ padding: "11px 16px" }}>Net</th>
                  <th style={{ padding: "11px 16px", textAlign: "right" }}>Value</th>
                  <th style={{ padding: "11px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                    <td style={{ padding: "10px 16px" }}><Link href={`/admin/quotes/${c.id}`} style={{ color: "var(--color-navy)", fontWeight: 600, textDecoration: "none" }}>{c.name}</Link></td>
                    <td style={{ padding: "10px 16px", color: "var(--color-steel)" }}>{c.suburb}</td>
                    <td style={{ padding: "10px 16px", color: "var(--color-steel)" }}>{c.net}</td>
                    <td className="tnum" style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>{c.final != null ? zar(c.final) : "—"}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <button onClick={() => setArchived(c.id, false)} style={{ background: "none", border: "none", color: "var(--color-brass)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Restore</button>
                      <button onClick={() => removeArchived(c.id)} style={{ background: "none", border: "none", color: "#a23c34", fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginLeft: 14 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

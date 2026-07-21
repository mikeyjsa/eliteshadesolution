"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminNotification } from "@/lib/types";

export default function NotificationCenter({ initial }: { initial: AdminNotification[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState("");
  const router = useRouter();

  const unread = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  async function mark(id: string, read: boolean) {
    setBusy(id);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read_at: read ? new Date().toISOString() : null } : item)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setBusy("");
    router.refresh();
  }

  async function markAllRead() {
    setBusy("all");
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setBusy("");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "var(--color-steel)" }}>
          {unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "All caught up"}
        </div>
        <button className="btn-ghost" onClick={markAllRead} disabled={!unread || busy === "all"} style={{ padding: "8px 14px", fontSize: 13 }}>
          {busy === "all" ? "Marking…" : "Mark all read"}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {items.length === 0 ? (
          <p style={{ padding: 28, margin: 0, color: "var(--color-steel)", textAlign: "center" }}>No notifications yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-mist)", background: item.read_at ? "#fff" : "rgba(201,162,75,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    {!item.read_at && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brass)", flexShrink: 0 }} />}
                    <strong style={{ color: "var(--color-navy)", fontSize: 14 }}>{item.title}</strong>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--color-ink)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.message}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: "var(--color-silver)" }}>{new Date(item.created_at).toLocaleString("en-ZA")}</span>
                    <Link href={item.href} style={{ fontSize: 12.5, color: "var(--color-warn)", fontWeight: 700, textDecoration: "none" }}>Open →</Link>
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => mark(item.id, !item.read_at)}
                  disabled={busy === item.id}
                  style={{ padding: "6px 10px", fontSize: 12, whiteSpace: "nowrap" }}
                >
                  {item.read_at ? "Mark unread" : "Mark read"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

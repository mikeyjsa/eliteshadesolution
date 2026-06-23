"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type BackupItem = {
  id: string;
  filename: string;
  reason: "hourly" | "manual" | "pre_restore";
  created_at: string;
  size: number;
};

function sizeLabel(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default function BackupsManager({
  backups,
  page,
  pageCount,
}: {
  backups: BackupItem[];
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "manual" | string>("");
  const [msg, setMsg] = useState("");

  async function createManualBackup() {
    setBusy("manual");
    setMsg("");
    const res = await fetch("/api/backups", { method: "POST" });
    setBusy("");
    if (res.ok) {
      setMsg("Manual backup created.");
      router.refresh();
    } else {
      setMsg("Could not create backup.");
    }
  }

  async function restoreBackup(id: string) {
    if (!confirm("Restore this backup? This replaces the live database and creates a pre-restore safety backup first.")) return;
    setBusy(id);
    setMsg("");
    const res = await fetch(`/api/backups/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    setBusy("");
    if (res.ok) {
      setMsg("Backup restored.");
      router.refresh();
    } else {
      setMsg("Could not restore backup.");
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h3 className="display" style={{ fontSize: 17, color: "var(--color-navy)", margin: 0 }}>Database backups</h3>
            <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "6px 0 0" }}>
              Hourly backups are created automatically. You can also create one manually, download any snapshot, or restore one when needed.
            </p>
          </div>
          <button className="btn-brass" onClick={createManualBackup} disabled={busy === "manual"}>
            {busy === "manual" ? "Creating…" : "Create backup now"}
          </button>
        </div>
        {msg && <p style={{ fontSize: 12.5, color: msg.startsWith("Could") ? "#a23c34" : "var(--color-signal)", marginBottom: 0 }}>{msg}</p>}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--color-navy)", color: "#fff", textAlign: "left" }}>
              <th style={{ padding: "11px 16px" }}>Created</th>
              <th style={{ padding: "11px 16px" }}>Reason</th>
              <th style={{ padding: "11px 16px" }}>Filename</th>
              <th style={{ padding: "11px 16px" }}>Size</th>
              <th style={{ padding: "11px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((backup) => (
              <tr key={backup.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                <td style={{ padding: "12px 16px", color: "var(--color-navy)" }}>{new Date(backup.created_at).toLocaleString("en-ZA")}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: backup.reason === "manual" ? "var(--color-warn)" : backup.reason === "pre_restore" ? "#a23c34" : "var(--color-steel)", background: backup.reason === "manual" ? "var(--color-brass-soft)" : backup.reason === "pre_restore" ? "#fbeceb" : "var(--color-mist)", padding: "3px 9px", borderRadius: 12 }}>
                    {backup.reason.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--color-steel)" }}>{backup.filename}</td>
                <td style={{ padding: "12px 16px", color: "var(--color-steel)" }}>{sizeLabel(backup.size)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    <a href={`/api/backups/${backup.id}`} className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>Download</a>
                    <button className="btn-ghost" onClick={() => restoreBackup(backup.id)} disabled={busy === backup.id} style={{ padding: "5px 10px", fontSize: 12 }}>
                      {busy === backup.id ? "Restoring…" : "Restore"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {backups.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 28, textAlign: "center", color: "var(--color-steel)" }}>No backups yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: "var(--color-steel)" }}>Page {page} of {pageCount}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/admin/backups?page=${Math.max(1, page - 1)}`} className="btn-ghost" aria-disabled={page <= 1} style={{ pointerEvents: page <= 1 ? "none" : "auto", opacity: page <= 1 ? 0.45 : 1 }}>
            Previous
          </Link>
          <Link href={`/admin/backups?page=${Math.min(pageCount, page + 1)}`} className="btn-ghost" aria-disabled={page >= pageCount} style={{ pointerEvents: page >= pageCount ? "none" : "auto", opacity: page >= pageCount ? 0.45 : 1 }}>
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}

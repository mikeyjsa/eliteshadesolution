"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";

export default function TeamManager({ initial }: { initial: Team[] }) {
  const [teams, setTeams] = useState(initial);
  const [newTeam, setNewTeam] = useState({ name: "", email: "", members: "", active: true });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const inp: React.CSSProperties = { fontSize: 14, padding: "9px 12px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%" };
  const lab: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 };

  async function saveTeam(team: Team) {
    setBusy(team.id);
    await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
    setBusy("");
    router.refresh();
  }

  async function createTeam() {
    if (!newTeam.name.trim()) {
      setMsg("Team name is required.");
      return;
    }
    setBusy("new");
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTeam),
    });
    setBusy("");
    if (!res.ok) {
      setMsg("Could not create team.");
      return;
    }
    const data = await res.json();
    setTeams((current) => [data.team, ...current]);
    setNewTeam({ name: "", email: "", members: "", active: true });
    setMsg("Team created.");
    router.refresh();
  }

  async function removeTeam(id: string) {
    if (!confirm("Delete this team? Assigned jobs will keep their current team name, but the team will be removed from the list.")) return;
    setBusy(id);
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    setTeams((current) => current.filter((team) => team.id !== id));
    setBusy("");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Create team</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="es-form-grid">
          <div>
            <label style={lab}>Team name</label>
            <input style={inp} value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="Crew A" />
          </div>
          <div>
            <label style={lab}>Team email</label>
            <input style={inp} value={newTeam.email} onChange={(e) => setNewTeam({ ...newTeam, email: e.target.value })} placeholder="crew-a@yourdomain.co.za" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lab}>Members / notes</label>
            <textarea style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} rows={3} value={newTeam.members} onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })} placeholder="Lead installer, assistant, vehicle, area…" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-navy)" }}>
              <input type="checkbox" checked={newTeam.active} onChange={(e) => setNewTeam({ ...newTeam, active: e.target.checked })} />
              Active team
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <button className="btn-brass" onClick={createTeam} disabled={busy === "new"} style={{ padding: "9px 16px", fontSize: 13 }}>
              {busy === "new" ? "Creating…" : "Create team"}
            </button>
          </div>
        </div>
        {msg && <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "12px 0 0" }}>{msg}</p>}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {teams.length === 0 ? (
          <p style={{ padding: 28, margin: 0, textAlign: "center", color: "var(--color-steel)" }}>No teams added yet.</p>
        ) : (
          teams.map((team) => (
            <div key={team.id} style={{ padding: 18, borderBottom: "1px solid var(--color-mist)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.2fr auto", gap: 12, alignItems: "start" }} className="es-form-grid">
                <div>
                  <label style={lab}>Team name</label>
                  <input
                    style={inp}
                    value={team.name}
                    onChange={(e) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, name: e.target.value } : item))}
                  />
                </div>
                <div>
                  <label style={lab}>Team email</label>
                  <input
                    style={inp}
                    value={team.email}
                    onChange={(e) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, email: e.target.value } : item))}
                    placeholder="crew@yourdomain.co.za"
                  />
                </div>
                <div>
                  <label style={lab}>Members / notes</label>
                  <textarea
                    style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
                    rows={2}
                    value={team.members}
                    onChange={(e) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, members: e.target.value } : item))}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--color-navy)", marginTop: 28 }}>
                    <input
                      type="checkbox"
                      checked={team.active}
                      onChange={(e) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, active: e.target.checked } : item))}
                    />
                    Active
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-ghost" onClick={() => saveTeam(team)} disabled={busy === team.id} style={{ padding: "8px 12px", fontSize: 12.5 }}>
                      {busy === team.id ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => removeTeam(team.id)} disabled={busy === team.id} style={{ background: "none", border: "none", color: "#a23c34", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

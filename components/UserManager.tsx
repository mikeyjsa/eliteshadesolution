"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  active: boolean;
  receive_admin_notifications: boolean;
  created_at: string;
}

const inp: React.CSSProperties = { fontSize: 14, padding: "9px 12px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%" };
const lab: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 };

function UserRow({ u, isCurrentUser, onRefresh }: { u: User; isCurrentUser: boolean; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: u.name,
    email: u.email,
    password: "",
    role: u.role,
    active: u.active,
    receive_admin_notifications: u.receive_admin_notifications,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    const payload: Record<string, unknown> = {
      id: u.id,
      name: form.name,
      email: form.email,
      role: form.role,
      active: form.active,
      receive_admin_notifications: form.receive_admin_notifications,
    };
    if (form.password) payload.password = form.password;
    const r = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (r.ok) { setMsg("Saved."); setEditing(false); onRefresh(); }
    else setMsg("Error saving.");
  }

  return (
    <>
      <tr
        style={{ borderBottom: "1px solid var(--color-line)", cursor: "pointer", background: editing ? "var(--color-mist)" : undefined }}
        onClick={() => { if (!editing) setEditing(true); }}
        title="Click to edit"
      >
        <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--color-navy)" }}>
          {u.name}
          {isCurrentUser && <span style={{ fontSize: 10.5, marginLeft: 6, color: "var(--color-brass)", fontWeight: 700 }}>YOU</span>}
        </td>
        <td style={{ padding: "11px 16px", color: "var(--color-steel)" }}>{u.email}</td>
        <td style={{ padding: "11px 16px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: u.role === "admin" ? "var(--color-warn)" : "var(--color-steel)", background: u.role === "admin" ? "var(--color-brass-soft)" : "var(--color-mist)", padding: "3px 9px", borderRadius: 12 }}>{u.role}</span>
        </td>
        <td style={{ padding: "11px 16px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: u.active ? "var(--color-signal)" : "#a23c34", background: u.active ? "#eef4f0" : "#fbeceb", padding: "3px 9px", borderRadius: 12 }}>{u.active ? "Active" : "Inactive"}</span>
        </td>
        <td style={{ padding: "11px 16px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: u.receive_admin_notifications ? "var(--color-signal)" : "var(--color-steel)", background: u.receive_admin_notifications ? "#eef4f0" : "var(--color-mist)", padding: "3px 9px", borderRadius: 12 }}>
            {u.receive_admin_notifications ? "Subscribed" : "Muted"}
          </span>
        </td>
        <td style={{ padding: "11px 16px", textAlign: "right" }}>
          <button onClick={(e) => { e.stopPropagation(); setEditing(!editing); }} style={{ background: "none", border: "none", color: "var(--color-brass)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
            {editing ? "Cancel" : "Edit ✎"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr style={{ background: "#f7f9fa" }}>
          <td colSpan={6} style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
              <div>
                <label style={lab}>Name</label>
                <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={lab}>Email</label>
                <input type="email" style={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={lab}>New password <span style={{ fontWeight: 400, color: "var(--color-silver)" }}>(leave blank to keep)</span></label>
                <input type="text" style={inp} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <label style={lab}>Role</label>
                  <select style={inp} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "manager" })}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", color: "var(--color-navy)" }}>
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Active
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", color: "var(--color-navy)" }}>
                  <input
                    type="checkbox"
                    checked={form.receive_admin_notifications}
                    onChange={(e) => setForm({ ...form, receive_admin_notifications: e.target.checked })}
                  />
                  Receive admin notifications
                </label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn-brass" onClick={save} disabled={busy} style={{ padding: "9px 18px", whiteSpace: "nowrap" }}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
                {msg && <span style={{ fontSize: 12, color: msg.startsWith("Error") ? "#a23c34" : "var(--color-signal)" }}>{msg}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function UserManager({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const [newForm, setNewForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    receive_admin_notifications: true,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function refresh() {
    const r = await fetch("/api/users");
    if (r.ok) { setUsers(await r.json()); router.refresh(); }
  }

  async function addUser() {
    if (!newForm.name || !newForm.email || !newForm.password) { setMsg("Name, email and password are required."); return; }
    setBusy(true);
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm) });
    setBusy(false);
    if (r.ok) {
      setMsg("User created.");
      setNewForm({ name: "", email: "", password: "", role: "manager", receive_admin_notifications: true });
      refresh();
    }
    else setMsg((await r.json()).error ?? "Error");
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }} className="es-detail-grid">

        {/* User list with inline editing */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-line)", fontSize: 12.5, color: "var(--color-steel)" }}>
            Click any row to expand the edit form.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--color-navy)", color: "#fff", textAlign: "left" }}>
                <th style={{ padding: "11px 16px" }}>Name</th>
                <th style={{ padding: "11px 16px" }}>Email</th>
                <th style={{ padding: "11px 16px" }}>Role</th>
                <th style={{ padding: "11px 16px" }}>Status</th>
                <th style={{ padding: "11px 16px" }}>Notifications</th>
                <th style={{ padding: "11px 16px", textAlign: "right" }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} u={u} isCurrentUser={u.id === currentUserId} onRefresh={refresh} />
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "var(--color-steel)" }}>No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add new user */}
        <div className="card" style={{ padding: 22 }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Add new user</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div><label style={lab}>Name</label><input style={inp} value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} /></div>
            <div><label style={lab}>Email</label><input type="email" style={inp} value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} /></div>
            <div><label style={lab}>Password</label><input type="text" style={inp} value={newForm.password} onChange={(e) => setNewForm({ ...newForm, password: e.target.value })} /></div>
            <div>
              <label style={lab}>Role</label>
              <select style={inp} value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value as "admin" | "manager" })}>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", color: "var(--color-navy)" }}>
              <input
                type="checkbox"
                checked={newForm.receive_admin_notifications}
                onChange={(e) => setNewForm({ ...newForm, receive_admin_notifications: e.target.checked })}
              />
              Receive all admin notifications
            </label>
            <button className="btn-brass" onClick={addUser} disabled={busy}>{busy ? "Creating…" : "Create user"}</button>
            {msg && <p style={{ fontSize: 12.5, color: msg.startsWith("User") ? "var(--color-signal)" : "#a23c34", margin: 0 }}>{msg}</p>}
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--color-mist)", borderRadius: 8, fontSize: 12, color: "var(--color-steel)", lineHeight: 1.7 }}>
            Passwords stored as plain text in this scaffold. Upgrade to bcrypt in production.
          </div>
        </div>
      </div>
      <style>{`@media (max-width:900px){ .es-detail-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

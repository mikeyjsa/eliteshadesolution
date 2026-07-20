"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const RUN_ITEMS = [
  ["/admin",          "Dashboard",    "◈"],
  ["/admin/leads",    "CRM Pipeline", "▤"],
  ["/admin/invoices", "Invoices",     "₴"],
  ["/admin/schedule", "Schedule",     "▦"],
];

const CONFIG_ITEMS_ALL = [
  ["/admin/pricing",  "Pricing",       "✦"],
  ["/admin/content",  "Content (CMS)", "✎"],
  ["/admin/reports",  "Reports",       "▱"],
  ["/admin/google-analytics", "Google Analytics", "◔"],
  ["/admin/backups",  "Backups",       "⧉"],   // admin only
  ["/admin/users",    "Users",         "👤"],   // admin only
  ["/admin/settings", "Settings",      "⚙"],   // admin only
];

export default function AdminSidebar({
  userName,
  userRole,
  userId,
}: {
  userName?: string;
  userRole?: string;
  userId?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: userName ?? "", email: "", password: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const isAdmin = userRole === "admin";

  // Filter Users link for managers
  const configItems = CONFIG_ITEMS_ALL.filter(([href]) =>
    (href !== "/admin/users" && href !== "/admin/backups" && href !== "/admin/settings") || isAdmin
  );

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  async function saveProfile() {
    if (!profileForm.name && !profileForm.email && !profileForm.password) return;
    setProfileBusy(true);
    setProfileMsg("");
    const payload: Record<string, string> = {};
    if (profileForm.name.trim()) payload.name = profileForm.name;
    if (profileForm.email.trim()) payload.email = profileForm.email;
    if (profileForm.password.trim()) payload.password = profileForm.password;
    const r = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setProfileBusy(false);
    if (r.ok) {
      setProfileMsg("Profile updated — sign in again to see name changes.");
      setProfileForm((f) => ({ ...f, password: "" }));
    } else {
      setProfileMsg("Error saving.");
    }
  }

  const inp: React.CSSProperties = {
    fontSize: 13,
    padding: "8px 10px",
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 8,
    width: "100%",
    background: "rgba(255,255,255,.07)",
    color: "#fff",
  };

  return (
    <>
      <aside
        style={{
          width: 248,
          flex: "0 0 248px",
          background: "linear-gradient(180deg,#1c2733,#283746)",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        className="es-admin-aside"
      >
        {/* Brand */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <Link href="/admin" style={{ textDecoration: "none", display: "block" }}>
            <div className="display" style={{ fontSize: 19, color: "#fff", lineHeight: 1.05 }}>
              Elite Shade
            </div>
            <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "#7c8a96", marginTop: 5 }}>
              Admin CMS
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ padding: "14px 12px", flex: 1 }}>
          {/* Run */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".15em", textTransform: "uppercase", color: "#7c8a96", padding: "6px 12px" }}>Run</div>
            {RUN_ITEMS.map(([href, label, icon]) => {
              const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return (
                <Link key={href} href={href} className={`admin-link${active ? " active" : ""}`}>
                  <span style={{ width: 16, textAlign: "center", opacity: 0.8 }}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>
          {/* Configure */}
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".15em", textTransform: "uppercase", color: "#7c8a96", padding: "6px 12px" }}>Configure</div>
            {configItems.map(([href, label, icon]) => {
              const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return (
                <Link key={href} href={href} className={`admin-link${active ? " active" : ""}`}>
                  <span style={{ width: 16, textAlign: "center", opacity: 0.8 }}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Profile strip */}
        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          {userName && (
            <button
              onClick={() => { setShowProfile((s) => !s); setProfileMsg(""); }}
              title="Edit your profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                background: showProfile ? "rgba(201,162,75,.12)" : "none",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                padding: "8px 6px 8px",
                marginBottom: 8,
                borderBottom: "1px solid rgba(255,255,255,.08)",
                textAlign: "left",
                transition: "background .15s",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: showProfile ? "var(--color-brass)" : "rgba(201,162,75,.7)",
                  color: "#1c2733",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  transition: "background .15s",
                }}
              >
                {userName[0]}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
                <div style={{ fontSize: 10.5, color: "#7c8a96", textTransform: "uppercase", letterSpacing: ".06em" }}>{userRole}</div>
              </div>
              <span style={{ fontSize: 14, color: "#7c8a96" }}>{showProfile ? "▴" : "▾"}</span>
            </button>
          )}

          {/* Inline profile editor */}
          {showProfile && (
            <div style={{ marginBottom: 10, padding: "14px 10px 12px", background: "rgba(0,0,0,.25)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, color: "var(--color-brass)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 2 }}>My profile</div>
              <input
                placeholder={userName ?? "Display name"}
                defaultValue={userName}
                onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                style={inp}
              />
              <input
                type="email"
                placeholder="New email (leave blank to keep)"
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                style={inp}
              />
              <input
                type="password"
                placeholder="New password (leave blank to keep)"
                value={profileForm.password}
                onChange={(e) => setProfileForm((f) => ({ ...f, password: e.target.value }))}
                style={inp}
              />
              <button
                onClick={saveProfile}
                disabled={profileBusy}
                style={{ background: "var(--color-brass)", color: "#1c2733", border: "none", borderRadius: 8, padding: "8px 0", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: profileBusy ? 0.7 : 1 }}
              >
                {profileBusy ? "Saving…" : "Save profile"}
              </button>
              {profileMsg && (
                <p style={{ fontSize: 11.5, color: profileMsg.startsWith("Profile") ? "#a9e0bf" : "#ffb4ac", margin: 0, lineHeight: 1.4 }}>{profileMsg}</p>
              )}
            </div>
          )}

          <Link href="/" style={{ color: "#9fb0bd", fontSize: 12.5, textDecoration: "none", display: "block", padding: "4px 6px" }}>↗ View public site</Link>
          <button onClick={logout} style={{ background: "none", border: "none", color: "#9fb0bd", fontSize: 12.5, cursor: "pointer", padding: "4px 6px", textAlign: "left", width: "100%" }}>← Sign out</button>
        </div>
      </aside>
    </>
  );
}

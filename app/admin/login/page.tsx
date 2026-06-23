"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    if (res.ok) router.push("/admin");
    else {
      setErr("Incorrect email or password");
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1c2733,#283746)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 18, padding: "38px 34px", width: "100%", maxWidth: 380, boxShadow: "var(--shadow-lift)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Image src="/logo.png" alt="Elite Shade" width={180} height={120} style={{ width: 150, height: "auto" }} />
        </div>
        <h1 className="display" style={{ fontSize: 20, color: "var(--color-navy)", textAlign: "center", marginBottom: 4 }}>Staff sign-in</h1>
        <p style={{ textAlign: "center", color: "var(--color-steel)", fontSize: 13, marginBottom: 22 }}>Invite-only — owners and managers only.</p>
        <input
          type="email"
          autoFocus
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", fontSize: 15, padding: "12px 14px", border: "1px solid var(--color-line)", borderRadius: 10, marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{ width: "100%", fontSize: 15, padding: "12px 14px", border: "1px solid var(--color-line)", borderRadius: 10, marginBottom: 12 }}
        />
        {err && <p style={{ color: "#a23c34", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
        <button className="btn-brass" disabled={busy} style={{ width: "100%" }}>{busy ? "Checking…" : "Sign in →"}</button>
        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--color-mist)", borderRadius: 8, fontSize: 11.5, color: "var(--color-steel)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--color-navy)" }}>Scaffold accounts:</strong><br />
          owner@eliteshade.co.za / eliteshade<br />
          partner@eliteshade.co.za / partner123
        </div>
      </form>
    </div>
  );
}

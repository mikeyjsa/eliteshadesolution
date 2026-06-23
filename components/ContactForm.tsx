"use client";
import { useState } from "react";
import { gtagEvent } from "@/lib/gtag";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", suburb: "", message: "" });
  const [state, setState] = useState<null | "sending" | "done">(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (res.ok) gtagEvent("contact_submitted");
    setState(res.ok ? "done" : null);
  }

  const inp: React.CSSProperties = { fontSize: 14, padding: "11px 13px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%", background: "#fff" };

  if (state === "done")
    return (
      <div className="card" style={{ padding: 28, borderLeft: "4px solid var(--color-signal)" }}>
        <h3 className="display" style={{ color: "var(--color-navy)", fontSize: 20 }}>Thanks — we&apos;ll be in touch ✓</h3>
        <p style={{ color: "var(--color-steel)", margin: "8px 0 0" }}>
          One of the owners will reply shortly. For a faster price, try the instant calculator.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input required placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inp} />
        <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={inp} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} style={inp} />
        <input placeholder="Suburb" value={f.suburb} onChange={(e) => setF({ ...f, suburb: e.target.value })} style={inp} />
      </div>
      <textarea placeholder="How can we help?" rows={4} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} style={{ ...inp, resize: "vertical" }} />
      <button className="btn-brass" disabled={state === "sending"} style={{ alignSelf: "flex-start" }}>
        {state === "sending" ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}

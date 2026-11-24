"use client";
import { useState } from "react";
import { gtagEvent } from "@/lib/gtag";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", suburb: "", message: "", website: "" });
  const [state, setState] = useState<null | "sending" | "done">(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (res.ok) {
      gtagEvent("contact_submitted");
      setState("done");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "We could not send your message. Please try again or email us directly.");
      setState(null);
    }
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
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="es-form-grid">
        <Field label="Name" htmlFor="contact-name"><input id="contact-name" name="name" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inp} /></Field>
        <Field label="Email" htmlFor="contact-email"><input id="contact-email" name="email" required type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={inp} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="es-form-grid">
        <Field label="Phone" htmlFor="contact-phone"><input id="contact-phone" name="phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} style={inp} /></Field>
        <Field label="Suburb" htmlFor="contact-suburb"><input id="contact-suburb" name="suburb" autoComplete="address-level2" value={f.suburb} onChange={(e) => setF({ ...f, suburb: e.target.value })} style={inp} /></Field>
      </div>
      <Field label="How can we help?" htmlFor="contact-message"><textarea id="contact-message" name="message" rows={4} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} style={{ ...inp, resize: "vertical" }} /></Field>
      {error && <p role="alert" style={{ color: "#a23c34", fontSize: 13, margin: 0 }}>{error}</p>}
      <button className="btn-brass" disabled={state === "sending"} style={{ alignSelf: "flex-start" }}>
        {state === "sending" ? "Sending…" : "Send message →"}
      </button>
      <p style={{ margin: 0, fontSize: 12, color: "var(--color-steel)" }}>We use your details only to respond to this enquiry. Typical response: within one business day.</p>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--color-navy)", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { dateZA } from "@/lib/format";
import type { Settings, EmailLog } from "@/lib/types";

type Tab = "company" | "email" | "templates" | "access" | "outbox";

export default function SettingsForm({ settings, emails }: { settings: Settings; emails: EmailLog[] }) {
  const [s, setS] = useState(settings);
  const [tab, setTab] = useState<Tab>("company");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function set<K extends keyof Settings>(k: K, v: Settings[K]) { setS({ ...s, [k]: v }); setSaved(false); }
  function setTpl(key: string, field: "subject" | "body", v: string) {
    setS({ ...s, email_templates: { ...s.email_templates, [key]: { ...s.email_templates[key], [field]: v } } });
    setSaved(false);
  }
  async function save() {
    setBusy(true);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  const inp: React.CSSProperties = { fontSize: 14, padding: "9px 12px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%" };
  const lab: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 };
  const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--color-line)", borderRadius: 14, padding: 22, marginBottom: 18 };
  const emailProvider = s.email_provider || (s.resend_api_key?.trim() ? "resend" : "outbox");
  const mailStatus = emailProvider === "smtp"
    ? (s.smtp_host?.trim() && s.smtp_user?.trim() ? "smtp_live" : "smtp_incomplete")
    : emailProvider === "resend"
      ? (s.resend_api_key?.trim() ? "resend_live" : "resend_incomplete")
      : "outbox";

  const tabs: { key: Tab; label: string }[] = [
    { key: "company", label: "Company" },
    { key: "email", label: "Email" },
    { key: "templates", label: "Templates" },
    { key: "access", label: "Access" },
    { key: "outbox", label: `Outbox (${emails.length})` },
  ];

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--color-line)", background: tab === t.key ? "var(--color-navy)" : "#fff", color: tab === t.key ? "#fff" : "var(--color-navy)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".03em" }}>{t.label}</button>
        ))}
      </div>

      {tab === "company" && (
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Company &amp; VAT</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="es-form-grid">
            <div><label style={lab}>Company name</label><input style={inp} value={s.company_name} onChange={(e) => set("company_name", e.target.value)} /></div>
            <div><label style={lab}>VAT number</label><input style={inp} value={s.vat_number} onChange={(e) => set("vat_number", e.target.value)} /></div>
            <div><label style={lab}>WhatsApp number</label><input style={inp} value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--color-navy)" }}>
                <input type="checkbox" checked={s.vat_enabled} onChange={(e) => set("vat_enabled", e.target.checked)} /> Charge VAT @ 15%
              </label>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>Company address (appears on invoices)</label>
              <input style={inp} value={s.company_address} onChange={(e) => set("company_address", e.target.value)} placeholder="Cape Town, Western Cape, South Africa" />
            </div>
            <div>
              <label style={lab}>Facebook page URL</label>
              <input style={inp} value={s.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/yourpage" />
            </div>
            <div>
              <label style={lab}>Instagram profile URL</label>
              <input style={inp} value={s.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/yourprofile" />
            </div>
            <div><label style={lab}>Sales contact name</label><input style={inp} value={s.sales_name ?? ""} onChange={(e) => set("sales_name", e.target.value)} /></div>
            <div><label style={lab}>Sales contact role</label><input style={inp} value={s.sales_role ?? ""} onChange={(e) => set("sales_role", e.target.value)} placeholder="Sales" /></div>
            <div><label style={lab}>Sales contact phone</label><input style={inp} value={s.sales_phone ?? ""} onChange={(e) => set("sales_phone", e.target.value)} /></div>
            <div><label style={lab}>Sales WhatsApp (E.164)</label><input style={inp} value={s.sales_whatsapp ?? ""} onChange={(e) => set("sales_whatsapp", e.target.value)} placeholder="27676182422" /></div>
            <div><label style={lab}>Marketing contact name</label><input style={inp} value={s.marketing_name ?? ""} onChange={(e) => set("marketing_name", e.target.value)} /></div>
            <div><label style={lab}>Marketing contact role</label><input style={inp} value={s.marketing_role ?? ""} onChange={(e) => set("marketing_role", e.target.value)} placeholder="Marketing / Online sales" /></div>
            <div><label style={lab}>Marketing contact phone</label><input style={inp} value={s.marketing_phone ?? ""} onChange={(e) => set("marketing_phone", e.target.value)} /></div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>Customer payment mode</label>
              <select style={{ ...inp, maxWidth: 360 }} value={s.payment_mode || "payfast_and_eft"} onChange={(e) => set("payment_mode", e.target.value as Settings["payment_mode"])}>
                <option value="payfast_and_eft">PayFast + EFT</option>
                <option value="eft_only">EFT only</option>
              </select>
              <p style={{ fontSize: 12, color: "var(--color-steel)", margin: "5px 0 0" }}>
                Switch to EFT only until your live gateway is active. The public pay page, invoice wording, and quote acceptance flow will follow this setting.
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>EFT bank details (shown on the pay page and deposit invoice email)</label>
              <textarea
                style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
                rows={4}
                value={s.eft_details ?? ""}
                onChange={(e) => set("eft_details", e.target.value)}
                placeholder={"Bank: FNB\nAccount name: Elite Shade Solutions\nAccount number: 630 123 4567\nBranch code: 250 655"}
              />
              <p style={{ fontSize: 12, color: "var(--color-steel)", margin: "5px 0 0" }}>
                One detail per line. Clients paying by EFT see these plus their invoice number as reference.
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>PayGate details</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="es-form-grid">
                <input style={inp} value={s.paygate_merchant_id ?? ""} onChange={(e) => set("paygate_merchant_id", e.target.value)} placeholder="Merchant ID" />
                <input style={inp} value={s.paygate_merchant_key ?? ""} onChange={(e) => set("paygate_merchant_key", e.target.value)} placeholder="Merchant key" />
                <input style={inp} value={s.paygate_passphrase ?? ""} onChange={(e) => set("paygate_passphrase", e.target.value)} placeholder="Passphrase" />
                <input style={inp} value={s.paygate_return_url ?? ""} onChange={(e) => set("paygate_return_url", e.target.value)} placeholder="Return URL" />
                <div style={{ gridColumn: "1 / -1" }}>
                  <input style={inp} value={s.paygate_notify_url ?? ""} onChange={(e) => set("paygate_notify_url", e.target.value)} placeholder="Notify / callback URL" />
                </div>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-steel)", margin: "5px 0 0" }}>
                Stored in Settings so PayGate can be switched on later without another code update.
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>Google Analytics Measurement ID</label>
              <input style={inp} value={s.ga_measurement_id} onChange={(e) => set("ga_measurement_id", e.target.value)} placeholder="G-XXXXXXXXXX (leave blank to disable)" />
              <p style={{ fontSize: 12, color: "var(--color-steel)", margin: "5px 0 0" }}>
                Enter your GA4 Measurement ID to enable tracking on the public site. Leave blank to disable.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "email" && (
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 4 }}>Email delivery</h3>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: mailStatus === "smtp_live" || mailStatus === "resend_live" ? "var(--color-signal)" : "var(--color-warn)", background: mailStatus === "smtp_live" || mailStatus === "resend_live" ? "#eef4f0" : "var(--color-brass-soft)", padding: "5px 12px", borderRadius: 20, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: mailStatus === "smtp_live" || mailStatus === "resend_live" ? "var(--color-signal)" : "var(--color-warn)" }} />
            {mailStatus === "smtp_live" ? "SMTP connected — mail sends live" : mailStatus === "smtp_incomplete" ? "SMTP selected — configuration incomplete" : mailStatus === "resend_live" ? "Resend connected — mail sends live" : mailStatus === "resend_incomplete" ? "Resend selected — API key missing" : "Outbox only — mail is queued locally"}
          </div>
          <label style={lab}>Delivery method</label>
          <select style={{ ...inp, maxWidth: 360, marginBottom: 16 }} value={emailProvider} onChange={(e) => set("email_provider", e.target.value as Settings["email_provider"])}>
            <option value="outbox">Outbox only</option>
            <option value="smtp">SMTP (Afrihost / mailbox server)</option>
            <option value="resend">Resend API</option>
          </select>
          {emailProvider === "smtp" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 12 }} className="es-form-grid">
                <div>
                  <label style={lab}>SMTP host</label>
                  <input style={inp} value={s.smtp_host ?? ""} onChange={(e) => set("smtp_host", e.target.value)} placeholder="mail.yourdomain.co.za" />
                </div>
                <div>
                  <label style={lab}>SMTP port</label>
                  <input type="number" style={inp} value={s.smtp_port ?? 587} onChange={(e) => set("smtp_port", Number(e.target.value) as Settings["smtp_port"])} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="es-form-grid">
                <div>
                  <label style={lab}>SMTP username</label>
                  <input style={inp} value={s.smtp_user ?? ""} onChange={(e) => set("smtp_user", e.target.value)} placeholder="sales@yourdomain.co.za" />
                </div>
                <div>
                  <label style={lab}>SMTP password</label>
                  <input type="password" style={inp} value={s.smtp_pass ?? ""} onChange={(e) => set("smtp_pass", e.target.value)} placeholder="Mailbox password" />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--color-navy)", marginTop: 14 }}>
                <input type="checkbox" checked={!!s.smtp_secure} onChange={(e) => set("smtp_secure", e.target.checked)} /> Use secure SMTP / SSL
              </label>
              <p style={{ fontSize: 12, color: "var(--color-steel)", marginTop: 8, marginBottom: 16 }}>
                Use your Afrihost mailbox SMTP details here. Common ports are 465 with secure SMTP on, or 587 with secure SMTP off and STARTTLS negotiated by the server.
              </p>
            </>
          )}
          {emailProvider === "resend" && (
            <>
          <label style={lab}>Resend API key</label>
          <input style={{ ...inp, marginBottom: 8 }} value={s.resend_api_key} onChange={(e) => set("resend_api_key", e.target.value)} placeholder="re_xxxxxxxx (leave blank to keep using the Outbox)" />
          <p style={{ fontSize: 12, color: "var(--color-steel)", marginTop: 0, marginBottom: 16 }}>Get a key at resend.com. Until one is set, every estimate/invoice email is saved to the Outbox tab instead of being sent — nothing is lost.</p>
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }} className="es-form-grid">
            <div>
              <label style={lab}>From address</label>
              <input style={inp} value={s.email_from} onChange={(e) => set("email_from", e.target.value)} />
            </div>
            <div>
              <label style={lab}>Sales inbox</label>
              <input style={inp} value={s.sales_email ?? ""} onChange={(e) => set("sales_email", e.target.value)} placeholder="sales@yourdomain.co.za" />
            </div>
            <div>
              <label style={lab}>Info inbox</label>
              <input style={inp} value={s.info_email ?? ""} onChange={(e) => set("info_email", e.target.value)} placeholder="info@yourdomain.co.za" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>Extra notification emails</label>
              <textarea
                style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
                rows={3}
                value={s.notification_emails ?? ""}
                onChange={(e) => set("notification_emails", e.target.value)}
                placeholder={"info@yourdomain.co.za\nowner@yourdomain.co.za"}
              />
              <p style={{ fontSize: 12, color: "var(--color-steel)", margin: "5px 0 0" }}>
                One email per line or comma-separated. Website enquiries and quote notifications are sent to these addresses, with <code>info@</code> used by default.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Email templates</h3>
          {Object.entries(s.email_templates).map(([key, tpl]) => (
            <div key={key} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--color-mist)" }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-brass)", fontWeight: 700, marginBottom: 8 }}>{key}</div>
              <input style={{ ...inp, marginBottom: 8 }} value={tpl.subject} onChange={(e) => setTpl(key, "subject", e.target.value)} placeholder="Subject" />
              <textarea style={{ ...inp, resize: "vertical" }} rows={2} value={tpl.body} onChange={(e) => setTpl(key, "body", e.target.value)} placeholder="Body" />
            </div>
          ))}
          <p style={{ fontSize: 12, color: "var(--color-steel)", margin: 0 }}>Variables like <code>{"{{name}}"}</code>, <code>{"{{range}}"}</code>, <code>{"{{total}}"}</code>, <code>{"{{date}}"}</code>, <code>{"{{paylink}}"}</code> are filled automatically.</p>
        </div>
      )}

      {tab === "access" && (
        <div style={card}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 14 }}>Access</h3>
          <label style={lab}>Admin password</label>
          <input style={{ ...inp, maxWidth: 280 }} value={s.admin_password} onChange={(e) => set("admin_password", e.target.value)} />
          <p style={{ fontSize: 12, color: "var(--color-steel)", marginTop: 8 }}>Shared owner password (scaffold). Production swaps to per-user accounts with 2FA.</p>
        </div>
      )}

      {tab === "outbox" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", margin: 0 }}>Outbox</h3>
            <span style={{ fontSize: 12.5, color: "var(--color-steel)" }}>Every email the system has produced</span>
          </div>
          {emails.length === 0 && <p style={{ color: "var(--color-steel)", fontSize: 14 }}>No emails yet. Submit a quote or generate an invoice to see them here.</p>}
          {emails.map((e) => (
            <details key={e.id} style={{ borderBottom: "1px solid var(--color-mist)", padding: "10px 0" }}>
              <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, listStyle: "none" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: "var(--color-navy)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject}</div>
                  <div style={{ fontSize: 12, color: "var(--color-steel)" }}>to {e.to} · {dateZA(e.sent_at)}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", padding: "3px 9px", borderRadius: 12, alignSelf: "center", color: e.status === "sent" ? "var(--color-signal)" : e.status === "failed" ? "#a23c34" : "var(--color-warn)", background: e.status === "sent" ? "#eef4f0" : e.status === "failed" ? "#fbeceb" : "var(--color-brass-soft)" }}>
                  {e.status === "queued" ? "Queued" : e.status}
                </span>
              </summary>
              {e.html
                ? <iframe srcDoc={e.html} style={{ width: "100%", height: 260, border: "none", borderRadius: 9, marginTop: 10 }} title="Email preview" />
                : <p style={{ fontSize: 13, color: "var(--color-ink)", whiteSpace: "pre-wrap", margin: "10px 0 0", background: "var(--color-mist)", padding: "12px 14px", borderRadius: 9 }}>{e.body}</p>
              }
            </details>
          ))}
        </div>
      )}

      {tab !== "outbox" && (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn-brass" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
          {saved && <span style={{ color: "var(--color-signal)", fontSize: 13.5, fontWeight: 600 }}>✓ Saved</span>}
        </div>
      )}
      <style>{`@media (max-width:560px){ .es-form-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

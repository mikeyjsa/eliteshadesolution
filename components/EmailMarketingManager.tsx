"use client";

import { useState } from "react";
import type { EmailCampaign, EmailCampaignSend, MailingContact, MailingList } from "@/lib/types";

type Tab = "campaigns" | "lists" | "reports";

const EMPTY_HTML = `<!doctype html>
<html>
  <body style="margin:0;background:#f2f4f6;font-family:Arial,sans-serif;color:#1c2733;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#1c2733;padding:24px 32px;color:#ffffff;font-size:24px;font-weight:bold;">Elite Shade Solutions</td></tr>
          <tr><td style="padding:32px;line-height:1.6;">
            <h1 style="margin-top:0;">Hello {name}</h1>
            <p>Add your email content here.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const field: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--color-line)",
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  color: "var(--color-navy)",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "var(--color-navy)",
  letterSpacing: ".03em",
};

function freshCampaign(replyTo: string): EmailCampaign {
  const now = new Date().toISOString();
  return { id: "", name: "", subject: "", html: EMPTY_HTML, reply_to: replyTo, created_at: now, updated_at: now };
}

function freshList(): MailingList {
  const now = new Date().toISOString();
  return { id: "", name: "", contacts: [{ id: "new-1", name: "", email: "" }], created_at: now, updated_at: now };
}

function formatDate(value?: string) {
  if (!value) return "In progress";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected PDF."));
    reader.readAsDataURL(file);
  });
}

export default function EmailMarketingManager({
  initialLists,
  initialCampaigns,
  initialSends,
  salesEmail,
  infoEmail,
  testEmail: initialTestEmail,
  testName,
}: {
  initialLists: MailingList[];
  initialCampaigns: EmailCampaign[];
  initialSends: EmailCampaignSend[];
  salesEmail: string;
  infoEmail: string;
  testEmail: string;
  testName: string;
}) {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [lists, setLists] = useState(initialLists);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [sends, setSends] = useState(initialSends);
  const [campaign, setCampaign] = useState<EmailCampaign>(initialCampaigns[0] || freshCampaign(salesEmail));
  const [list, setList] = useState<MailingList>(initialLists[0] || freshList());
  const [selectedListId, setSelectedListId] = useState(initialLists[0]?.id || "");
  const [testEmail, setTestEmail] = useState(initialTestEmail);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [bulkContacts, setBulkContacts] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [openReport, setOpenReport] = useState(initialSends[0]?.id || "");

  async function call(body: Record<string, unknown>, method = "POST") {
    const response = await fetch("/api/email-marketing", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  }

  async function saveCampaign() {
    setBusy("campaign");
    setMessage("");
    try {
      const attachmentDataUrl = attachmentFile ? await fileToDataUrl(attachmentFile) : undefined;
      const data = await call({
        action: "save_campaign",
        ...campaign,
        list_id: selectedListId,
        attachment_data_url: attachmentDataUrl,
        attachment_name: attachmentFile?.name,
        remove_attachment: removeAttachment,
      });
      const saved = data.campaign as EmailCampaign;
      setCampaign(saved);
      setCampaigns((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setAttachmentFile(null);
      setRemoveAttachment(false);
      setMessage("Campaign saved. You can now send a test or choose a list.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save campaign.");
    } finally {
      setBusy("");
    }
  }

  async function sendTest() {
    if (!campaign.id) {
      setMessage("Save the campaign before sending a test.");
      return;
    }
    setBusy("test");
    setMessage("");
    try {
      const data = await call({ action: "test_campaign", campaign_id: campaign.id, to: testEmail, name: testName });
      setMessage(data.status === "queued" ? "Test saved to the Outbox. Configure SMTP to deliver it." : "Test email sent successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Test delivery failed.");
    } finally {
      setBusy("");
    }
  }

  async function sendCampaign() {
    const selected = lists.find((item) => item.id === selectedListId);
    if (!campaign.id || !selected) {
      setMessage("Save the campaign and choose a recipient list first.");
      return;
    }
    const attachmentNotice = campaign.attachment_name ? ` with ${campaign.attachment_name} attached` : "";
    if (!confirm(`Send “${campaign.name}” to ${selected.contacts.length} recipient${selected.contacts.length === 1 ? "" : "s"}${attachmentNotice}? This begins delivery immediately.`)) return;
    setBusy("send");
    setMessage("Sending the campaign. Keep this page open until the report is ready.");
    try {
      const data = await call({ action: "send_campaign", campaign_id: campaign.id, list_id: selected.id });
      const report = data.report as EmailCampaignSend;
      setSends((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      setCampaign((current) => ({ ...current, list_id: selected.id }));
      setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, list_id: selected.id } : item));
      setOpenReport(report.id);
      setTab("reports");
      setMessage(`Delivery complete: ${report.sent} sent, ${report.queued} queued, ${report.failed} failed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Campaign delivery could not be completed.");
    } finally {
      setBusy("");
    }
  }

  function importContacts() {
    const parsed = bulkContacts.split(/\r?\n/).flatMap((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      const parts = trimmed.includes(",") ? trimmed.split(",") : trimmed.split(/\s*;\s*/);
      const first = (parts[0] || "").trim();
      const second = (parts[1] || "").trim();
      const emailFirst = first.includes("@");
      return [{ id: `paste-${Date.now()}-${index}`, name: emailFirst ? second : first, email: emailFirst ? first : second }];
    });
    if (!parsed.length) return;
    setList((current) => ({
      ...current,
      contacts: [...current.contacts.filter((contact) => contact.name || contact.email), ...parsed],
    }));
    setBulkContacts("");
  }

  async function saveList() {
    setBusy("list");
    setMessage("");
    try {
      const data = await call({ action: "save_list", ...list });
      const saved = data.list as MailingList;
      setList(saved);
      setLists((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setSelectedListId(saved.id);
      setMessage(`List saved with ${saved.contacts.length} unique recipient${saved.contacts.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save list.");
    } finally {
      setBusy("");
    }
  }

  async function remove(type: "list" | "campaign", id: string) {
    if (!id || !confirm(`Delete this ${type}? Previous delivery reports will be retained.`)) return;
    setBusy(`delete-${id}`);
    try {
      await call({ type, id }, "DELETE");
      if (type === "list") {
        setLists((current) => current.filter((item) => item.id !== id));
        setList(freshList());
        if (selectedListId === id) setSelectedListId("");
      } else {
        setCampaigns((current) => current.filter((item) => item.id !== id));
        setCampaign(freshCampaign(salesEmail));
        setAttachmentFile(null);
        setRemoveAttachment(false);
      }
      setMessage(`${type === "list" ? "List" : "Campaign"} deleted.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete item.");
    } finally {
      setBusy("");
    }
  }

  const totalSent = sends.reduce((sum, item) => sum + item.sent, 0);
  const totalFailed = sends.reduce((sum, item) => sum + item.failed, 0);

  function selectCampaign(id: string) {
    const selected = campaigns.find((item) => item.id === id) || freshCampaign(salesEmail);
    setCampaign(selected);
    setSelectedListId(selected.list_id || "");
    setAttachmentFile(null);
    setRemoveAttachment(false);
  }

  function editAndResend(report: EmailCampaignSend) {
    const selected = campaigns.find((item) => item.id === report.campaign_id);
    if (!selected) {
      setMessage("This campaign was deleted, so its previous report cannot be reopened for editing.");
      return;
    }
    setCampaign(selected);
    setSelectedListId(lists.some((item) => item.id === report.list_id) ? report.list_id : selected.list_id || "");
    setAttachmentFile(null);
    setRemoveAttachment(false);
    setTab("campaigns");
    setMessage("Campaign reopened. Edit the HTML, attachment or recipient list, save it, then send it again.");
  }

  function editSelectedList() {
    const selected = lists.find((item) => item.id === selectedListId);
    if (!selected) return;
    setList(selected);
    setTab("lists");
    setMessage(`Editing “${selected.name}”. Save the list, then return to Create & Send to resend the campaign.`);
  }

  return (
    <div style={{ maxWidth: 1240 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 18 }} className="es-form-grid">
        {[
          ["Campaigns", campaigns.length],
          ["Recipient lists", lists.length],
          ["Successfully sent", totalSent],
          ["Failed", totalFailed],
        ].map(([title, value]) => (
          <div className="card" style={{ padding: 16 }} key={title}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--color-steel)", fontWeight: 800 }}>{title}</div>
            <div className="display" style={{ fontSize: 25, color: "var(--color-navy)", marginTop: 5 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 7, display: "flex", gap: 6, marginBottom: 18, overflowX: "auto" }}>
        {(["campaigns", "lists", "reports"] as Tab[]).map((item) => (
          <button key={item} onClick={() => { setTab(item); setMessage(""); }} className={tab === item ? "btn-brass" : "btn-ghost"} style={{ padding: "9px 16px", fontSize: 13, whiteSpace: "nowrap" }}>
            {item === "campaigns" ? "Create & Send" : item === "lists" ? "Email Lists" : "Send Reports"}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ marginBottom: 18, padding: "12px 15px", borderRadius: 9, background: "#e8eef3", color: "var(--color-navy)", fontSize: 13, fontWeight: 650 }}>{message}</div>
      )}

      {tab === "campaigns" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(360px,.85fr)", gap: 18, alignItems: "start" }} className="es-form-grid">
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <h3 className="display" style={{ fontSize: 17, margin: 0, color: "var(--color-navy)" }}>HTML campaign</h3>
              <select style={{ ...field, width: 230 }} value={campaign.id} onChange={(event) => selectCampaign(event.target.value)}>
                <option value="">New campaign</option>
                {campaigns.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="es-form-grid">
              <div><label style={label}>Internal campaign name</label><input style={field} value={campaign.name} onChange={(event) => setCampaign({ ...campaign, name: event.target.value })} placeholder="Spring installation offer" /></div>
              <div><label style={label}>Email subject</label><input style={field} value={campaign.subject} onChange={(event) => setCampaign({ ...campaign, subject: event.target.value })} placeholder="A cooler outdoor space for {name}" /></div>
              <div><label style={label}>From</label><input style={{ ...field, background: "#f1f4f6" }} value="sales@eliteshadesolutions.co.za" readOnly /></div>
              <div><label style={label}>Replies go to</label><select style={field} value={campaign.reply_to} onChange={(event) => setCampaign({ ...campaign, reply_to: event.target.value })}><option value={salesEmail}>{salesEmail}</option><option value={infoEmail}>{infoEmail}</option></select></div>
            </div>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "#f1f4f6" }}>
              <label style={label}>PDF attachment <span style={{ color: "var(--color-steel)", fontWeight: 500 }}>Optional, maximum 10 MB.</span></label>
              {campaign.attachment_name && !removeAttachment && !attachmentFile && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 12.5 }}>
                  <a href={campaign.attachment_url} target="_blank" rel="noreferrer" style={{ color: "var(--color-navy)", fontWeight: 800 }}>{campaign.attachment_name} ↗</a>
                  <button type="button" onClick={() => setRemoveAttachment(true)} style={{ border: 0, background: "none", color: "#a23c34", fontWeight: 800, cursor: "pointer" }}>Remove</button>
                </div>
              )}
              {removeAttachment && !attachmentFile && <p style={{ margin: "0 0 9px", color: "#a23c34", fontSize: 12.5 }}>The current PDF will be removed when you save.</p>}
              {attachmentFile && <p style={{ margin: "0 0 9px", color: "var(--color-navy)", fontSize: 12.5, fontWeight: 750 }}>Ready to upload: {attachmentFile.name}</p>}
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file && (file.type !== "application/pdf" || file.size > 10 * 1024 * 1024)) {
                    setMessage("Choose a valid PDF that is 10 MB or smaller.");
                    event.target.value = "";
                    return;
                  }
                  setAttachmentFile(file);
                  setRemoveAttachment(false);
                }}
                style={{ ...field, padding: "8px 10px" }}
              />
              <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--color-steel)" }}>The PDF is saved with this named campaign and included in tests and every resend.</p>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={label}>HTML source <span style={{ color: "var(--color-steel)", fontWeight: 500 }}>Use {"{name}"} wherever the recipient name should appear.</span></label>
              <textarea spellCheck={false} style={{ ...field, minHeight: 440, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, lineHeight: 1.55 }} value={campaign.html} onChange={(event) => setCampaign({ ...campaign, html: event.target.value })} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button onClick={() => remove("campaign", campaign.id)} disabled={!campaign.id || !!busy} style={{ border: 0, background: "none", color: "#a23c34", fontSize: 13, fontWeight: 800, cursor: campaign.id ? "pointer" : "default", opacity: campaign.id ? 1 : .4 }}>Delete campaign</button>
              <button className="btn-brass" onClick={saveCampaign} disabled={!!busy} style={{ padding: "10px 18px", fontSize: 13 }}>{busy === "campaign" ? "Saving…" : "Save campaign"}</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="card" style={{ padding: 18 }}>
              <h3 className="display" style={{ fontSize: 16, margin: "0 0 12px", color: "var(--color-navy)" }}>Email preview</h3>
              <iframe title="Campaign preview" sandbox="" srcDoc={campaign.html.replace(/\{\{?name\}?\}/gi, "Sample Customer")} style={{ width: "100%", height: 390, border: "1px solid var(--color-line)", borderRadius: 9, background: "#fff" }} />
            </div>
            <div className="card" style={{ padding: 18 }}>
              <h3 className="display" style={{ fontSize: 16, margin: "0 0 5px", color: "var(--color-navy)" }}>Test before sending</h3>
              <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "0 0 12px", lineHeight: 1.5 }}>A test uses your saved HTML and replaces {"{name}"} with your CMS profile name.</p>
              <div style={{ display: "flex", gap: 8 }}><input type="email" style={field} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /><button className="btn-ghost" onClick={sendTest} disabled={!!busy} style={{ padding: "9px 14px", whiteSpace: "nowrap" }}>{busy === "test" ? "Sending…" : "Send test"}</button></div>
            </div>
            <div className="card" style={{ padding: 18, borderTop: "4px solid var(--color-brass)" }}>
              <h3 className="display" style={{ fontSize: 16, margin: "0 0 12px", color: "var(--color-navy)" }}>Send to a list</h3>
              <select style={field} value={selectedListId} onChange={(event) => { setSelectedListId(event.target.value); setCampaign((current) => ({ ...current, list_id: event.target.value })); }}><option value="">Choose a saved list</option>{lists.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.contacts.length})</option>)}</select>
              <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--color-steel)" }}>You can edit the selected list under Email Lists before resending.</p>
              <button className="btn-ghost" onClick={editSelectedList} disabled={!selectedListId || !!busy} style={{ width: "100%", padding: "8px 13px", marginTop: 9, fontSize: 12.5 }}>Edit selected email list</button>
              <button className="btn-brass" onClick={sendCampaign} disabled={!!busy || !campaign.id || !selectedListId} style={{ width: "100%", padding: "11px 16px", marginTop: 10 }}>{busy === "send" ? "Sending campaign…" : "Send mass emailer"}</button>
            </div>
          </div>
        </div>
      )}

      {tab === "lists" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 18, alignItems: "start" }} className="es-form-grid">
          <div className="card" style={{ padding: 16 }}>
            <button className="btn-brass" onClick={() => setList(freshList())} style={{ width: "100%", padding: "9px 12px", marginBottom: 12 }}>Create new list</button>
            {lists.map((item) => <button key={item.id} onClick={() => setList(item)} style={{ width: "100%", textAlign: "left", border: 0, borderTop: "1px solid var(--color-mist)", background: list.id === item.id ? "#edf1f4" : "transparent", padding: "12px 9px", cursor: "pointer", color: "var(--color-navy)" }}><strong style={{ display: "block", fontSize: 13.5 }}>{item.name}</strong><span style={{ fontSize: 11.5, color: "var(--color-steel)" }}>{item.contacts.length} recipients</span></button>)}
          </div>
          <div className="card" style={{ padding: 22 }}>
            <h3 className="display" style={{ fontSize: 17, margin: "0 0 16px", color: "var(--color-navy)" }}>{list.id ? "Edit recipient list" : "New recipient list"}</h3>
            <label style={label}>List name</label><input style={field} value={list.name} onChange={(event) => setList({ ...list, name: event.target.value })} placeholder="Past quote customers" />
            <div style={{ marginTop: 18, padding: 14, background: "#f1f4f6", borderRadius: 10 }}>
              <label style={label}>Paste contacts in bulk</label>
              <textarea style={{ ...field, minHeight: 90, resize: "vertical" }} value={bulkContacts} onChange={(event) => setBulkContacts(event.target.value)} placeholder={"Name,email@example.com\nAnother Name,another@example.com"} />
              <button className="btn-ghost" onClick={importContacts} style={{ padding: "8px 13px", fontSize: 12.5, marginTop: 8 }}>Add pasted contacts</button>
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 38px", gap: 8, marginBottom: 7 }}><span style={label}>Name</span><span style={label}>Email address</span><span /></div>
              {list.contacts.map((contact, index) => (
                <div key={contact.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 38px", gap: 8, marginBottom: 8 }}>
                  <input style={field} value={contact.name} onChange={(event) => setList((current) => ({ ...current, contacts: current.contacts.map((item, currentIndex) => currentIndex === index ? { ...item, name: event.target.value } : item) }))} placeholder="Customer name" />
                  <input type="email" style={field} value={contact.email} onChange={(event) => setList((current) => ({ ...current, contacts: current.contacts.map((item, currentIndex) => currentIndex === index ? { ...item, email: event.target.value } : item) }))} placeholder="name@example.com" />
                  <button aria-label="Remove contact" onClick={() => setList((current) => ({ ...current, contacts: current.contacts.filter((_, currentIndex) => currentIndex !== index) }))} style={{ border: 0, background: "#f7e8e6", color: "#a23c34", borderRadius: 8, cursor: "pointer", fontWeight: 900 }}>×</button>
                </div>
              ))}
              <button className="btn-ghost" onClick={() => setList((current) => ({ ...current, contacts: [...current.contacts, { id: `new-${Date.now()}`, name: "", email: "" }] }))} style={{ padding: "8px 13px", fontSize: 12.5, marginTop: 4 }}>+ Add contact</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}><button onClick={() => remove("list", list.id)} disabled={!list.id || !!busy} style={{ border: 0, background: "none", color: "#a23c34", fontWeight: 800, opacity: list.id ? 1 : .4 }}>Delete list</button><button className="btn-brass" onClick={saveList} disabled={!!busy} style={{ padding: "10px 18px" }}>{busy === "list" ? "Saving…" : "Save list"}</button></div>
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {sends.length === 0 ? <p style={{ margin: 0, padding: 36, textAlign: "center", color: "var(--color-steel)" }}>No campaigns have been sent yet.</p> : sends.map((report) => {
            const expanded = openReport === report.id;
            return <div key={report.id} style={{ borderBottom: "1px solid var(--color-mist)" }}>
              <button onClick={() => setOpenReport(expanded ? "" : report.id)} style={{ width: "100%", border: 0, background: expanded ? "#f7f9fa" : "#fff", padding: 18, cursor: "pointer", textAlign: "left", display: "grid", gridTemplateColumns: "minmax(220px,1.5fr) repeat(4,minmax(75px,.55fr)) auto", gap: 12, alignItems: "center" }} className="es-form-grid">
                <span><strong style={{ display: "block", color: "var(--color-navy)", fontSize: 14 }}>{report.campaign_name}</strong><small style={{ color: "var(--color-steel)" }}>{report.list_name} · {formatDate(report.completed_at || report.started_at)}</small></span>
                <span><small style={{ display: "block", color: "var(--color-steel)" }}>Total</small><strong>{report.total}</strong></span><span><small style={{ display: "block", color: "var(--color-steel)" }}>Sent</small><strong style={{ color: "#23764b" }}>{report.sent}</strong></span><span><small style={{ display: "block", color: "var(--color-steel)" }}>Queued</small><strong>{report.queued}</strong></span><span><small style={{ display: "block", color: "var(--color-steel)" }}>Failed</small><strong style={{ color: report.failed ? "#a23c34" : "inherit" }}>{report.failed}</strong></span><span>{expanded ? "▴" : "▾"}</span>
              </button>
              {expanded && <div style={{ padding: "0 18px 18px", background: "#f7f9fa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--color-steel)" }}>From {report.from} · Replies to {report.reply_to} · Subject: {report.subject}{report.attachment_name ? ` · PDF: ${report.attachment_name}` : ""}</div>
                  <button className="btn-ghost" onClick={() => editAndResend(report)} style={{ padding: "7px 12px", fontSize: 12 }}>Edit and resend</button>
                </div>
                <div style={{ overflowX: "auto", background: "#fff", border: "1px solid var(--color-line)", borderRadius: 9 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}><thead><tr>{["Name", "Email", "Status", "Time", "Detail"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--color-line)", color: "var(--color-steel)" }}>{heading}</th>)}</tr></thead><tbody>{report.recipients.map((recipient) => <tr key={`${report.id}-${recipient.email}`}><td style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-mist)" }}>{recipient.name || "—"}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-mist)" }}>{recipient.email}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-mist)", fontWeight: 800, color: recipient.status === "failed" ? "#a23c34" : recipient.status === "sent" ? "#23764b" : "#80621f" }}>{recipient.status}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-mist)" }}>{formatDate(recipient.sent_at)}</td><td style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-mist)", color: "var(--color-steel)" }}>{recipient.error || "—"}</td></tr>)}</tbody></table></div>
              </div>}
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

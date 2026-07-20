"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Content } from "@/lib/types";

// Block field definitions — drives the Page Blocks editor UI.
const BLOCK_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type: "text" | "textarea" | "json" }[] }> = {
  home_hero: {
    label: "Home — Hero section",
    fields: [
      { key: "headline", label: "Headline (use \\n for line breaks)", type: "textarea" },
      { key: "subheadline", label: "Subheadline", type: "textarea" },
      { key: "cta", label: "CTA button text", type: "text" },
    ],
  },
  home_stats: {
    label: "Home — Stats strip",
    fields: [{ key: "items", label: 'Stats JSON array: [{"n":"138","suffix":"+","label":"..."}]', type: "json" }],
  },
  home_usps: {
    label: 'Home — "Why Elite" cards',
    fields: [{ key: "items", label: 'Cards JSON array: [{"title":"...","desc":"..."}]', type: "json" }],
  },
  home_testimonials: {
    label: "Home — Testimonials",
    fields: [{ key: "items", label: 'Testimonials JSON array: [{"text":"...","name":"...","suburb":"..."}]', type: "json" }],
  },
  home_faq: {
    label: "Home — FAQ",
    fields: [{ key: "items", label: 'FAQ JSON array: [{"q":"...","a":"..."}]', type: "json" }],
  },
  contact_info: {
    label: "Contact — Details",
    fields: [
      { key: "sales_name", label: "Sales contact name", type: "text" },
      { key: "sales_role", label: "Sales contact role", type: "text" },
      { key: "sales_phone", label: "Sales contact phone", type: "text" },
      { key: "sales_whatsapp", label: "Sales WhatsApp number (E.164, e.g. 27821234567)", type: "text" },
      { key: "marketing_name", label: "Marketing contact name", type: "text" },
      { key: "marketing_role", label: "Marketing contact role", type: "text" },
      { key: "marketing_phone", label: "Marketing contact phone", type: "text" },
      { key: "sales_email", label: "Shared sales email", type: "text" },
      { key: "info_email", label: "Shared info email", type: "text" },
      { key: "areas", label: "Service areas", type: "textarea" },
    ],
  },
};

const EMPTY_DRAFT = { title: "", body: "", suburb: "", tag: "", excerpt: "" };

export default function ContentManager({ items }: { items: Content[] }) {
  const [tab, setTab] = useState<"gallery" | "post" | "blocks">("gallery");
  const router = useRouter();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editing, setEditing] = useState<Content | null>(null);
  const [busy, setBusy] = useState(false);

  const list = items.filter((i) => i.type === tab);
  const blocks = items.filter((i) => i.type === "block");
  const inp: React.CSSProperties = { fontSize: 14, padding: "9px 12px", border: "1px solid var(--color-line)", borderRadius: 9, width: "100%" };

  function switchTab(t: "gallery" | "post" | "blocks") {
    setTab(t);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  }

  function startEdit(it: Content) {
    setEditing(it);
    setDraft({
      title: it.title,
      body: it.body,
      suburb: it.meta.suburb ?? "",
      tag: it.meta.tag ?? "",
      excerpt: it.meta.excerpt ?? "",
    });
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  }

  async function save() {
    if (!draft.title.trim()) return;
    setBusy(true);
    const meta = tab === "gallery"
      ? { suburb: draft.suburb, tag: draft.tag || "Install" }
      : { excerpt: draft.excerpt };
    if (editing) {
      await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, title: draft.title, body: draft.body, meta }),
      });
    } else {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, title: draft.title, body: draft.body, meta }),
      });
    }
    setDraft(EMPTY_DRAFT);
    setEditing(null);
    setBusy(false);
    router.refresh();
  }

  async function toggle(it: Content) {
    await fetch("/api/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: it.id, published: !it.published }) });
    router.refresh();
  }
  async function remove(it: Content) {
    if (!confirm("Delete this item?")) return;
    await fetch("/api/content", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: it.id }) });
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["gallery", "post", "blocks"] as const).map((t) => (
          <button key={t} onClick={() => switchTab(t)} style={{ padding: "8px 18px", borderRadius: 9, border: "1px solid var(--color-line)", background: tab === t ? "var(--color-navy)" : "#fff", color: tab === t ? "#fff" : "var(--color-navy)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: ".04em" }}>
            {t === "gallery" ? "Gallery" : t === "post" ? "Blog / Guides" : "Page Blocks"}
          </button>
        ))}
      </div>

      {/* ── PAGE BLOCKS ── */}
      {tab === "blocks" && (
        <div>
          <div style={{ background: "var(--color-brass-soft)", borderLeft: "4px solid var(--color-brass)", padding: "12px 16px", borderRadius: "0 8px 8px 0", fontSize: 13.5, color: "#6b5524", marginBottom: 22 }}>
            Edit any section of the public site here. Changes take effect immediately on save. Use valid JSON for array fields (test with <a href="https://jsonlint.com" target="_blank" rel="noreferrer" style={{ color: "var(--color-warn)" }}>jsonlint.com</a>).
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {Object.entries(BLOCK_FIELDS).map(([slug, def]) => {
              const block = blocks.find((b) => b.slug === slug);
              return (
                <BlockEditor key={slug} slug={slug} label={def.label} fields={def.fields} block={block} inp={inp} onSaved={() => router.refresh()} />
              );
            })}
          </div>
        </div>
      )}

      {/* ── GALLERY / POSTS ── */}
      {tab !== "blocks" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="es-2col">
          <div className="card" style={{ padding: 22, alignSelf: "start", borderTop: editing ? "3px solid var(--color-brass)" : undefined }}>
            <h3 className="display" style={{ fontSize: 15, color: "var(--color-navy)", marginBottom: 12 }}>
              {editing ? `Edit: ${editing.title}` : `Add ${tab === "gallery" ? "gallery item" : "guide"}`}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inp} />
              {tab === "gallery" ? (
                <>
                  <input placeholder="Suburb" value={draft.suburb} onChange={(e) => setDraft({ ...draft, suburb: e.target.value })} style={inp} />
                  <input placeholder="Tag (Pool, Patio…)" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} style={inp} />
                  <textarea placeholder="Caption" rows={2} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ ...inp, resize: "vertical" }} />
                </>
              ) : (
                <>
                  <input placeholder="Excerpt" value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} style={inp} />
                  <textarea placeholder="Body (blank line between paragraphs)" rows={5} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ ...inp, resize: "vertical" }} />
                </>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-brass" onClick={save} disabled={busy}>
                  {busy ? "Saving…" : editing ? "Save changes" : "Add"}
                </button>
                {editing && <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.length === 0 && <p style={{ color: "var(--color-steel)", fontSize: 14 }}>Nothing here yet.</p>}
            {list.map((it) => (
              <div key={it.id} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: "var(--color-navy)" }}>{it.title}</strong>
                    <div style={{ fontSize: 12, color: "var(--color-steel)", marginTop: 2 }}>
                      {it.type === "gallery" ? `${it.meta.suburb || "—"} · ${it.meta.tag || ""}` : `/blog/${it.slug}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: it.published ? "var(--color-signal)" : "var(--color-steel)", background: it.published ? "#eef4f0" : "var(--color-mist)", padding: "3px 8px", borderRadius: 12, whiteSpace: "nowrap" }}>{it.published ? "Live" : "Draft"}</span>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <button onClick={() => startEdit(it)} style={{ ...linkBtn, color: "var(--color-warn)", fontWeight: 700 }}>Edit</button>
                  <button onClick={() => toggle(it)} style={linkBtn}>{it.published ? "Unpublish" : "Publish"}</button>
                  <button onClick={() => remove(it)} style={{ ...linkBtn, color: "#a23c34" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@media (max-width:760px){ .es-2col{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

function BlockEditor({
  slug, label, fields, block, inp, onSaved,
}: {
  slug: string;
  label: string;
  fields: { key: string; label: string; type: "text" | "textarea" | "json" }[];
  block: Content | undefined;
  inp: React.CSSProperties;
  onSaved: () => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.key] = block?.meta[f.key] ?? "";
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  function set(k: string, v: string) { setVals((p) => ({ ...p, [k]: v })); setSaved(false); setJsonError(null); }

  async function save() {
    // Validate JSON fields
    for (const f of fields) {
      if (f.type === "json") {
        try { JSON.parse(vals[f.key] || "[]"); } catch { setJsonError(`"${f.label}" is not valid JSON.`); return; }
      }
    }
    setBusy(true);
    const meta: Record<string, string> = { ...vals };
    const body = block
      ? { id: block.id, meta }
      : { type: "block", slug, title: label, meta };
    const method = block ? "PATCH" : "POST";
    await fetch("/api/content", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    setSaved(true);
    onSaved();
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 className="display" style={{ fontSize: 15, color: "var(--color-navy)", margin: 0 }}>{label}</h3>
        {!block && <span style={{ fontSize: 11, color: "var(--color-silver)", fontStyle: "italic" }}>Not yet saved</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map((f) => (
          <div key={f.key}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-navy)", display: "block", marginBottom: 5 }}>{f.label}</label>
            {f.type === "text" ? (
              <input style={inp} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            ) : (
              <textarea
                rows={f.type === "json" ? 5 : 3}
                style={{ ...inp, resize: "vertical", fontFamily: f.type === "json" ? "monospace" : "inherit", fontSize: f.type === "json" ? 12 : 14 }}
                value={vals[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
            {f.type === "json" && vals[f.key] && (() => {
              try {
                const arr = JSON.parse(vals[f.key]);
                return <div style={{ fontSize: 11.5, color: "var(--color-signal)", marginTop: 4 }}>✓ Valid JSON · {Array.isArray(arr) ? arr.length + " items" : "object"}</div>;
              } catch {
                return <div style={{ fontSize: 11.5, color: "#a23c34", marginTop: 4 }}>⚠ Invalid JSON</div>;
              }
            })()}
          </div>
        ))}
        {jsonError && <p style={{ color: "#a23c34", fontSize: 13, margin: 0 }}>{jsonError}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-brass" onClick={save} disabled={busy} style={{ padding: "9px 18px", fontSize: 13 }}>{busy ? "Saving…" : "Save block"}</button>
          {saved && <span style={{ fontSize: 13, color: "var(--color-signal)", fontWeight: 600 }}>✓ Saved — live on site</span>}
        </div>
      </div>
    </div>
  );
}

const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--color-steel)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 };

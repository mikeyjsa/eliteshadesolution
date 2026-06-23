"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingRate } from "@/lib/types";

export default function PricingEditor({ pricing, depositPct, vatEnabled }: { pricing: PricingRate[]; depositPct: number; vatEnabled: boolean }) {
  const [rates, setRates] = useState(pricing);
  const [deposit, setDeposit] = useState(depositPct);
  const [vat, setVat] = useState(vatEnabled);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function setRate(key: string, val: number) {
    setRates((rs) => rs.map((r) => (r.key === key ? { ...r, rate: val } : r)));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    await fetch("/api/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rates: rates.map((r) => ({ key: r.key, rate: r.rate })), deposit_pct: deposit, vat_enabled: vat }),
    });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  const groups: { key: PricingRate["group"]; title: string }[] = [
    { key: "structure", title: "Structure & tensioning hardware" },
    { key: "labour", title: "Labour" },
    { key: "custom", title: "Custom items" },
  ];
  const inp: React.CSSProperties = { width: 110, fontSize: 14, padding: "8px 10px", border: "1px solid var(--color-line)", borderRadius: 8, textAlign: "right" };

  const [newItem, setNewItem] = useState({ label: "", unit: "each", rate: 0 });
  async function addItem() {
    if (!newItem.label.trim()) return;
    await fetch("/api/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newItem) });
    setNewItem({ label: "", unit: "each", rate: 0 });
    router.refresh();
  }
  async function removeItem(key: string) {
    await fetch("/api/pricing", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    setRates((rs) => rs.filter((r) => r.key !== key));
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ background: "var(--color-brass-soft)", borderLeft: "4px solid var(--color-brass)", padding: "12px 16px", borderRadius: "0 8px 8px 0", fontSize: 13.5, color: "#6b5524", marginBottom: 22 }}>
        Every rate here feeds the live <b>/quote</b> calculator. Change a number and save — estimates update instantly. Net prices are fixed at Kalahari retail and aren&apos;t edited here.
      </div>

      {groups.map((g) => (
        <div key={g.key} className="card" style={{ padding: 22, marginBottom: 18 }}>
          <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 12 }}>{g.title}</h3>
          {rates.filter((r) => r.group === g.key).map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-mist)" }}>
              <div>
                <div style={{ fontSize: 14, color: "var(--color-navy)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-steel)" }}>{r.unit}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--color-steel)" }}>R</span>
                <input type="number" value={r.rate} onChange={(e) => setRate(r.key, +e.target.value)} style={inp} className="tnum" />
                {g.key === "custom" && <button onClick={() => removeItem(r.key)} title="Remove" style={{ background: "none", border: "none", color: "#a23c34", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>}
              </div>
            </div>
          ))}
          {g.key === "custom" && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
              <input placeholder="New item (e.g. Curved shade-port)" value={newItem.label} onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} style={{ flex: 1, minWidth: 180, fontSize: 14, padding: "8px 10px", border: "1px solid var(--color-line)", borderRadius: 8 }} />
              <input placeholder="unit" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} style={{ width: 80, fontSize: 14, padding: "8px 10px", border: "1px solid var(--color-line)", borderRadius: 8 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-steel)" }}>R</span>
                <input type="number" value={newItem.rate} onChange={(e) => setNewItem({ ...newItem, rate: +e.target.value })} style={inp} className="tnum" />
              </div>
              <button className="btn-ghost" onClick={addItem} style={{ padding: "8px 16px" }}>+ Add</button>
            </div>
          )}
          {g.key === "custom" && rates.filter((r) => r.group === "custom").length === 0 && (
            <p style={{ fontSize: 12.5, color: "var(--color-steel)", margin: "4px 0 0" }}>Add extras you sometimes charge (curved posts, longer chain, travel, removal of old structure…). They become one-click add items on every quote.</p>
          )}
        </div>
      ))}

      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <h3 className="display" style={{ fontSize: 16, color: "var(--color-navy)", marginBottom: 12 }}>Policy</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-mist)" }}>
          <div style={{ fontSize: 14, color: "var(--color-navy)" }}>Deposit to secure the sale</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min={0} max={100} value={deposit} onChange={(e) => { setDeposit(+e.target.value); setSaved(false); }} style={{ ...inp, width: 80 }} className="tnum" />
            <span style={{ color: "var(--color-steel)" }}>%</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0" }}>
          <div style={{ fontSize: 14, color: "var(--color-navy)" }}>Charge VAT @ 15%</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={vat} onChange={(e) => { setVat(e.target.checked); setSaved(false); }} />
            <span style={{ fontSize: 13.5, color: "var(--color-steel)" }}>{vat ? "On" : "Off"}</span>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="btn-brass" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save pricing"}</button>
        {saved && <span style={{ color: "var(--color-signal)", fontSize: 13.5, fontWeight: 600 }}>✓ Saved — calculator updated</span>}
      </div>
    </div>
  );
}

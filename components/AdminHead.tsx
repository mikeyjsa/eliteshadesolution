export default function AdminHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid var(--color-line)", padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
      <div>
        <div className="eyebrow" style={{ color: "var(--color-steel)" }}>{eyebrow}</div>
        <h1 className="display" style={{ fontSize: 24, color: "var(--color-navy)", margin: "4px 0 0" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>
    </div>
  );
}

/* Brand-relevant technical SVG illustrations — replace the role of stock photos
   with engineered diagrams that match the "engineered tension" identity. */

const NAVY = "#283746";
const STEEL = "#5b6b7a";
const SILVER = "#aab4bd";
const BRASS = "#c9a24b";
const MIST = "#e8ecef";

// Hyperbolic-paraboloid sail showing how a net covers an area + the corner fixings.
export function AnatomyDiagram() {
  return (
    <svg viewBox="0 0 480 320" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="an-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={SILVER} stopOpacity="0.5" />
          <stop offset="1" stopColor={NAVY} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* posts */}
      <g stroke={NAVY} strokeWidth="6" strokeLinecap="round">
        <line x1="70" y1="90" x2="70" y2="270" />
        <line x1="410" y1="60" x2="410" y2="270" />
        <line x1="120" y1="250" x2="120" y2="270" />
        <line x1="370" y1="250" x2="370" y2="270" />
      </g>
      {/* sail */}
      <path d="M70 90 Q240 50 410 60 Q360 150 370 250 Q240 210 120 250 Q80 170 70 90 Z" fill="url(#an-sail)" />
      {/* tension lines */}
      <g stroke={BRASS} strokeWidth="2">
        <line x1="70" y1="90" x2="120" y2="250" />
        <line x1="410" y1="60" x2="370" y2="250" />
      </g>
      {/* corner callouts */}
      <g fontFamily="var(--font-body)" fontSize="11" fill={STEEL}>
        <circle cx="70" cy="90" r="6" fill={BRASS} />
        <circle cx="410" cy="60" r="6" fill={BRASS} />
        <circle cx="120" cy="250" r="6" fill={BRASS} />
        <circle cx="370" cy="250" r="6" fill={BRASS} />
        <text x="20" y="80">pad eye</text>
        <text x="420" y="55">turnbuckle</text>
        <text x="20" y="285">eye-bolt</text>
        <text x="330" y="285">chain</text>
      </g>
      <path d="M40 290 Q240 272 440 290" stroke={NAVY} strokeWidth="2.5" fill="none" opacity="0.6" />
    </svg>
  );
}

// Coverage square showing nominal net size + the ~0.8m stretch margin.
export function CoverageDiagram() {
  return (
    <svg viewBox="0 0 360 300" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      {/* stretch zone */}
      <rect x="40" y="40" width="280" height="220" rx="8" fill={BRASS} opacity="0.14" />
      <rect x="40" y="40" width="280" height="220" rx="8" fill="none" stroke={BRASS} strokeWidth="1.5" strokeDasharray="6 5" />
      {/* nominal net */}
      <rect x="78" y="74" width="204" height="152" rx="6" fill={NAVY} opacity="0.9" />
      <text x="180" y="156" textAnchor="middle" fontFamily="var(--font-display)" fontSize="15" fontWeight="700" fill="#fff">NET SIZE</text>
      {/* stretch label */}
      <g fontFamily="var(--font-body)" fontSize="11" fill={STEEL}>
        <text x="180" y="30" textAnchor="middle" fill={BRASS} fontWeight="700">+0.8m stretch per side</text>
        <text x="180" y="284" textAnchor="middle">area a net can comfortably cover after tensioning</text>
      </g>
      <g stroke={STEEL} strokeWidth="1">
        <line x1="282" y1="74" x2="320" y2="74" /><line x1="282" y1="40" x2="320" y2="40" />
      </g>
    </svg>
  );
}

// Side-by-side Standard vs Extreme fabric weave.
export function FabricDiagram({ accent = false }: { accent?: boolean }) {
  const c = accent ? BRASS : NAVY;
  return (
    <svg viewBox="0 0 200 140" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="200" height="140" rx="10" fill={MIST} />
      <g stroke={c} strokeWidth={accent ? 5 : 3} opacity="0.85">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={"h" + i} x1="20" y1={26 + i * 14} x2="180" y2={26 + i * 14} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={"v" + i} x1={20 + i * 16} y1="26" x2={20 + i * 16} y2="114" />
        ))}
      </g>
    </svg>
  );
}

// UV block donut.
export function UVDial({ pct = 90 }: { pct?: number }) {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <svg viewBox="0 0 140 140" style={{ width: 130, height: 130 }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r={r} fill="none" stroke={MIST} strokeWidth="14" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={BRASS} strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontFamily="var(--font-display)" fontSize="26" fontWeight="800" fill={NAVY}>{pct}%</text>
      <text x="70" y="86" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill={STEEL}>UV BLOCK</text>
    </svg>
  );
}

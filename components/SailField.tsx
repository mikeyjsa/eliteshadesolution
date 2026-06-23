// Custom hyperbolic-paraboloid "sail" field for the hero — taut tensioned
// fabric forms on slim posts, echoing the logo. Not a stock gradient block.
export default function SailField({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 760 560" className={className} xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="sailA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#aab4bd" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="sailB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b6b7a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#283746" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="sailC" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#c9a24b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f3ead4" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* posts */}
      <g stroke="#1c2733" strokeWidth="7" strokeLinecap="round">
        <line x1="120" y1="120" x2="120" y2="470" />
        <line x1="660" y1="70" x2="660" y2="470" />
        <line x1="400" y1="300" x2="400" y2="470" />
      </g>
      {/* post caps */}
      <g fill="#aab4bd">
        <circle cx="120" cy="120" r="9" />
        <circle cx="660" cy="70" r="9" />
        <circle cx="400" cy="300" r="8" />
      </g>

      {/* big navy sail */}
      <path d="M120 120 Q400 60 660 70 Q470 250 400 300 Q250 210 120 120 Z" fill="url(#sailB)">
        <animate attributeName="opacity" values="0.92;1;0.92" dur="7s" repeatCount="indefinite" />
      </path>
      {/* silver sail */}
      <path d="M120 120 Q260 250 400 300 Q230 360 130 430 Q110 280 120 120 Z" fill="url(#sailA)" />
      {/* brass accent sail */}
      <path d="M660 70 Q560 230 400 300 Q540 340 650 440 Q690 250 660 70 Z" fill="url(#sailC)" />

      {/* tension lines */}
      <g stroke="#283746" strokeWidth="1.4" strokeDasharray="3 5" opacity="0.5">
        <line x1="120" y1="120" x2="400" y2="300" />
        <line x1="660" y1="70" x2="400" y2="300" />
      </g>

      {/* ground line */}
      <path d="M70 472 Q400 446 700 472" stroke="#283746" strokeWidth="2.5" fill="none" opacity="0.7" />
    </svg>
  );
}

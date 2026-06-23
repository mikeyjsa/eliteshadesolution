/* Rich installation-scene SVG illustrations — replace stock photography with
   brand-matched rendered scenes that show the product in real context. */

// ── Pool scene: sail over a blue pool, Cape sky, lush greenery ──────────────
export function PoolScene({ colour = "#283746" }: { colour?: string }) {
  return (
    <svg viewBox="0 0 560 380" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b8fbf" />
          <stop offset="1" stopColor="#a8d0e8" />
        </linearGradient>
        <linearGradient id="ps-pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2980b9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#1a5276" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="ps-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colour} stopOpacity="0.75" />
          <stop offset="1" stopColor={colour} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="ps-deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4a882" />
          <stop offset="1" stopColor="#a07f60" />
        </linearGradient>
        <radialGradient id="ps-sun" cx="85%" cy="15%">
          <stop offset="0" stopColor="#ffd97d" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#c9a24b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* sky */}
      <rect width="560" height="380" fill="url(#ps-sky)" />
      <circle cx="476" cy="56" r="48" fill="url(#ps-sun)" />
      {/* clouds */}
      <g opacity="0.55" fill="#fff">
        <ellipse cx="120" cy="60" rx="48" ry="18" />
        <ellipse cx="155" cy="52" rx="34" ry="14" />
        <ellipse cx="88" cy="55" rx="28" ry="12" />
        <ellipse cx="310" cy="80" rx="38" ry="14" />
        <ellipse cx="342" cy="74" rx="26" ry="11" />
      </g>
      {/* mountains / backdrop */}
      <path d="M0 210 Q140 140 280 180 Q420 140 560 190 L560 380 L0 380 Z" fill="#2e4a38" opacity="0.4" />
      <path d="M0 240 Q100 200 220 220 Q340 180 560 230 L560 380 L0 380 Z" fill="#3a5a42" opacity="0.55" />
      {/* deck */}
      <path d="M0 285 Q280 268 560 285 L560 380 L0 380 Z" fill="url(#ps-deck)" />
      {/* deck tiles */}
      <g stroke="#b59570" strokeWidth="1" opacity="0.5">
        {[300,315,330,345,360,375].map(y=><line key={y} x1="0" y1={y} x2="560" y2={y} />)}
        {[0,70,140,210,280,350,420,490,560].map(x=><line key={x} x1={x} y1="285" x2={x} y2="380" />)}
      </g>
      {/* pool */}
      <ellipse cx="280" cy="300" rx="196" ry="56" fill="url(#ps-pool)" />
      <ellipse cx="280" cy="300" rx="196" ry="56" fill="none" stroke="#5dade2" strokeWidth="2" opacity="0.6" />
      {/* pool shimmer */}
      <g stroke="#7fb3d3" strokeWidth="1.5" opacity="0.45">
        <path d="M160 295 Q210 290 260 295" fill="none" />
        <path d="M200 308 Q250 302 310 308" fill="none" />
        <path d="M300 294 Q340 289 380 294" fill="none" />
      </g>
      {/* shadow under sail */}
      <ellipse cx="285" cy="298" rx="175" ry="46" fill="#1a3a50" opacity="0.25" />
      {/* poles */}
      <line x1="68" y1="96" x2="68" y2="285" stroke="#8a9da8" strokeWidth="6" strokeLinecap="round" />
      <line x1="492" y1="72" x2="492" y2="285" stroke="#8a9da8" strokeWidth="6" strokeLinecap="round" />
      <line x1="90" y1="270" x2="90" y2="285" stroke="#8a9da8" strokeWidth="6" strokeLinecap="round" />
      <line x1="470" y1="270" x2="470" y2="285" stroke="#8a9da8" strokeWidth="6" strokeLinecap="round" />
      {/* sail */}
      <path d="M68 96 Q280 38 492 72 Q470 200 280 248 Q90 200 68 96 Z" fill="url(#ps-sail)" />
      {/* sail texture / weave lines */}
      <path d="M68 96 Q280 38 492 72 Q470 200 280 248 Q90 200 68 96 Z" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.07" strokeDasharray="6 8" />
      {/* sheen */}
      <path d="M68 96 Q280 38 492 72 Q390 100 280 130 Q160 100 68 96 Z" fill="#fff" opacity="0.06" />
      {/* tension lines */}
      <g stroke="#c9a24b" strokeWidth="1.5" opacity="0.7">
        <line x1="68" y1="96" x2="90" y2="270" />
        <line x1="492" y1="72" x2="470" y2="270" />
      </g>
      {/* corner rings */}
      <g fill="#c9a24b">
        <circle cx="68" cy="96" r="5" />
        <circle cx="492" cy="72" r="5" />
        <circle cx="90" cy="270" r="5" />
        <circle cx="470" cy="270" r="5" />
      </g>
      {/* loungers */}
      <g fill="#d4b896" stroke="#c9a882" strokeWidth="1">
        <rect x="135" y="274" width="58" height="16" rx="5" />
        <rect x="340" y="274" width="58" height="16" rx="5" />
      </g>
      {/* foliage */}
      <g fill="#2d6a4f" opacity="0.85">
        <ellipse cx="22" cy="270" rx="28" ry="36" />
        <ellipse cx="42" cy="255" rx="22" ry="30" />
        <ellipse cx="8" cy="248" rx="18" ry="26" />
      </g>
      <g fill="#40916c" opacity="0.75">
        <ellipse cx="530" cy="265" rx="26" ry="34" />
        <ellipse cx="550" cy="252" rx="20" ry="28" />
      </g>
    </svg>
  );
}

// ── Patio scene: sail over a dining setting, timber deck ─────────────────────
export function PatioScene({ colour = "#454f57" }: { colour?: string }) {
  return (
    <svg viewBox="0 0 560 380" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="patio-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4a460" stopOpacity="0.6" />
          <stop offset="0.4" stopColor="#87ceeb" />
          <stop offset="1" stopColor="#bde0f5" />
        </linearGradient>
        <linearGradient id="patio-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colour} stopOpacity="0.72" />
          <stop offset="1" stopColor={colour} stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="patio-deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b6914" />
          <stop offset="1" stopColor="#6b4f10" />
        </linearGradient>
      </defs>
      {/* sky */}
      <rect width="560" height="380" fill="url(#patio-sky)" />
      {/* wall */}
      <rect x="0" y="0" width="560" height="280" fill="#e8dcc8" />
      <rect x="0" y="0" width="560" height="280" fill="none" stroke="#d4c5a8" strokeWidth="1" />
      {/* brick pattern */}
      <g stroke="#d4c5a8" strokeWidth="0.5" opacity="0.5">
        {[20,40,60,80,100,120,140,160,180,200,220,240,260].map((y,i)=>(
          <g key={y}>
            {[0,56,112,168,224,280,336,392,448,504,560].map((x)=>(
              <rect key={x} x={x+(i%2===0?0:28)} y={y} width="52" height="18" fill="none" stroke="#c9b9a0" strokeWidth="0.4" />
            ))}
          </g>
        ))}
      </g>
      {/* deck floor */}
      <rect x="0" y="264" width="560" height="116" fill="url(#patio-deck)" />
      <g stroke="#7a5c12" strokeWidth="1" opacity="0.6">
        {[0,28,56,84,112,140,168,196,224,252,280,308,336,364,392,420,448,476,504,532,560].map(x=>(
          <line key={x} x1={x} y1="264" x2={x} y2="380" />
        ))}
      </g>
      <g stroke="#5a4210" strokeWidth="0.4" opacity="0.4">
        {[278,292,306,320,334,348,362].map(y=><line key={y} x1="0" y1={y} x2="560" y2={y} />)}
      </g>
      {/* shadow under sail */}
      <ellipse cx="280" cy="290" rx="220" ry="30" fill="#3d2b0a" opacity="0.2" />
      {/* poles */}
      <line x1="52" y1="70" x2="52" y2="264" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      <line x1="508" y1="52" x2="508" y2="264" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      {/* wall anchors (left side) */}
      <rect x="0" y="132" width="18" height="12" rx="3" fill="#aab4bd" />
      <rect x="0" y="222" width="18" height="12" rx="3" fill="#aab4bd" />
      {/* sail — triangle variant */}
      <path d="M18 138 Q280 30 508 52 Q300 200 80 228 Z" fill="url(#patio-sail)" />
      <path d="M18 138 Q280 30 508 52 Q300 200 80 228 Z" fill="#fff" opacity="0.06" />
      {/* tension lines */}
      <g stroke="#c9a24b" strokeWidth="1.5" opacity="0.6">
        <line x1="18" y1="138" x2="52" y2="264" />
        <line x1="80" y1="228" x2="52" y2="264" />
        <line x1="508" y1="52" x2="508" y2="264" />
      </g>
      <g fill="#c9a24b">
        <circle cx="18" cy="138" r="5" /><circle cx="80" cy="228" r="5" />
        <circle cx="508" cy="52" r="5" />
      </g>
      {/* dining table */}
      <ellipse cx="280" cy="318" rx="100" ry="28" fill="#5a3e10" />
      <rect x="256" y="288" width="48" height="30" rx="4" fill="#6b4a14" />
      {/* chairs */}
      <g fill="#7a5518" stroke="#6b4a14" strokeWidth="1">
        <rect x="162" y="300" width="30" height="46" rx="6" />
        <rect x="368" y="300" width="30" height="46" rx="6" />
        <rect x="250" y="266" width="32" height="42" rx="6" />
        <rect x="278" y="340" width="32" height="42" rx="6" />
      </g>
      {/* table items */}
      <circle cx="268" cy="310" r="8" fill="#e0c090" opacity="0.8" />
      <circle cx="292" cy="310" r="8" fill="#e0c090" opacity="0.8" />
      <ellipse cx="280" cy="304" rx="16" ry="6" fill="#c9a24b" opacity="0.6" />
      {/* plants */}
      <g fill="#2d6a4f"><ellipse cx="12" cy="252" rx="20" ry="28" /><ellipse cx="548" cy="248" rx="20" ry="28" /></g>
    </svg>
  );
}

// ── Garden / play area: triangle sail over lawn, kids' play ──────────────────
export function GardenScene({ colour = "#cdbfa3" }: { colour?: string }) {
  return (
    <svg viewBox="0 0 560 380" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#87ceeb" />
          <stop offset="1" stopColor="#c8e8f5" />
        </linearGradient>
        <linearGradient id="gs-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colour} stopOpacity="0.7" />
          <stop offset="1" stopColor={colour} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="gs-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4caf50" />
          <stop offset="1" stopColor="#2e7d32" />
        </linearGradient>
      </defs>
      <rect width="560" height="380" fill="url(#gs-sky)" />
      {/* sun */}
      <circle cx="480" cy="50" r="40" fill="#fff9c4" opacity="0.9" />
      <circle cx="480" cy="50" r="28" fill="#ffeb3b" opacity="0.8" />
      {/* lawn */}
      <path d="M0 260 Q140 240 280 252 Q420 240 560 256 L560 380 L0 380 Z" fill="url(#gs-grass)" />
      {/* lawn texture */}
      <g stroke="#388e3c" strokeWidth="1" opacity="0.4">
        {[270,285,300,315,330,345].map(y=><path key={y} d={`M0 ${y} Q280 ${y-8} 560 ${y}`} fill="none" />)}
      </g>
      {/* hedge/shrubs background */}
      <g fill="#2e7d32" opacity="0.7">
        {[0,60,120,180,240,300,360,420,480].map(x=><ellipse key={x} cx={x+30} cy="258" rx="38" ry="22" />)}
      </g>
      <g fill="#388e3c" opacity="0.85">
        {[20,80,150,220,300,370,440,510].map(x=><ellipse key={x} cx={x+18} cy="251" rx="26" ry="16" />)}
      </g>
      {/* shadow */}
      <ellipse cx="250" cy="278" rx="160" ry="28" fill="#1b5e20" opacity="0.18" />
      {/* poles — triangle: 3 points */}
      <line x1="80" y1="88" x2="80" y2="260" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      <line x1="440" y1="66" x2="440" y2="260" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      <line x1="210" y1="240" x2="210" y2="260" stroke="#9aada8" strokeWidth="5" strokeLinecap="round" />
      {/* sail */}
      <path d="M80 88 Q260 32 440 66 Q340 196 210 240 Z" fill="url(#gs-sail)" />
      <path d="M80 88 Q260 32 440 66 Q340 196 210 240 Z" fill="#fff" opacity="0.08" />
      {/* tension lines */}
      <g stroke="#c9a24b" strokeWidth="1.5" opacity="0.65">
        <line x1="80" y1="88" x2="80" y2="260" />
        <line x1="440" y1="66" x2="440" y2="260" />
        <line x1="210" y1="240" x2="210" y2="260" />
      </g>
      <g fill="#c9a24b">
        <circle cx="80" cy="88" r="5" /><circle cx="440" cy="66" r="5" /><circle cx="210" cy="240" r="5" />
      </g>
      {/* play equipment */}
      {/* slide */}
      <rect x="300" y="270" width="12" height="60" rx="3" fill="#e57373" />
      <rect x="360" y="270" width="12" height="60" rx="3" fill="#e57373" />
      <rect x="294" y="270" width="84" height="10" rx="3" fill="#ef9a9a" />
      <path d="M356 280 L420 320" stroke="#ffb74d" strokeWidth="10" strokeLinecap="round" />
      {/* swing */}
      <line x1="110" y1="278" x2="130" y2="332" stroke="#8d6e63" strokeWidth="2" />
      <line x1="148" y1="278" x2="128" y2="332" stroke="#8d6e63" strokeWidth="2" />
      <rect x="115" y="326" width="28" height="10" rx="3" fill="#a1887f" />
      {/* trees */}
      <g>
        <rect x="492" y="230" width="8" height="35" fill="#795548" />
        <ellipse cx="496" cy="222" rx="24" ry="30" fill="#388e3c" />
        <ellipse cx="496" cy="210" rx="18" ry="22" fill="#4caf50" />
      </g>
    </svg>
  );
}

// ── Carport / parking scene ────────────────────────────────────────────────
export function CarportScene({ colour = "#283746" }: { colour?: string }) {
  return (
    <svg viewBox="0 0 560 380" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ea8c9" />
          <stop offset="1" stopColor="#b5d0e8" />
        </linearGradient>
        <linearGradient id="cp-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colour} stopOpacity="0.78" />
          <stop offset="1" stopColor={colour} stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="cp-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9e9e9e" />
          <stop offset="1" stopColor="#757575" />
        </linearGradient>
      </defs>
      <rect width="560" height="380" fill="url(#cp-sky)" />
      {/* building wall */}
      <rect x="0" y="0" width="180" height="310" fill="#d5c9b8" />
      <rect x="0" y="0" width="180" height="310" fill="none" stroke="#c4b6a2" strokeWidth="1" />
      {/* window */}
      <rect x="40" y="80" width="80" height="60" rx="3" fill="#8db4cc" stroke="#aaa" strokeWidth="1" />
      <line x1="80" y1="80" x2="80" y2="140" stroke="#bbb" strokeWidth="1" />
      <line x1="40" y1="110" x2="120" y2="110" stroke="#bbb" strokeWidth="1" />
      {/* door */}
      <rect x="45" y="210" width="80" height="100" rx="3" fill="#8b6914" stroke="#765a10" strokeWidth="1.5" />
      {/* concrete ground */}
      <rect x="0" y="308" width="560" height="72" fill="url(#cp-ground)" />
      <g stroke="#8a8a8a" strokeWidth="1" opacity="0.5">
        <line x1="0" y1="330" x2="560" y2="330" />
        <line x1="0" y1="352" x2="560" y2="352" />
        <line x1="280" y1="308" x2="280" y2="380" />
      </g>
      {/* shadow */}
      <ellipse cx="340" cy="316" rx="178" ry="22" fill="#424242" opacity="0.22" />
      {/* poles */}
      <line x1="180" y1="100" x2="180" y2="308" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      <line x1="510" y1="78" x2="510" y2="308" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      <line x1="200" y1="292" x2="200" y2="308" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      <line x1="490" y1="292" x2="490" y2="308" stroke="#9aada8" strokeWidth="6" strokeLinecap="round" />
      {/* sail */}
      <path d="M180 100 Q346 46 510 78 Q490 210 340 290 Q200 210 180 100 Z" fill="url(#cp-sail)" />
      <path d="M180 100 Q346 46 510 78 Q490 210 340 290 Q200 210 180 100 Z" fill="#fff" opacity="0.07" />
      {/* tension lines */}
      <g stroke="#c9a24b" strokeWidth="1.5" opacity="0.65">
        <line x1="180" y1="100" x2="200" y2="292" />
        <line x1="510" y1="78" x2="490" y2="292" />
      </g>
      <g fill="#c9a24b">
        <circle cx="180" cy="100" r="5" /><circle cx="510" cy="78" r="5" />
        <circle cx="200" cy="292" r="5" /><circle cx="490" cy="292" r="5" />
      </g>
      {/* car */}
      <g>
        <rect x="220" y="282" width="220" height="42" rx="8" fill="#37474f" />
        <path d="M248 282 Q268 248 312 244 Q378 244 408 282 Z" fill="#455a64" />
        {/* windows */}
        <path d="M264 280 Q278 258 308 255 Q340 255 352 280 Z" fill="#90caf9" opacity="0.8" />
        {/* wheels */}
        <circle cx="264" cy="324" r="16" fill="#263238" />
        <circle cx="264" cy="324" r="9" fill="#546e7a" />
        <circle cx="396" cy="324" r="16" fill="#263238" />
        <circle cx="396" cy="324" r="9" fill="#546e7a" />
        {/* lights */}
        <rect x="220" y="296" width="18" height="10" rx="2" fill="#ffeb3b" opacity="0.7" />
        <rect x="422" y="296" width="18" height="10" rx="2" fill="#ef5350" opacity="0.7" />
      </g>
    </svg>
  );
}

// ── Hero backdrop: abstract tension-structure architecture ────────────────────
export function ArchScene() {
  return (
    <svg viewBox="0 0 560 360" style={{ width: "100%", height: "auto", display: "block" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="arch-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c2733" />
          <stop offset="1" stopColor="#384a5b" />
        </linearGradient>
        <linearGradient id="arch-s1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b6b7a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#283746" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="arch-s2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a24b" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f3ead4" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="arch-s3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#aab4bd" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="560" height="360" fill="url(#arch-bg)" />
      {/* stars */}
      {[[56,38],[120,22],[188,55],[240,18],[312,42],[380,26],[448,58],[510,30],[82,80],[310,76]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={1.4} fill="#fff" opacity={0.4+Math.random()*0.4} />
      ))}
      {/* ground line */}
      <path d="M0 308 Q280 294 560 308 L560 360 L0 360 Z" fill="#1c2733" opacity="0.9" />
      {/* city silhouette */}
      <g fill="#1a2730" opacity="0.7">
        <rect x="0" y="260" width="40" height="60" />
        <rect x="34" y="240" width="28" height="80" />
        <rect x="58" y="268" width="36" height="52" />
        <rect x="460" y="255" width="40" height="65" />
        <rect x="496" y="238" width="30" height="82" />
        <rect x="520" y="262" width="40" height="58" />
      </g>
      {/* multiple overlapping sails — architectural composition */}
      <path d="M60 80 Q280 20 500 60 Q440 180 280 230 Q120 180 60 80 Z" fill="url(#arch-s1)" />
      <path d="M40 140 Q180 80 360 100 Q300 230 160 270 Q60 220 40 140 Z" fill="url(#arch-s3)" />
      <path d="M200 60 Q380 10 540 50 Q500 170 340 210 Q220 170 200 60 Z" fill="url(#arch-s2)" />
      {/* poles */}
      <g stroke="#aab4bd" strokeWidth="5" strokeLinecap="round" opacity="0.8">
        <line x1="60" y1="80" x2="60" y2="308" />
        <line x1="500" y1="60" x2="500" y2="308" />
        <line x1="280" y1="230" x2="280" y2="308" />
        <line x1="40" y1="140" x2="40" y2="308" />
        <line x1="360" y1="100" x2="360" y2="308" />
        <line x1="540" y1="50" x2="540" y2="308" />
      </g>
      {/* accent fittings */}
      <g fill="#c9a24b">
        <circle cx="60" cy="80" r="5" /><circle cx="500" cy="60" r="5" />
        <circle cx="280" cy="230" r="5" /><circle cx="40" cy="140" r="5" />
        <circle cx="360" cy="100" r="5" /><circle cx="540" cy="50" r="5" />
      </g>
    </svg>
  );
}

// Small inline scene tile for gallery grid
export function SceneTile({ type, colour }: { type: "pool"|"patio"|"garden"|"carport"; colour?: string }) {
  const hexMap: Record<string, string> = { Black:"#1c2733", Charcoal:"#454f57", Sand:"#cdbfa3", Silver:"#aab4bd" };
  const hex = colour ? hexMap[colour] ?? colour : "#283746";
  if (type === "pool")     return <PoolScene colour={hex} />;
  if (type === "patio")    return <PatioScene colour={hex} />;
  if (type === "garden")   return <GardenScene colour={hex} />;
  return <CarportScene colour={hex} />;
}

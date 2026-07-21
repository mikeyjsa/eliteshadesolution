"use client";

import { useState } from "react";
import type { GoogleAnalyticsGeography } from "@/lib/google-analytics";

const PROVINCES = [
  { name: "Western Cape", x: 142, y: 326, labelX: 96, labelY: 350 },
  { name: "Northern Cape", x: 164, y: 190, labelX: 102, labelY: 170 },
  { name: "Eastern Cape", x: 308, y: 326, labelX: 286, labelY: 354 },
  { name: "Free State", x: 302, y: 233, labelX: 268, labelY: 265 },
  { name: "KwaZulu-Natal", x: 424, y: 258, labelX: 402, labelY: 292 },
  { name: "North West", x: 278, y: 148, labelX: 240, labelY: 124 },
  { name: "Gauteng", x: 345, y: 158, labelX: 333, labelY: 190 },
  { name: "Mpumalanga", x: 421, y: 145, labelX: 405, labelY: 120 },
  { name: "Limpopo", x: 374, y: 86, labelX: 350, labelY: 61 },
];

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  tablet: "Tablet",
  smarttv: "Smart TV",
  other: "Other",
};

function number(value: number) {
  return new Intl.NumberFormat("en-ZA").format(Math.round(value));
}

function percent(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

export default function SouthAfricaAudienceMap({
  geography,
}: {
  geography: GoogleAnalyticsGeography;
}) {
  const [selectedName, setSelectedName] = useState("South Africa");
  const selected =
    selectedName === "South Africa"
      ? geography
      : geography.regions.find((region) => region.name === selectedName) || geography;
  const maxUsers = Math.max(1, ...geography.regions.map((region) => region.activeUsers));
  const deviceEntries = Object.entries(selected.devices).sort((a, b) => b[1] - a[1]);
  const deviceTotal = deviceEntries.reduce((sum, [, users]) => sum + users, 0);

  return (
    <div className="sa-audience">
      <div className="sa-map-shell">
        <div className="sa-map-header">
          <div>
            <span>South African audience</span>
            <strong>{number(geography.activeUsers)} active users</strong>
          </div>
          <button
            type="button"
            className={selectedName === "South Africa" ? "active" : ""}
            onClick={() => setSelectedName("South Africa")}
          >
            View all
          </button>
        </div>

        <svg viewBox="0 0 560 410" role="img" aria-label="Map of website visitors by South African province">
          <defs>
            <linearGradient id="sa-land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#eef1ee" />
              <stop offset="1" stopColor="#d9e0dc" />
            </linearGradient>
            <filter id="sa-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#1c2733" floodOpacity=".12" />
            </filter>
          </defs>
          <path
            d="M58 83 78 43 176 40 231 52 290 42 333 58 378 43 452 60 500 100 524 151 506 209 480 244 466 288 430 327 369 353 313 370 252 360 201 374 144 356 95 326 68 281 44 216 50 157Z"
            fill="url(#sa-land)"
            stroke="#a9b5b0"
            strokeWidth="2"
            filter="url(#sa-shadow)"
          />
          <path d="M350 235 367 218 386 226 390 247 373 263 354 254Z" fill="#fff" stroke="#b8c2bd" strokeWidth="1.5" />
          <text x="370" y="244" textAnchor="middle" className="sa-lesotho">LS</text>

          {PROVINCES.map((province) => {
            const data = geography.regions.find((region) => region.name === province.name);
            const users = data?.activeUsers || 0;
            const radius = users ? 8 + Math.sqrt(users / maxUsers) * 18 : 6;
            const active = selectedName === province.name;
            return (
              <g
                key={province.name}
                role="button"
                tabIndex={0}
                aria-label={`${province.name}: ${number(users)} active users`}
                className={`sa-marker ${active ? "active" : ""}`}
                onClick={() => setSelectedName(province.name)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedName(province.name);
                }}
              >
                <circle cx={province.x} cy={province.y} r={radius + 6} className="sa-marker-ring" />
                <circle cx={province.x} cy={province.y} r={radius} className="sa-marker-dot" />
                <text x={province.x} y={province.y + 4} textAnchor="middle" className="sa-marker-value">{number(users)}</text>
                <text x={province.labelX} y={province.labelY} className="sa-marker-label">{province.name}</text>
              </g>
            );
          })}
        </svg>
        <p>Bubble size represents active users in the last 30 days. Select a province to inspect its device mix.</p>
      </div>

      <aside className="sa-detail">
        <div className="sa-detail-title">
          <span>Selected area</span>
          <h4>{selectedName}</h4>
        </div>
        <div className="sa-mini-stats">
          <div><strong>{number(selected.activeUsers)}</strong><span>Users</span></div>
          <div><strong>{number(selected.sessions)}</strong><span>Sessions</span></div>
          <div><strong>{number(selected.views)}</strong><span>Page views</span></div>
        </div>
        <div className="sa-device-heading">Devices</div>
        {deviceEntries.length ? deviceEntries.map(([device, users]) => (
          <div className="sa-device" key={device}>
            <div><span>{DEVICE_LABELS[device] || device}</span><strong>{number(users)} · {percent(users, deviceTotal)}</strong></div>
            <div className="sa-device-track"><i style={{ width: percent(users, deviceTotal) }} /></div>
          </div>
        )) : (
          <div className="sa-empty">No visitors recorded for this area in the selected period.</div>
        )}
      </aside>

      <style jsx>{`
        .sa-audience{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(250px,.8fr);gap:18px}
        .sa-map-shell{border-radius:14px;background:linear-gradient(145deg,#f9faf8,#eef2ef);padding:18px 20px 14px;overflow:hidden}
        .sa-map-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .sa-map-header span,.sa-detail-title span{display:block;color:var(--color-steel);font-size:11px;text-transform:uppercase;letter-spacing:.09em;font-weight:700}
        .sa-map-header strong{display:block;color:var(--color-navy);font-family:var(--font-display);font-size:21px;margin-top:3px}
        .sa-map-header button{border:1px solid var(--color-line);background:#fff;color:var(--color-navy);border-radius:999px;padding:7px 12px;font:700 11px var(--font-display);text-transform:uppercase;letter-spacing:.04em;cursor:pointer}
        .sa-map-header button.active{background:var(--color-navy);color:#fff;border-color:var(--color-navy)}
        svg{display:block;width:100%;max-height:430px;margin:-5px auto -8px}
        .sa-lesotho{fill:#87928d;font:700 9px var(--font-sans)}
        .sa-marker{cursor:pointer;outline:none}
        .sa-marker-ring{fill:rgba(201,162,75,.13);stroke:rgba(201,162,75,.2);transition:r .2s,fill .2s}
        .sa-marker-dot{fill:var(--color-navy);stroke:#fff;stroke-width:2;transition:fill .2s,r .2s}
        .sa-marker:hover .sa-marker-dot,.sa-marker:focus .sa-marker-dot,.sa-marker.active .sa-marker-dot{fill:var(--color-brass)}
        .sa-marker:hover .sa-marker-ring,.sa-marker:focus .sa-marker-ring,.sa-marker.active .sa-marker-ring{fill:rgba(201,162,75,.3)}
        .sa-marker-value{fill:#fff;font:700 10px var(--font-sans);pointer-events:none}
        .sa-marker-label{fill:#56645f;font:700 10px var(--font-sans);pointer-events:none}
        .sa-map-shell p{margin:3px 0 0;color:var(--color-steel);font-size:11.5px;line-height:1.5}
        .sa-detail{border:1px solid var(--color-line);border-radius:14px;padding:20px;background:#fff}
        .sa-detail-title h4{font-family:var(--font-display);font-size:22px;color:var(--color-navy);margin:3px 0 18px}
        .sa-mini-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding-bottom:18px;border-bottom:1px solid var(--color-mist)}
        .sa-mini-stats div{background:var(--color-mist);border-radius:9px;padding:10px 8px}
        .sa-mini-stats strong,.sa-mini-stats span{display:block}
        .sa-mini-stats strong{color:var(--color-navy);font-size:16px}
        .sa-mini-stats span{color:var(--color-steel);font-size:9.5px;text-transform:uppercase;margin-top:2px}
        .sa-device-heading{font-size:11px;color:var(--color-steel);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 12px}
        .sa-device{margin-bottom:13px}
        .sa-device>div:first-child{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--color-navy)}
        .sa-device strong{font-size:11.5px}
        .sa-device-track{height:7px;background:var(--color-mist);border-radius:10px;margin-top:6px;overflow:hidden}
        .sa-device-track i{display:block;height:100%;min-width:3px;background:linear-gradient(90deg,var(--color-navy),var(--color-brass));border-radius:10px}
        .sa-empty{font-size:12.5px;line-height:1.6;color:var(--color-steel)}
        @media(max-width:900px){.sa-audience{grid-template-columns:1fr}.sa-detail{display:grid;grid-template-columns:1fr 1.5fr;column-gap:18px}.sa-mini-stats{grid-column:1/-1}.sa-device-heading{grid-column:1/-1}}
        @media(max-width:600px){.sa-map-shell{padding:15px 10px}.sa-map-header{padding:0 5px}svg{margin:0 auto}.sa-marker-label{font-size:9px}.sa-detail{display:block}.sa-mini-stats{grid-template-columns:1fr 1fr 1fr}}
      `}</style>
    </div>
  );
}

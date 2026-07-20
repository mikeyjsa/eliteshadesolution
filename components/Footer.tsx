import Link from "next/link";

// Social SVG icons
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

export default function Footer({
  facebookUrl = "",
  instagramUrl = "",
  salesName = "Jean-Pierre Miller",
  salesRole = "Sales",
  salesPhone = "067 618 2422",
  marketingName = "Michael Theron",
  marketingRole = "Marketing / Online sales",
  marketingPhone = "060 949 1197",
  salesEmail = "sales@eliteshadesolutions.co.za",
  infoEmail = "info@eliteshadesolutions.co.za",
}: {
  facebookUrl?: string;
  instagramUrl?: string;
  salesName?: string;
  salesRole?: string;
  salesPhone?: string;
  marketingName?: string;
  marketingRole?: string;
  marketingPhone?: string;
  salesEmail?: string;
  infoEmail?: string;
}) {
  const hasSocial = facebookUrl || instagramUrl;

  return (
    <footer style={{ background: "var(--color-navy-deep)", color: "#9fb0bd", padding: "56px 28px 32px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 40 }} className="es-foot-grid">
        <div>
          <div className="display" style={{ color: "#fff", fontSize: 22, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Elite Shade
          </div>
          <p className="eyebrow" style={{ color: "var(--color-brass)", marginTop: 6 }}>
            Engineered Shade. Exceptional Spaces.
          </p>
          <p style={{ fontSize: 13.5, maxWidth: 320, marginTop: 14, lineHeight: 1.7 }}>
            Premium Kalahari shade sails, engineered and installed for the
            Western Cape. Real prices online — no callback required.
          </p>
          {hasSocial && (
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noreferrer" className="es-social-icon">
                  <FacebookIcon />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="es-social-icon">
                  <InstagramIcon />
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          <h4 style={{ color: "#fff", fontSize: 12, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 14 }}>Explore</h4>
          {[
            ["/quote", "Get an estimate"],
            ["/shade-sails", "Shade sails"],
            ["/how-it-works", "How it works"],
            ["/gallery", "Gallery"],
            ["/blog", "Guides"],
          ].map(([h, l]) => (
            <Link key={h} href={h} style={{ display: "block", color: "#9fb0bd", textDecoration: "none", fontSize: 13.5, padding: "5px 0" }}>
              {l}
            </Link>
          ))}
        </div>
        <div>
          <h4 style={{ color: "#fff", fontSize: 12, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 14 }}>Reach us</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.9 }}>
            Cape Town, Western Cape<br />
            {salesName} · {salesRole} · {salesPhone}<br />
            {marketingName} · {marketingRole} · {marketingPhone}<br />
            {salesEmail}<br />
            {infoEmail}
          </p>
          {hasSocial && (
            <div style={{ marginTop: 12 }}>
              {facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer" style={{ display: "block", color: "#9fb0bd", textDecoration: "none", fontSize: 13, padding: "3px 0" }}>Facebook →</a>}
              {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" style={{ display: "block", color: "#9fb0bd", textDecoration: "none", fontSize: 13, padding: "3px 0" }}>Instagram →</a>}
            </div>
          )}
        </div>
      </div>
      <div className="guyline" style={{ maxWidth: 1240, margin: "36px auto 0" }} />
      <p style={{ maxWidth: 1240, margin: "16px auto 0", fontSize: 12, color: "#6f7f8c" }}>
        © {new Date().getFullYear()} Elite Shade Solutions · Cape Town. Prices shown are indicative estimates; final pricing confirmed after a free site survey.
      </p>
      <style>{`
        @media (max-width: 760px){ .es-foot-grid{ grid-template-columns: 1fr !important; gap: 28px !important; } }
        .es-social-icon{
          display:flex;align-items:center;justify-content:center;
          width:36px;height:36px;border-radius:50%;
          background:rgba(255,255,255,.1);color:#9fb0bd;
          text-decoration:none;transition:background .15s,color .15s;
        }
        .es-social-icon:hover{ background:var(--color-brass); color:#1c2733; }
      `}</style>
    </footer>
  );
}

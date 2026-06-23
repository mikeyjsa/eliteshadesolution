"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const LINKS = [
  { href: "/shade-sails", label: "Shade Sails" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "saturate(180%) blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--color-line)" : "1px solid transparent",
        transition: "all .25s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <Image src="/logo.png" alt="Elite Shade Solutions" width={210} height={140} style={{ height: 74, width: "auto" }} priority className="es-logo" />
        </Link>
        <nav className="es-desktop-nav" style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: "var(--color-navy)",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/quote" className="btn-brass" style={{ marginLeft: 8, padding: "0.6rem 1.2rem", fontSize: 13 }}>
            Get my estimate →
          </Link>
        </nav>
        <button
          className="es-mobile-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          style={{ marginLeft: "auto", display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--color-navy)", fontSize: 26 }}
        >
          ≡
        </button>
      </div>

      {open && (
        <div className="es-mobile-menu" style={{ background: "#fff", borderTop: "1px solid var(--color-line)", padding: "8px 20px 18px" }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "block", padding: "12px 4px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--color-navy)", textDecoration: "none", borderBottom: "1px solid var(--color-mist)" }}>
              {l.label}
            </Link>
          ))}
          <Link href="/quote" onClick={() => setOpen(false)} className="btn-brass" style={{ display: "block", textAlign: "center", marginTop: 14 }}>
            Get my estimate →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 880px) {
          .es-desktop-nav { display: none !important; }
          .es-mobile-toggle { display: block !important; }
          .es-logo { height: 58px !important; }
        }
        @media (min-width: 881px) {
          .es-mobile-menu { display: none !important; }
        }
      `}</style>
    </header>
  );
}

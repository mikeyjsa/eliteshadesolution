"use client";
import { useEffect, useRef, useState } from "react";

// Counts up to a target when scrolled into view.
export function Counter({ to, suffix = "", prefix = "", duration = 1400 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let settle: ReturnType<typeof setTimeout>;
    const run = () => {
      if (done.current) return;
      done.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(to * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // Guarantee the final value even if rAF is throttled (e.g. background tab).
      settle = setTimeout(() => setVal(to), duration + 250);
    };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) run(); }, { threshold: 0.3 });
      io.observe(el);
    }
    // If already in view on mount, run now; otherwise a fallback guarantees it animates.
    const r = el.getBoundingClientRect();
    if (r.top < (window.innerHeight || 800)) run();
    const fallback = setTimeout(run, 1500);

    return () => { io?.disconnect(); clearTimeout(fallback); clearTimeout(settle); };
  }, [to, duration]);

  return <span ref={ref} className="tnum">{prefix}{val.toLocaleString("en-ZA")}{suffix}</span>;
}

// Accordion FAQ.
export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="card" style={{ padding: 0, overflow: "hidden", borderColor: isOpen ? "var(--color-brass)" : "var(--color-line)" }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}
            >
              <span className="display" style={{ fontSize: 16.5, color: "var(--color-navy)" }}>{it.q}</span>
              <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: isOpen ? "var(--color-brass)" : "var(--color-mist)", color: isOpen ? "#fff" : "var(--color-navy)", display: "grid", placeItems: "center", fontSize: 16, transition: "all .2s", transform: isOpen ? "rotate(45deg)" : "none" }}>+</span>
            </button>
            <div style={{ maxHeight: isOpen ? 320 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
              <p style={{ padding: "0 22px 20px", margin: 0, color: "var(--color-steel)", fontSize: 15, lineHeight: 1.7 }}>{it.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

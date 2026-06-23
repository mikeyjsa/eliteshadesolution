"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Scroll-reveal: adds .in to any .reveal element as it enters the viewport.
// Hardened so content is NEVER left hidden — if IntersectionObserver doesn't
// fire (background tab, unsupported, etc.) a fallback reveals everything.
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!els.length) return;

    const show = (el: Element) => el.classList.add("in");

    // Reveal anything already within (or near) the viewport immediately.
    const revealInView = () => {
      const h = window.innerHeight || document.documentElement.clientHeight;
      for (const el of els) {
        if (el.classList.contains("in")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < h + 80 && r.bottom > -80) show(el);
      }
    };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io?.unobserve(e.target); } }),
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      els.forEach((el) => io!.observe(el));
    }

    revealInView();
    window.addEventListener("scroll", revealInView, { passive: true });

    // Safety net: never leave content hidden.
    const fallback = setTimeout(() => els.forEach(show), 1600);

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", revealInView);
      clearTimeout(fallback);
    };
  }, [pathname]);
  return null;
}

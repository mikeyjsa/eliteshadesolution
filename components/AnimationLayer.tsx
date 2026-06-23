"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function AnimationLayer() {
  const pathname = usePathname();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // ── Scroll progress bar ────────────────────────────────────────────────
    let bar = document.getElementById("scroll-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "scroll-progress";
      document.body.appendChild(bar);
    }
    const progressBar = bar;

    function updateProgress() {
      const scrolled = window.scrollY;
      const total = document.body.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      progressBar.style.width = pct + "%";
    }

    // ── Parallax on .hero-parallax elements ───────────────────────────────
    function updateParallax() {
      const els = document.querySelectorAll<HTMLElement>(".hero-parallax");
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight * 2) return;
        const offset = window.scrollY * 0.18;
        el.style.transform = `translateY(${offset}px)`;
      });
    }

    function onScroll() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateProgress();
        updateParallax();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
    updateParallax();

    // ── 3-D tilt on .tilt-card elements ───────────────────────────────────
    const tiltCards = document.querySelectorAll<HTMLElement>(".tilt-card");
    const tiltCleanups: (() => void)[] = [];

    tiltCards.forEach((card) => {
      function onMove(e: MouseEvent) {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) / (r.width / 2);
        const dy = (e.clientY - cy) / (r.height / 2);
        const rotX = (-dy * 7).toFixed(1);
        const rotY = (dx * 7).toFixed(1);
        card.style.setProperty("--rx", `${rotX}deg`);
        card.style.setProperty("--ry", `${rotY}deg`);
        card.style.transition = "transform 0.1s ease";
      }
      function onLeave() {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
      }
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      tiltCleanups.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    // ── Magnetic pull on .btn-brass elements ──────────────────────────────
    const magnets = document.querySelectorAll<HTMLElement>(".btn-brass");
    const magnetCleanups: (() => void)[] = [];

    magnets.forEach((btn) => {
      function onMove(e: MouseEvent) {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) * 0.28;
        const dy = (e.clientY - cy) * 0.28;
        btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
      }
      function onLeave() {
        btn.style.transform = "";
      }
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);
      magnetCleanups.push(() => {
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
      });
    });

    // ── Cursor spotlight on dark hero sections ────────────────────────────
    const heroes = document.querySelectorAll<HTMLElement>(".hero-spotlight");
    const heroCleanups: (() => void)[] = [];

    heroes.forEach((hero) => {
      const spot = document.createElement("div");
      spot.style.cssText = `
        position:absolute;pointer-events:none;
        width:420px;height:420px;border-radius:50%;
        background:radial-gradient(circle,rgba(201,162,75,.10) 0%,transparent 70%);
        transform:translate(-50%,-50%);transition:opacity .3s;opacity:0;
        top:0;left:0;z-index:1;
      `;
      const pos = getComputedStyle(hero).position;
      if (pos === "static") hero.style.position = "relative";
      hero.appendChild(spot);

      function onMove(e: MouseEvent) {
        const r = hero.getBoundingClientRect();
        spot.style.left = (e.clientX - r.left) + "px";
        spot.style.top = (e.clientY - r.top) + "px";
        spot.style.opacity = "1";
      }
      function onLeave() { spot.style.opacity = "0"; }

      hero.addEventListener("mousemove", onMove);
      hero.addEventListener("mouseleave", onLeave);
      heroCleanups.push(() => {
        hero.removeEventListener("mousemove", onMove);
        hero.removeEventListener("mouseleave", onLeave);
        spot.remove();
      });
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      tiltCleanups.forEach((fn) => fn());
      magnetCleanups.forEach((fn) => fn());
      heroCleanups.forEach((fn) => fn());
    };
  }, [pathname]);

  return null;
}

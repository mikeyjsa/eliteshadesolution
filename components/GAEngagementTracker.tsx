"use client";

import { useEffect } from "react";
import { gtagEvent } from "@/lib/gtag";

export default function GAEngagementTracker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href === "/quote" || href.startsWith("/quote?")) {
        gtagEvent("quote_cta_clicked", { link_text: link.textContent?.trim().slice(0, 80) || "quote" });
      } else if (href.startsWith("tel:")) {
        gtagEvent("phone_clicked");
      } else if (href.startsWith("mailto:")) {
        gtagEvent("email_clicked");
      } else if (href.includes("wa.me") || href.includes("whatsapp")) {
        gtagEvent("whatsapp_clicked");
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [enabled]);

  return null;
}

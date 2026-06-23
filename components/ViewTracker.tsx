"use client";
import { useEffect } from "react";

// Fires once on mount to log a "viewed" activity against a quote.
export default function ViewTracker({ quoteId, type }: { quoteId: string; type: string }) {
  useEffect(() => {
    if (!quoteId) return;
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId, type: "view", message: `${type} viewed.` }),
    }).catch(() => null); // silent — don't block the page
  }, [quoteId, type]);
  return null;
}

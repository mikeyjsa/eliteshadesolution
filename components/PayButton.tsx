"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayButton({ invoiceId }: { invoiceId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function pay() {
    setBusy(true);
    await fetch("/api/payfast/itn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    router.refresh();
  }

  return (
    <button onClick={pay} disabled={busy} className="btn-brass" style={{ width: "100%", background: "#0a3d62", color: "#fff", fontSize: 15 }}>
      {busy ? "Processing…" : "Pay now (simulate) →"}
    </button>
  );
}

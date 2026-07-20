"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zar } from "@/lib/format";

// Client accept action on the public quote page. On success the server has
// generated the deposit invoice + emailed it; we surface the pay link here too.
export default function AcceptQuote({
  token,
  accepted,
  depositAmount,
  invoiceId,
  paymentLabel,
  paymentSentence,
}: {
  token: string;
  accepted: boolean;
  depositAmount: number;
  invoiceId: string | null;
  paymentLabel: string;
  paymentSentence: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payId, setPayId] = useState<string | null>(invoiceId);
  const [justAccepted, setJustAccepted] = useState(false);

  async function accept() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/quotes/${token}/accept`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error || "Something went wrong — please try again.");
      return;
    }
    const data = await res.json();
    setPayId(data.invoiceId);
    setJustAccepted(true);
    router.refresh();
  }

  if (accepted || justAccepted) {
    return (
      <div style={{ background: "#eef4f0", border: "1px solid var(--color-signal)", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontWeight: 800, color: "#2c5a3e", fontFamily: "var(--font-display)", fontSize: 16 }}>
          ✓ Quote accepted{justAccepted ? " — thank you!" : ""}
        </div>
        <p style={{ margin: "8px 0 14px", fontSize: 14, color: "#2c5a3e", lineHeight: 1.6 }}>
          Your {zar(depositAmount)} deposit invoice has been emailed to you with payment
          options ({paymentLabel}). Your install date is confirmed once the deposit reflects.
        </p>
        {payId && (
          <a href={`/pay/${payId}`} className="btn-brass" style={{ display: "inline-block", fontSize: 14.5 }}>
            Pay {zar(depositAmount)} deposit now →
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <button className="btn-brass" onClick={accept} disabled={busy} style={{ width: "100%", fontSize: 16 }}>
        {busy ? "Accepting…" : "Accept this quote"}
      </button>
      {error && <p style={{ color: "#a23c34", fontSize: 13, marginTop: 8 }}>{error}</p>}
      <p style={{ fontSize: 12.5, color: "var(--color-steel)", marginTop: 10, lineHeight: 1.6 }}>
        Accepting generates your {zar(depositAmount)} deposit invoice and emails it to you
        with secure payment options — {paymentSentence}. No money moves yet.
      </p>
    </div>
  );
}

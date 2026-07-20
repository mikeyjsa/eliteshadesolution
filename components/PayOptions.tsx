"use client";
import { useState } from "react";
import PayButton from "@/components/PayButton";
import { gtagEvent } from "@/lib/gtag";

// PayFast / EFT payment method selector on the public pay page.
export default function PayOptions({
  invoiceId,
  invoiceNumber,
  eftDetails,
  allowGateway,
}: {
  invoiceId: string;
  invoiceNumber: string;
  eftDetails: string;
  allowGateway: boolean;
}) {
  const [method, setMethod] = useState<"payfast" | "eft">(allowGateway ? "payfast" : "eft");
  const [copied, setCopied] = useState(false);

  const eftLines = eftDetails.split("\n").map((l) => l.trim()).filter(Boolean);

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText([...eftLines, `Reference: ${invoiceNumber}`].join("\n"));
      setCopied(true);
      gtagEvent("eft_details_copied", { invoice_id: invoiceId });
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — details are visible anyway */ }
  }

  return (
    <div>
      {allowGateway && (
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--color-line)", marginBottom: 16 }}>
          {([
            { key: "payfast" as const, label: "Card / PayFast" },
            { key: "eft" as const, label: "Direct EFT" },
          ]).map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setMethod(m.key);
                gtagEvent("payment_method_selected", { method: m.key, invoice_id: invoiceId });
              }}
              style={{
                flex: 1, padding: "11px 8px", border: "none", cursor: "pointer",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                background: method === m.key ? "var(--color-navy)" : "#fff",
                color: method === m.key ? "#fff" : "var(--color-steel)",
                transition: "background .2s, color .2s",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {allowGateway && method === "payfast" ? (
        <>
          <PayButton invoiceId={invoiceId} />
          <p style={{ fontSize: 11, color: "var(--color-silver)", textAlign: "center", marginTop: 12, marginBottom: 0 }}>
            Secure card or instant EFT via PayFast. Mock gateway in this build — clicking pay
            simulates a successful payment notification.
          </p>
        </>
      ) : (
        <div>
          <div style={{ background: "var(--color-mist)", borderRadius: 10, padding: "16px 18px" }}>
            {eftLines.map((line) => {
              const [k, ...rest] = line.split(":");
              const v = rest.join(":").trim();
              return v ? (
                <div key={line} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5, padding: "3px 0" }}>
                  <span style={{ color: "var(--color-steel)" }}>{k}</span>
                  <span style={{ color: "var(--color-navy)", fontWeight: 600, textAlign: "right" }}>{v}</span>
                </div>
              ) : (
                <div key={line} style={{ fontSize: 13.5, padding: "3px 0", color: "var(--color-navy)", fontWeight: 600 }}>{line}</div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--color-line)", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5, padding: "3px 0" }}>
              <span style={{ color: "var(--color-steel)" }}>Reference</span>
              <span style={{ color: "var(--color-warn)", fontWeight: 800 }}>{invoiceNumber}</span>
            </div>
          </div>
          <button className="btn-ghost" onClick={copyDetails} style={{ width: "100%", marginTop: 12, fontSize: 13.5 }}>
            {copied ? "✓ Copied" : "Copy bank details"}
          </button>
          <p style={{ fontSize: 12, color: "var(--color-steel)", lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
            Use <b>{invoiceNumber}</b> as your payment reference, then send your proof of
            payment to speed up confirmation. Your install date is booked as soon as the
            deposit reflects.
          </p>
        </div>
      )}
    </div>
  );
}

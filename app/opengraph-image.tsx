import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1c2733 0%, #283746 58%, #384a5b 100%)",
          color: "white",
          padding: "56px 64px",
          position: "relative",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(201,162,75,.30), transparent 30%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>
            <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#c9a24b" }}>
              Cape Town · Western Cape
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.04, display: "flex", flexDirection: "column" }}>
              <span>Know your shade</span>
              <span>price in two</span>
              <span>minutes.</span>
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.45, color: "#dfe6eb" }}>
              Premium Kalahari shade sails with transparent online estimates, engineered fixings, and owner-led installation.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>{SITE_NAME}</div>
              <div style={{ fontSize: 20, color: "#c9a24b" }}>{SITE_TAGLINE}</div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 18,
                background: "rgba(255,255,255,.08)",
                padding: "18px 24px",
                borderRadius: 18,
                fontSize: 24,
              }}
            >
              <div>90% UV block</div>
              <div>Genuine Kalahari</div>
              <div>Fast estimates</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}

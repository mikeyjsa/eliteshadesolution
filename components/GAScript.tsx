"use client";
import Script from "next/script";

// Injects GA4 scripts when a measurement ID is configured in Settings.
// Uses afterInteractive so it never blocks the page.
export default function GAScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${id}');
      `}</Script>
    </>
  );
}

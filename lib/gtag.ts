type GTagParams = Record<string, string | number | boolean>;

function withGtag(fn: (gtag: (...args: unknown[]) => void) => void) {
  if (
    typeof window !== "undefined" &&
    typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag ===
      "function"
  ) {
    fn((window as unknown as { gtag: (...args: unknown[]) => void }).gtag);
  }
}

// Thin GA4 helpers — safe to call when GA is not configured (no-ops).
export function gtagEvent(name: string, params?: GTagParams) {
  withGtag((gtag) => gtag("event", name, params ?? {}));
}

export function gtagPageView(id: string, pagePath: string) {
  withGtag((gtag) =>
    gtag("event", "page_view", {
      page_path: pagePath,
      page_location: typeof window !== "undefined" ? window.location.href : pagePath,
      page_title: typeof document !== "undefined" ? document.title : pagePath,
      send_to: id,
    })
  );
}

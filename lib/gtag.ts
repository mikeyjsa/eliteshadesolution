// Thin GA4 event helper — safe to call when GA is not configured (no-ops).
export function gtagEvent(
  name: string,
  params?: Record<string, string | number>
) {
  if (
    typeof window !== "undefined" &&
    typeof (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag === "function"
  ) {
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag(
      "event",
      name,
      params ?? {}
    );
  }
}

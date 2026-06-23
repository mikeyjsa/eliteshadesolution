// Mock PayFast. Real flow: build a signed redirect to the hosted page,
// then verify the ITN (Instant Transaction Notification) webhook signature.
// Here we expose a fake hosted-page URL and a direct "confirm" that the
// mock /pay page calls to fire the ITN webhook. Swap in real keys later.

export function hostedPaymentUrl(invoiceId: string): string {
  // On the real gateway this is https://www.payfast.co.za/eng/process?...signed
  return `/pay/${invoiceId}`;
}

export function fakePayfastId(): string {
  return "PF" + Math.floor(1_000_000 + Math.random() * 9_000_000);
}

import { createPrivateKey } from "node:crypto";

export class AnalyticsCredentialError extends Error {}

export function normalizeAnalyticsPrivateKey(input: string, accountEmail: string): string {
  const invalidKey = () => new AnalyticsCredentialError(
    "Enter the private key or the complete Google Cloud service account JSON in Settings > Analytics."
  );
  let key = input.trim();
  if (key.startsWith("{") || key.startsWith('"')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(key);
    } catch {
      throw invalidKey();
    }
    if (typeof parsed === "string") {
      key = parsed;
    } else if (parsed && typeof parsed === "object" && "private_key" in parsed && typeof parsed.private_key === "string") {
      if ("client_email" in parsed && (typeof parsed.client_email !== "string" ||
        parsed.client_email.trim().toLowerCase() !== accountEmail.trim().toLowerCase())) {
        throw new AnalyticsCredentialError("The Google Cloud JSON belongs to a different service account than the email in Settings > Analytics.");
      }
      key = parsed.private_key;
    } else {
      throw invalidKey();
    }
  }

  key = key.replace(/\\r\\n|\\n|\r\n/g, "\n").trim();
  try {
    if (createPrivateKey({ key, format: "pem" }).asymmetricKeyType !== "rsa") throw invalidKey();
  } catch {
    throw invalidKey();
  }
  return key;
}

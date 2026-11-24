import { generateKeyPairSync } from "node:crypto";
import { expect, test } from "@playwright/test";
import { normalizeAnalyticsPrivateKey } from "../lib/ga-credentials";

const email = "viewer@example.invalid";
const key = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({
  type: "pkcs8",
  format: "pem",
}).toString().trim();

test("Analytics accepts PEM, escaped PEM and complete Google Cloud JSON", () => {
  for (const value of [key, key.replace(/\n/g, "\\n"), JSON.stringify(key), JSON.stringify({ client_email: email, private_key: key })]) {
    expect(normalizeAnalyticsPrivateKey(value, email)).toBe(key);
  }
});

test("Analytics rejects invalid credentials and mismatched service accounts", () => {
  expect(() => normalizeAnalyticsPrivateKey("not a key", email)).toThrow("Enter the private key");
  expect(() => normalizeAnalyticsPrivateKey(JSON.stringify({ client_email: "other@example.invalid", private_key: key }), email)).toThrow("different service account");
});

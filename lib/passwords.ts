import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt";
const KEY_LENGTH = 64;

export function isPasswordHash(value: string) {
  return value.startsWith(`${PREFIX}$`);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${PREFIX}$${salt}$${digest}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!isPasswordHash(stored)) {
    return timingSafeTextEqual(password, stored);
  }

  const [, salt, expectedHex] = stored.split("$");
  if (!salt || !expectedHex) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function timingSafeTextEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

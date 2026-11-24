import { cookies } from "next/headers";
import { getDB } from "./db";
import type { AdminUser } from "./types";
import { createHmac } from "crypto";
import { verifyPassword } from "./passwords";

const COOKIE = "es_admin";
const COOKIE_USER = "es_uid";

// Per-user auth. The shared owner password remains a backwards-compatible
// fallback, but all stored values are migrated to salted hashes by the DB layer.
export async function findUser(email: string, password: string): Promise<AdminUser | null> {
  const db = await getDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (user && verifyPassword(password, user.password)) return user;
  const owner = db.users.find((candidate) => candidate.active && candidate.role === "admin");
  if (owner && owner.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, db.settings.admin_password)) {
    return owner;
  }
  return null;
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const db = await getDB();
  // Check token matches any active user
  return db.users.some((u) => u.active && sessionToken(u.id, u.password) === token);
}

export async function currentUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const uid = jar.get(COOKIE_USER)?.value;
  if (!token || !uid) return null;
  const db = await getDB();
  const user = db.users.find((u) => u.id === uid && u.active);
  if (!user) return null;
  if (sessionToken(user.id, user.password) !== token) return null;
  return user;
}

export function sessionToken(userId: string, password: string): string {
  const secret = process.env.AUTH_SECRET || process.env.ELITE_DB_PASSPHRASE || password;
  return createHmac("sha256", secret)
    .update(`elite-shade:${userId}:${password}`)
    .digest("base64url");
}

export { COOKIE, COOKIE_USER };

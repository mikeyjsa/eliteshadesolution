import { cookies } from "next/headers";
import { getDB } from "./db";
import type { AdminUser } from "./types";

const COOKIE = "es_admin";
const COOKIE_USER = "es_uid";

// Per-user auth. Falls back to the shared legacy password for backward compat.
export async function findUser(email: string, password: string): Promise<AdminUser | null> {
  const db = await getDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (user && user.password === password) return user;
  // Legacy shared password fallback (owner account)
  if (password === db.settings.admin_password) return db.users[0] ?? null;
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
  let h = 0;
  const s = "es:" + userId + ":" + password;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return "es" + Math.abs(h).toString(36);
}

export { COOKIE, COOKIE_USER };

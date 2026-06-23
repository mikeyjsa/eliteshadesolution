// Block reading helpers in a plain .ts file to avoid .tsx JSX parsing ambiguity.
import type { DB } from "./types";

export function readBlockMeta(db: DB, slug: string): Record<string, string> {
  return db.content.find((c) => c.type === "block" && c.slug === slug)?.meta ?? {};
}

export function readBlockItems(db: DB, slug: string): unknown[] | null {
  const raw = readBlockMeta(db, slug).items;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_e) {
    return null;
  }
}

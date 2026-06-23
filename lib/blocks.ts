// Typed helper for reading CMS page blocks from the content store.
// Blocks have type="block" and a unique slug. String fields live directly in
// meta; array fields are JSON-serialised in meta.items. Falls back to
// defaults when a block hasn't been seeded / edited yet.
import type { DB } from "./types";

export function getBlock<T extends Record<string, unknown>>(
  db: DB,
  slug: string,
  defaults: T
): T {
  const b = db.content.find((c) => c.type === "block" && c.slug === slug);
  if (!b) return defaults;
  const merged = { ...defaults, ...b.meta } as T;
  if (b.meta.items) {
    try {
      (merged as Record<string, unknown>).items = JSON.parse(b.meta.items);
    } catch {
      /* keep defaults.items */
    }
  }
  return merged;
}

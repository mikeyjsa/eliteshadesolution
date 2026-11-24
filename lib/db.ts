// File-based JSON repository. Async by design so a Supabase/Postgres
// swap is mechanical — replace the read/write internals, keep the API.
import { promises as fs } from "fs";
import type { DB } from "./types";
import { seedDB } from "./seed";
import { DATA_DIR, DB_FILE } from "./storage-paths";
import { maybeCreateHourlyBackup } from "./backups";
import { decryptStoredText, encryptStoredText, maybeMigrateEncryptedFile } from "./data-crypto";
import { hashPassword, isPasswordHash } from "./passwords";

let memo: DB | null = null;
let writing: Promise<void> = Promise.resolve();

function hydrate(db: DB): DB {
  db.installations = (db.installations || []).map((installation) => ({
    ...installation,
    team_id: installation.team_id ?? null,
  }));
  db.teams ||= [];
  db.notifications ||= [];
  db.mailing_lists ||= [];
  db.email_campaigns ||= [];
  db.email_campaign_sends ||= [];
  return db;
}

function migratePasswordHashes(db: DB) {
  let changed = false;
  for (const user of db.users) {
    if (!isPasswordHash(user.password)) {
      user.password = hashPassword(user.password);
      changed = true;
    }
  }
  if (db.settings.admin_password && !isPasswordHash(db.settings.admin_password)) {
    db.settings.admin_password = hashPassword(db.settings.admin_password);
    changed = true;
  }
  return changed;
}

async function ensure(): Promise<DB> {
  if (memo) return memo;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    memo = hydrate(JSON.parse(decryptStoredText(raw)) as DB);
    if (migratePasswordHashes(memo)) {
      await fs.writeFile(DB_FILE, encryptStoredText(JSON.stringify(memo, null, 2)), "utf8");
    }
    await maybeMigrateEncryptedFile(
      () => fs.readFile(DB_FILE, "utf8"),
      (content) => fs.writeFile(DB_FILE, content, "utf8")
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    memo = hydrate(seedDB());
    migratePasswordHashes(memo);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, encryptStoredText(JSON.stringify(memo, null, 2)), "utf8");
  }
  await maybeCreateHourlyBackup(memo);
  return memo;
}

// Read a snapshot of the store.
export async function getDB(): Promise<DB> {
  return ensure();
}

// Mutate the store under a serialized write lock, then persist.
export async function mutate<T>(fn: (db: DB) => T): Promise<T> {
  const db = await ensure();
  const result = fn(db);
  writing = writing.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, encryptStoredText(JSON.stringify(db, null, 2)), "utf8");
    await maybeCreateHourlyBackup(db);
  });
  await writing;
  return result;
}

export async function replaceDB(next: DB): Promise<void> {
  memo = next;
  writing = writing.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, encryptStoredText(JSON.stringify(next, null, 2)), "utf8");
  });
  await writing;
}

export async function resetDBCache(): Promise<void> {
  memo = null;
}

export function uid(prefix = ""): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

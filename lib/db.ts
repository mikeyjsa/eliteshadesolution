// File-based JSON repository. Async by design so a Supabase/Postgres
// swap is mechanical — replace the read/write internals, keep the API.
import { promises as fs } from "fs";
import type { DB } from "./types";
import { seedDB } from "./seed";
import { DATA_DIR, DB_FILE } from "./storage-paths";
import { maybeCreateHourlyBackup } from "./backups";
import { decryptStoredText, encryptStoredText, maybeMigrateEncryptedFile } from "./data-crypto";
import { hashPassword, isPasswordHash } from "./passwords";

let writing: Promise<void> = Promise.resolve();
const LOCK_FILE = `${DB_FILE}.lock`;
const LOCK_TIMEOUT_MS = 10_000;
const STALE_LOCK_MS = 30_000;

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

async function readDB(): Promise<DB> {
  const raw = await fs.readFile(DB_FILE, "utf8");
  return hydrate(JSON.parse(decryptStoredText(raw)) as DB);
}

async function writeDB(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${DB_FILE}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tempFile, encryptStoredText(JSON.stringify(db, null, 2)), "utf8");
  await fs.rename(tempFile, DB_FILE);
}

async function acquireFileLock(): Promise<() => Promise<void>> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const started = Date.now();
  while (true) {
    try {
      const handle = await fs.open(LOCK_FILE, "wx");
      return async () => {
        await handle.close().catch(() => {});
        await fs.unlink(LOCK_FILE).catch(() => {});
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const stat = await fs.stat(LOCK_FILE).catch(() => null);
      if (stat && Date.now() - stat.mtimeMs > STALE_LOCK_MS) {
        await fs.unlink(LOCK_FILE).catch(() => {});
        continue;
      }
      if (Date.now() - started >= LOCK_TIMEOUT_MS) {
        throw new Error("Timed out waiting for the database write lock.");
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

async function ensure(): Promise<DB> {
  try {
    let db = await readDB();
    if (migratePasswordHashes(db)) {
      const release = await acquireFileLock();
      try {
        db = await readDB();
        if (migratePasswordHashes(db)) await writeDB(db);
      } finally {
        await release();
      }
    }
    await maybeMigrateEncryptedFile(
      () => fs.readFile(DB_FILE, "utf8"),
      (content) => fs.writeFile(DB_FILE, content, "utf8")
    );
    await maybeCreateHourlyBackup(db);
    return db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const release = await acquireFileLock();
  try {
    try {
      return await readDB();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const db = hydrate(seedDB());
      migratePasswordHashes(db);
      await writeDB(db);
      await maybeCreateHourlyBackup(db);
      return db;
    }
  } finally {
    await release();
  }
}

// Read a snapshot of the store.
export async function getDB(): Promise<DB> {
  return ensure();
}

// Mutate the store under a serialized write lock, then persist.
export async function mutate<T>(fn: (db: DB) => T): Promise<T> {
  let result!: T;
  writing = writing.then(async () => {
    const release = await acquireFileLock();
    try {
      let db: DB;
      try {
        db = await readDB();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        db = hydrate(seedDB());
        migratePasswordHashes(db);
      }
      result = fn(db);
      await writeDB(db);
      await maybeCreateHourlyBackup(db);
    } finally {
      await release();
    }
  });
  await writing;
  return result;
}

export async function replaceDB(next: DB): Promise<void> {
  writing = writing.then(async () => {
    const release = await acquireFileLock();
    try {
      await writeDB(hydrate(next));
    } finally {
      await release();
    }
  });
  await writing;
}

export async function resetDBCache(): Promise<void> {
  // Reads are intentionally uncached so every Passenger process sees live data.
}

export function uid(prefix = ""): string {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

import { promises as fs } from "fs";
import path from "path";
import { BACKUP_DIR, DB_FILE } from "./storage-paths";
import type { DB } from "./types";
import { decryptStoredText, encryptStoredText, maybeMigrateEncryptedFile } from "./data-crypto";

export const BACKUP_INTERVAL_MS = 60 * 60 * 1000;
const BACKUP_EXT = ".json";

export interface BackupFileMeta {
  id: string;
  filename: string;
  reason: "hourly" | "manual" | "pre_restore";
  created_at: string;
  size: number;
  path: string;
}

function stamp(d = new Date()) {
  return d.toISOString().replace(/[:.]/g, "-");
}

function backupPath(id: string) {
  return path.join(BACKUP_DIR, `${id}${BACKUP_EXT}`);
}

export async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

export async function listBackups(): Promise<BackupFileMeta[]> {
  await ensureBackupDir();
  const files = await fs.readdir(BACKUP_DIR);
  const rows = await Promise.all(
    files
      .filter((file) => file.endsWith(BACKUP_EXT))
      .map(async (file) => {
        const full = path.join(BACKUP_DIR, file);
        await maybeMigrateEncryptedFile(
          () => fs.readFile(full, "utf8"),
          (content) => fs.writeFile(full, content, "utf8")
        );
        const stat = await fs.stat(full);
        const base = file.slice(0, -BACKUP_EXT.length);
        const [reason = "manual"] = base.split("__");
        return {
          id: base,
          filename: file,
          reason: (reason === "hourly" || reason === "manual" || reason === "pre_restore" ? reason : "manual") as BackupFileMeta["reason"],
          created_at: stat.birthtime.toISOString(),
          size: stat.size,
          path: full,
        };
      })
  );
  return rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export async function createBackup(snapshot: DB | string, reason: BackupFileMeta["reason"] = "manual") {
  await ensureBackupDir();
  const id = `${reason}__${stamp()}`;
  const raw = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot, null, 2);
  const full = backupPath(id);
  await fs.writeFile(full, encryptStoredText(raw), "utf8");
  const stat = await fs.stat(full);
  return {
    id,
    filename: path.basename(full),
    reason,
    created_at: stat.birthtime.toISOString(),
    size: stat.size,
    path: full,
  } satisfies BackupFileMeta;
}

export async function maybeCreateHourlyBackup(snapshot: DB | string) {
  const backups = await listBackups();
  const lastHourly = backups.find((b) => b.reason === "hourly");
  if (lastHourly && Date.now() - +new Date(lastHourly.created_at) < BACKUP_INTERVAL_MS) {
    return null;
  }
  return createBackup(snapshot, "hourly");
}

export async function readBackup(id: string) {
  return decryptStoredText(await fs.readFile(backupPath(id), "utf8"));
}

export async function parseBackup(id: string): Promise<DB> {
  return JSON.parse(await readBackup(id)) as DB;
}

export async function currentDbRaw() {
  return decryptStoredText(await fs.readFile(DB_FILE, "utf8"));
}

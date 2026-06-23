import path from "path";

export const DATA_DIR = path.join(process.cwd(), ".data");
export const DB_FILE = path.join(DATA_DIR, "db.json");
export const BACKUP_DIR = path.join(DATA_DIR, "backups");

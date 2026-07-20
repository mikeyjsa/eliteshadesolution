import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ENC_MARKER = "esdb-v1";
const ENC_ALGO = "aes-256-gcm";
const KEY_ENV = "ELITE_DB_PASSPHRASE";
const SALT = "elite-shade-db";

type Envelope = {
  marker: typeof ENC_MARKER;
  alg: typeof ENC_ALGO;
  iv: string;
  tag: string;
  data: string;
};

function getKey(): Buffer | null {
  const passphrase = process.env[KEY_ENV];
  if (!passphrase) return null;
  return scryptSync(passphrase, SALT, 32);
}

function parseEnvelope(raw: string): Envelope | null {
  try {
    const parsed = JSON.parse(raw) as Partial<Envelope>;
    if (
      parsed &&
      parsed.marker === ENC_MARKER &&
      parsed.alg === ENC_ALGO &&
      typeof parsed.iv === "string" &&
      typeof parsed.tag === "string" &&
      typeof parsed.data === "string"
    ) {
      return parsed as Envelope;
    }
    return null;
  } catch {
    return null;
  }
}

export function isEncryptionEnabled() {
  return Boolean(getKey());
}

export function isEncryptedPayload(raw: string) {
  return Boolean(parseEnvelope(raw));
}

export function encryptStoredText(plainText: string): string {
  const key = getKey();
  if (!key) return plainText;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENC_ALGO, key, iv);
  const data = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    marker: ENC_MARKER,
    alg: ENC_ALGO,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: data.toString("base64"),
  } satisfies Envelope);
}

export function decryptStoredText(raw: string): string {
  const envelope = parseEnvelope(raw);
  if (!envelope) return raw;

  const key = getKey();
  if (!key) {
    throw new Error(`Encrypted database detected. Set ${KEY_ENV} before starting the app.`);
  }

  const decipher = createDecipheriv(ENC_ALGO, key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export async function maybeMigrateEncryptedFile(
  readFile: () => Promise<string>,
  writeFile: (content: string) => Promise<void>
) {
  if (!isEncryptionEnabled()) return false;
  const raw = await readFile();
  if (isEncryptedPayload(raw)) return false;
  await writeFile(encryptStoredText(raw));
  return true;
}

export { KEY_ENV as DB_ENCRYPTION_ENV };

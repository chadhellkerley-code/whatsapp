import crypto from "node:crypto";
import { ENV } from "./env";

const PREFIX = "enc:";

function getKeyMaterial() {
  const seed = ENV.cookieSecret || ENV.appId || "whatsapp-manager-openwa";
  return crypto.createHash("sha256").update(seed).digest();
}

export function encryptSecret(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (value.length === 0) return "";
  if (value.startsWith(PREFIX)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKeyMaterial(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`;
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (value.length === 0) return "";
  if (!value.startsWith(PREFIX)) return value;

  const payload = Buffer.from(value.slice(PREFIX.length), "base64url");
  if (payload.length < 28) return null;

  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKeyMaterial(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8"
  );
}

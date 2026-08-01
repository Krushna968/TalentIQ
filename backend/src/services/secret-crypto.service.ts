import crypto from 'node:crypto';
import { env } from '../config/env.js';

const VERSION = 'v1';
const IV_LENGTH = 12;

function encryptionKey() {
  return crypto.createHash('sha256').update(env.TOKEN_ENCRYPTION_KEY || env.JWT_SECRET).digest();
}

/** Encrypts provider credentials before they are persisted. */
export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

/** Supports legacy plaintext tokens until the next successful provider sync rewrites them encrypted. */
export function decryptSecret(value: string) {
  const [version, ivValue, tagValue, encryptedValue, ...extra] = value.split('.');
  if (version !== VERSION || !ivValue || !tagValue || !encryptedValue || extra.length) return value;

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}

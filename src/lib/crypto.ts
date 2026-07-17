// src/lib/crypto.ts — AES-256-GCM token encryption/decryption
//
// Tokens stored in HTTP-only cookies are encrypted so even if an attacker
// somehow reads a cookie value, they cannot use it without the server key.
//
// Set COOKIE_SECRET in .env.local — must be 32+ characters.
// Fallback is used in dev only; set a real secret in production.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const secret = process.env.COOKIE_SECRET ?? 'dashboard-default-secret-32chars!!';
  return Buffer.from(secret.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
}

/** Encrypt a plain-text JWT → base64url-encoded ciphertext */
export function encryptToken(plaintext: string): string {
  const key       = getKey();
  const iv        = randomBytes(12);  // 96-bit IV for GCM
  const cipher    = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag       = cipher.getAuthTag(); // 16-byte authentication tag

  // Packed layout: iv(12) | tag(16) | ciphertext(N)
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

/**
 * Decrypt a cookie value back to a plain JWT.
 * Falls back to returning the value as-is if it looks like a raw JWT —
 * this keeps sessions valid that were set before encryption was added.
 * Returns null if the value is corrupt/tampered.
 */
export function decryptToken(encoded: string): string | null {
  try {
    const packed = Buffer.from(encoded, 'base64url');
    if (packed.length > 28) {
      const iv         = packed.subarray(0, 12);
      const tag        = packed.subarray(12, 28);
      const ciphertext = packed.subarray(28);
      const key        = getKey();
      const decipher   = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      const result = decipher.update(ciphertext) + decipher.final('utf8');
      if (result) return result;
    }
  } catch {
    // Decryption failed — might be a legacy plain JWT
  }

  // Fallback: accept raw JWT (three base64url segments)
  if (/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(encoded)) {
    return encoded;
  }

  return null;
}

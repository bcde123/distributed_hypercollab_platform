/**
 * keyStore.js — Manages Kyber keypairs and per-chat shared secrets in localStorage.
 *
 * Storage layout:
 *   hypercollab_pk          → base64 Kyber768 public key
 *   hypercollab_sk          → base64 Kyber768 secret key
 *   hypercollab_ss_{chatId} → base64 AES-256 shared secret (32 bytes)
 */

const PREFIX = "hypercollab_";

// ── Base64 ↔ Uint8Array helpers ──────────────────────────────────────────

export const toBase64 = (arr) => {
  const bytes = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const fromBase64 = (str) => {
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// ── Kyber Keypair (per-user, generated once on login) ────────────────────

export const storeKeyPair = (pk, sk) => {
  localStorage.setItem(`${PREFIX}pk`, pk); // already base64 from crypto.js
  localStorage.setItem(`${PREFIX}sk`, sk);
};

export const getPublicKey = () => localStorage.getItem(`${PREFIX}pk`);
export const getSecretKey = () => localStorage.getItem(`${PREFIX}sk`);
export const hasKeyPair = () => !!getSecretKey();

// ── Per-Chat Shared Secrets (AES-256 key, 32 bytes) ─────────────────────

export const storeSharedSecret = (chatId, secretBytes) => {
  const b64 = secretBytes instanceof Uint8Array ? toBase64(secretBytes) : secretBytes;
  localStorage.setItem(`${PREFIX}ss_${chatId}`, b64);
};

export const getSharedSecret = (chatId) => {
  const stored = localStorage.getItem(`${PREFIX}ss_${chatId}`);
  if (!stored) return null;
  return fromBase64(stored);
};

export const hasSharedSecret = (chatId) => {
  return !!localStorage.getItem(`${PREFIX}ss_${chatId}`);
};

// ── Cleanup ──────────────────────────────────────────────────────────────

export const clearAllKeys = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
};

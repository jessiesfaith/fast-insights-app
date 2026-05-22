// FNV-1a 32-bit hash → 8-char hex string.
//
// Used for stable, deterministic IDs and tamper-detection hashes. Not a
// cryptographic hash — collision resistance is not a requirement here; we
// only need the same input to always produce the same short, stable digest.

export function fnv1aHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function nanoid(len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

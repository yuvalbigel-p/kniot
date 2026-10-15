import LZ from 'lz-string';
import type { ShouldList } from './types';
import { isShouldList } from './validate';

export const encodeShould = (s: ShouldList) => LZ.compressToEncodedURIComponent(JSON.stringify(s));

export type Decoded = { ok: true; list: ShouldList } | { ok: false };

export function decodeShould(d: string): Decoded {
  try {
    const json = LZ.decompressFromEncodedURIComponent(d.trim());
    if (!json) return { ok: false };
    const parsed: unknown = JSON.parse(json);
    return isShouldList(parsed) ? { ok: true, list: parsed } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function buildShareUrl(s: ShouldList, origin = location.origin + location.pathname): string {
  return `${origin}#/import?d=${encodeShould(s)}`;
}

/** Pull the `d` payload out of a pasted link, a bare hash, or a bare payload. */
export function extractPayload(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/[?&]d=([^&\s#]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9+\-$]+$/.test(t) && t.length > 20) return t;
  return null;
}

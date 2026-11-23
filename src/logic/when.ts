const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** "היום 21:10" / "אתמול 21:10" / "12.11 21:10" */
export function when(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `היום ${hm(d)}`;
  if (diff === 1) return `אתמול ${hm(d)}`;
  return `${d.getDate()}.${d.getMonth() + 1} ${hm(d)}`;
}

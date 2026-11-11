export function mix(a: number, b: number, t: number) {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t) << s;
  return ch(16) | ch(8) | ch(0);
}

export const shade = (c: number, f: number) => mix(c, 0x000000, 1 - f);
export const luma = (c: number) => (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255;
export const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

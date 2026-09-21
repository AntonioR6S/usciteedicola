import { createHash } from "node:crypto";

export function parseItalianDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function parsePrice(text: string): number | null {
  const m = text.match(/(\d+[.,]\d{2})/);
  if (!m) return null;
  return parseFloat(m[1].replace(",", "."));
}

export function parseIssueNumber(text: string): number | null {
  const m = text.match(/N[°º]\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

export function stableId(...parts: (string | number | null)[]): string {
  const s = parts.filter((p) => p !== null && p !== undefined).join("::");
  return createHash("sha1").update(s).digest("hex").slice(0, 16);
}

export function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

const MONTHS_IT: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
};

export type Periodicity = "settimanale" | "quindicinale" | "mensile" | "bimestrale" | "trimestrale";

const APPROX_DAYS: Record<Periodicity, number> = {
  settimanale: 7,
  quindicinale: 14,
  mensile: 31,
  bimestrale: 62,
  trimestrale: 92,
};

export function parsePeriodicity(text: string): Periodicity | null {
  const m = text.match(/Periodicit[àa]\s*:?\s*([A-Za-zàèéìòù]+)/i);
  const value = m?.[1].toLowerCase();
  if (value && value in APPROX_DAYS) return value as Periodicity;
  return null;
}

export function approxPeriodDays(p: Periodicity): number {
  return APPROX_DAYS[p];
}

/** "18 settembre 2026" -> "2026-09-18" */
export function parseLongItalianDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS_IT[m[2].toLowerCase()];
  if (month === undefined) return null;
  return toIso(new Date(Date.UTC(parseInt(m[3], 10), month, parseInt(m[1], 10))));
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addPeriods(isoDate: string, periodicity: Periodicity, n: number): string {
  const [y, mo, d] = isoDate.split("-").map(Number);
  switch (periodicity) {
    case "settimanale":
      return toIso(new Date(Date.UTC(y, mo - 1, d + 7 * n)));
    case "quindicinale":
      return toIso(new Date(Date.UTC(y, mo - 1, d + 14 * n)));
    case "mensile":
      return toIso(new Date(Date.UTC(y, mo - 1 + n, d)));
    case "bimestrale":
      return toIso(new Date(Date.UTC(y, mo - 1 + 2 * n, d)));
    case "trimestrale":
      return toIso(new Date(Date.UTC(y, mo - 1 + 3 * n, d)));
  }
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  return Math.round((Date.parse(toIsoDate) - Date.parse(fromIso)) / 86400000);
}

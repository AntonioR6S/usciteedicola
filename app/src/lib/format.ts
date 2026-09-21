export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

/**
 * Gli editori confermano spesso la data della prossima uscita solo a ridosso
 * della pubblicazione: un filtro "solo futuro" lascerebbe il calendario vuoto
 * per giorni. Includiamo quindi anche gli ultimi `lookbackDays` come "attuali".
 */
export function releaseWindowStart(lookbackDays = 7): Date {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  return cutoff;
}

export function formatPrice(price: number | null): string {
  if (price === null) return "";
  return `€ ${price.toFixed(2).replace(".", ",")}`;
}

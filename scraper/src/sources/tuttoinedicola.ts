import * as cheerio from "cheerio";
import { fetchHtml } from "../httpClient.js";
import { parsePrice, stableId, absoluteUrl } from "../parseHelpers.js";
import type { Category, Release, Series } from "../types.js";

const BASE = "https://tuttoinedicola.it";
const LIST_URL = `${BASE}/prossime-uscite/`;

const SLUG_CATEGORY: Record<string, Category | undefined> = {
  libri: "libri",
  collane: "libri",
};

const MODELLINI_RE = /\bscala\b|modellin|miniatur|\bauto\b|\bmoto\b|aere|elicotter|\bnav[ei]\b|trattor|veicol/i;
const FIGURES_RE = /personagg|statuett|action figure|funko|busto|plexies/i;

function classifyCollezioni(title: string): Category {
  if (MODELLINI_RE.test(title)) return "modellini";
  if (FIGURES_RE.test(title)) return "figures";
  return "collezionabili";
}

const MONTHS: Record<string, string> = {
  gen: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  mag: "05",
  giu: "06",
  lug: "07",
  ago: "08",
  set: "09",
  ott: "10",
  nov: "11",
  dic: "12",
};

interface ScrapeOptions {
  delayMs?: number;
  log?: (msg: string) => void;
}

export async function scrapeTuttoInEdicola(opts: ScrapeOptions = {}) {
  const log = opts.log ?? (() => {});
  const html = await fetchHtml(LIST_URL, opts.delayMs ?? 400);
  const $ = cheerio.load(html);

  const seriesMap = new Map<string, Series>();
  const releases: Release[] = [];

  $(".cue-full-month-block").each((_, block) => {
    const $block = $(block);
    const heading = $block.find("h3").first().text().trim();
    const yearMatch = heading.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    $block.find("article.cue-card").each((_, card) => {
      const $card = $(card);
      const slug = $card.attr("data-cue-full-category") ?? "";
      if (!slug || slug === "omaggi-in-edicola") return;

      const day = $card.find(".cue-card__day").first().text().trim();
      const monthAbbr = $card.find(".cue-card__month").first().text().trim();
      const titleEl = $card.find(".cue-card__title a").first();
      const title = titleEl.text().trim();
      const href = titleEl.attr("href");
      if (!title || !href || !day) return;

      const releaseDate = buildDate($card, day, monthAbbr, year, log);
      if (!releaseDate) return;

      const meta = $card.find(".cue-card__meta").first().text().trim();
      const priceMatch = meta.match(/(\d+[.,]\d{2})\s*€/);
      const price = priceMatch ? parsePrice(priceMatch[0]) : null;

      const category: Category = slug === "collezioni" ? classifyCollezioni(title) : (SLUG_CATEGORY[slug] ?? "collezionabili");

      const seriesUrl = absoluteUrl(href, BASE);
      const seriesId = stableId(seriesUrl);
      if (!seriesMap.has(seriesId)) {
        seriesMap.set(seriesId, {
          id: seriesId,
          title,
          category,
          publisher: null,
          imageUrl: null,
          totalIssues: null,
          sourceUrl: seriesUrl,
        });
      }

      releases.push({
        id: stableId(seriesUrl, releaseDate, meta),
        seriesId,
        seriesTitle: title,
        category,
        publisher: null,
        issueNumber: null,
        issueTitle: meta || null,
        releaseDate,
        price,
        imageUrl: null,
        sourceUrl: seriesUrl,
      });
    });
  });

  log(`[tuttoinedicola] ${releases.length} uscite, ${seriesMap.size} collane`);
  return { series: Array.from(seriesMap.values()), releases };
}

function buildDate(
  $card: cheerio.Cheerio<any>,
  day: string,
  monthAbbr: string,
  year: number,
  log: (msg: string) => void,
): string | null {
  const mm = MONTHS[monthAbbr.toLowerCase().slice(0, 3)];
  const fallback = mm ? `${year}-${mm}-${day.padStart(2, "0")}` : null;

  const gcal = $card.find("[data-gcal]").first().attr("data-gcal");
  if (gcal) {
    const m = gcal.match(/dates=(\d{4})(\d{2})(\d{2})/);
    // La data codificata nel link "aggiungi al calendario" a volte ha l'anno
    // troncato/malformato sul sito sorgente: usarla solo se l'anno coincide
    // con quello dell'intestazione del mese, altrimenti fidarsi del testo visibile.
    if (m && parseInt(m[1], 10) === year) return `${m[1]}-${m[2]}-${m[3]}`;
    if (m) log(`[tuttoinedicola] data gcal scartata (anno anomalo): ${gcal}`);
  }
  return fallback;
}

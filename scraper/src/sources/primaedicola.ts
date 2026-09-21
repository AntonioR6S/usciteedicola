import * as cheerio from "cheerio";
import { fetchHtml } from "../httpClient.js";
import {
  parseItalianDate,
  parsePrice,
  parseIssueNumber,
  stableId,
  absoluteUrl,
} from "../parseHelpers.js";
import type { Category, Release, Series } from "../types.js";

const BASE = "https://www.primaedicola.it";

export const CATEGORY_PATHS: { path: string; category: Category }[] = [
  { path: "/fumetti/fumetti-marvel.html", category: "fumetti" },
  { path: "/fumetti/fumetti-topolino.html", category: "fumetti" },
  { path: "/fumetti/horror-e-dark.html", category: "fumetti" },
  { path: "/fumetti/manga-e-anime.html", category: "fumetti" },
  { path: "/fumetti/supereroi.html", category: "fumetti" },
  { path: "/fumetti/vari.html", category: "fumetti" },
  { path: "/fumetti/western.html", category: "fumetti" },
  { path: "/modellismo-e-giochi/modellini-auto.html", category: "modellini" },
  { path: "/modellismo-e-giochi/aerei-ed-elicotteri.html", category: "modellini" },
  { path: "/modellismo-e-giochi/navi.html", category: "modellini" },
  { path: "/modellismo-e-giochi/robot.html", category: "modellini" },
  { path: "/modellismo-e-giochi/action-figure.html", category: "figures" },
  { path: "/modellismo-e-giochi/sport-e-motori.html", category: "collezionabili" },
  { path: "/accessori-e-gadget/album-e-figurine.html", category: "collezionabili" },
  { path: "/libri/narrativa-e-letteratura.html", category: "libri" },
  { path: "/libri/arte-e-cultura.html", category: "libri" },
  { path: "/libri/storia-e-politica.html", category: "libri" },
  { path: "/libri/bambini-e-ragazzi.html", category: "libri" },
];

interface ScrapeOptions {
  maxCollanePerCategory?: number;
  delayMs?: number;
  log?: (msg: string) => void;
}

export async function scrapePrimaEdicola(opts: ScrapeOptions = {}) {
  const delayMs = opts.delayMs ?? 400;
  const log = opts.log ?? (() => {});
  const series: Series[] = [];
  const releases: Release[] = [];
  const seenSeriesUrls = new Set<string>();

  for (const { path, category } of CATEGORY_PATHS) {
    const categoryUrl = BASE + path;
    let links: string[] = [];
    try {
      links = await collectCollaneLinks(categoryUrl, delayMs);
    } catch (err) {
      log(`[primaedicola] impossibile leggere categoria ${path}: ${(err as Error).message}`);
      continue;
    }
    if (opts.maxCollanePerCategory) links = links.slice(0, opts.maxCollanePerCategory);
    log(`[primaedicola] ${path}: ${links.length} collane trovate`);

    for (const link of links) {
      if (seenSeriesUrls.has(link)) continue;
      seenSeriesUrls.add(link);
      try {
        const result = await scrapeCollanaPage(link, category, delayMs);
        if (result) {
          series.push(result.series);
          releases.push(...result.releases);
        }
      } catch (err) {
        log(`[primaedicola] errore su ${link}: ${(err as Error).message}`);
      }
    }
  }

  return { series, releases };
}

async function collectCollaneLinks(categoryUrl: string, delayMs: number): Promise<string[]> {
  const links = new Set<string>();
  let page = 1;
  while (page <= 30) {
    const url = page === 1 ? categoryUrl : `${categoryUrl}?p=${page}`;
    const html = await fetchHtml(url, delayMs);
    const $ = cheerio.load(html);
    const items = $("li.item.product-item");
    if (items.length === 0) break;

    items.each((_, el) => {
      const href = $(el).find("a.product-item-link").attr("href");
      if (href) links.add(href);
    });

    const totalText = $("#toolbar-amount").text();
    const m = totalText.match(/di\s+(\d+)\s+totali/i);
    const total = m ? parseInt(m[1], 10) : links.size;
    if (links.size >= total) break;
    page++;
  }
  return Array.from(links);
}

async function scrapeCollanaPage(
  url: string,
  category: Category,
  delayMs: number,
): Promise<{ series: Series; releases: Release[] } | null> {
  const html = await fetchHtml(url, delayMs);
  const $ = cheerio.load(html);

  const title = $('meta[property="og:title"]').attr("content")?.trim() || $("h1.page-title .base").text().trim();
  if (!title) return null;

  const imageUrl = $('meta[property="og:image"]').attr("content")?.trim() || null;
  const infoBoxText = $(".numero-uscita-box").first().text().replace(/\s+/g, " ").trim();
  const totalMatch = infoBoxText.match(/(\d+)\s*uscite/i);
  const publisherMatch = infoBoxText.match(/Editore\s+(.+)$/i);
  const totalIssues = totalMatch ? parseInt(totalMatch[1], 10) : null;
  const publisher = publisherMatch ? publisherMatch[1].trim() : null;

  const seriesId = stableId(url);
  const series: Series = {
    id: seriesId,
    title,
    category,
    publisher,
    imageUrl,
    totalIssues,
    sourceUrl: url,
  };

  const releases: Release[] = [];
  const issueItems = $(".container-product-items li.item.product-item");

  if (issueItems.length > 0) {
    issueItems.each((_, el) => {
      const $el = $(el);
      const issueHref = $el.find("a.product-item-link").attr("href");
      const issueTitle = $el.find("a.product-item-link").text().trim() || null;
      const descLines = $el.find(".product-item-desc");
      const uscitaText = descLines.eq(1).text().replace(/\s+/g, " ").trim() || descLines.eq(0).text();
      const releaseDate = parseItalianDate(uscitaText);
      if (!releaseDate) return; // skip entries we can't date
      const issueNumber = parseIssueNumber(uscitaText);
      const priceAttr = $el.find("[data-price-amount]").first().attr("data-price-amount");
      const price = priceAttr ? parseFloat(priceAttr) : parsePrice($el.find(".price").first().text());
      const issueImage = $el.find("img.product-image-photo").attr("src") || imageUrl;
      const sourceUrl = issueHref ? absoluteUrl(issueHref, BASE) : url;

      releases.push({
        id: stableId(sourceUrl),
        seriesId,
        seriesTitle: title,
        category,
        publisher,
        issueNumber,
        issueTitle,
        releaseDate,
        price,
        imageUrl: issueImage,
        sourceUrl,
      });
    });
  } else {
    // Standalone product (no "piano dell'opera"): the page itself is one release.
    const bodyText = $("body").text();
    const releaseDate =
      parseItalianDate($(".numero-uscita-box").text()) ??
      (() => {
        const m = bodyText.match(/(?:in edicola dal|del)\s*(\d{1,2}[\/.]\d{1,2}[\/.]\d{4})/i);
        return m ? parseItalianDate(m[1]) : null;
      })();
    if (releaseDate) {
      const priceAttr = $(".price-box [data-price-amount]").first().attr("data-price-amount");
      const price = priceAttr ? parseFloat(priceAttr) : null;
      releases.push({
        id: stableId(url),
        seriesId,
        seriesTitle: title,
        category,
        publisher,
        issueNumber: null,
        issueTitle: null,
        releaseDate,
        price,
        imageUrl,
        sourceUrl: url,
      });
    }
  }

  return { series, releases };
}

import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { stableId, absoluteUrl } from "../parseHelpers.js";
import type { Category, Release, Series } from "../types.js";

const BASE = "https://www.panini.it";
const START_URL = `${BASE}/shp_ita_it/fumetti/calendario-delle-uscite/le-uscite-delle-prossime-8-settimane.html`;

// Le versioni regionali (stesso numero, copertina/allegato diverso per zona) sono
// duplicati agli effetti pratici: si tiene solo l'edizione base.
const REGION_VARIANT_RE = /\bVersione\s+\S.*$/i;

function normalizeSeriesName(title: string): string {
  const stripped = title.replace(/\s+\d+\s*$/, "").trim();
  return stripped || title;
}

function parseDateDDMMYY(text: string): string | null {
  const m = text.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `20${y}-${mo}-${d}`;
}

interface ScrapeOptions {
  log?: (msg: string) => void;
  maxPages?: number;
}

export async function scrapePanini(opts: ScrapeOptions = {}) {
  const log = opts.log ?? (() => {});
  const maxPages = opts.maxPages ?? 10;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const seriesMap = new Map<string, Series>();
  const releases: Release[] = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    );
    await page.setViewport({ width: 1280, height: 900 });

    let totalPages = maxPages;
    const seenUrls = new Set<string>();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const url = pageNum === 1 ? START_URL : `${START_URL}?p=${pageNum}`;
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      } catch (err) {
        log(`[panini] timeout/errore navigazione pagina ${pageNum}: ${(err as Error).message}`);
        break;
      }
      await page.waitForSelector("li.item.product-item, .toolbar-amount", { timeout: 20000 }).catch(() => {});

      const html = await page.content();
      const $ = cheerio.load(html);
      const items = $("li.item.product-item");
      if (items.length === 0) {
        log(`[panini] pagina ${pageNum}: nessun articolo, fine paginazione`);
        break;
      }

      if (pageNum === 1) {
        const amountText = $(".toolbar-amount").first().text().replace(/\s+/g, " ");
        const m = amountText.match(/di\s+(\d+)/i);
        const rangeMatch = amountText.match(/(\d+)\s*-\s*(\d+)/);
        const total = m ? parseInt(m[1], 10) : null;
        const perPage = rangeMatch ? parseInt(rangeMatch[2], 10) - parseInt(rangeMatch[1], 10) + 1 : items.length;
        if (total && perPage > 0) {
          totalPages = Math.min(maxPages, Math.ceil(total / perPage));
          log(`[panini] ${total} articoli totali, ${totalPages} pagine`);
        }
      }

      // La paginazione oltre l'ultima pagina reale ripresenta gli stessi articoli
      // invece di restituire una lista vuota: se il primo link della pagina è già
      // stato visto, siamo entrati in un ciclo e ci fermiamo qui.
      const firstHref = items.first().find(".product-item-name a").first().attr("href");
      if (firstHref && seenUrls.has(firstHref)) {
        log(`[panini] pagina ${pageNum}: contenuto già visto, fine paginazione`);
        break;
      }
      if (firstHref) seenUrls.add(firstHref);

      items.each((_, el) => {
        const $el = $(el);
        const titleEl = $el.find(".product-item-name a").first();
        const rawTitle = titleEl.text().trim();
        const href = titleEl.attr("href");
        if (!rawTitle || !href || REGION_VARIANT_RE.test(rawTitle)) return;

        const typology = $el.find(".product-item-attribute-typology small").first().text().trim().toLowerCase();
        const category: Category = typology === "magazine" ? "riviste" : "fumetti";

        const dateText = $el.find(".product-item-attribute-release-date small").first().text().trim();
        const releaseDate = parseDateDDMMYY(dateText);
        if (!releaseDate) return;

        const priceAttrs = $el.find(".price-box [data-price-amount]").toArray();
        const lastPriceAttr = priceAttrs.length ? $(priceAttrs[priceAttrs.length - 1]).attr("data-price-amount") : undefined;
        const price = lastPriceAttr ? Math.round(parseFloat(lastPriceAttr) * 100) / 100 : null;

        const imageUrl = $el.find("img.product-image-photo").attr("src") || null;
        const sourceUrl = absoluteUrl(href, BASE);
        const seriesName = normalizeSeriesName(rawTitle);
        const seriesId = stableId("panini", seriesName);

        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            id: seriesId,
            title: seriesName,
            category,
            publisher: "Panini",
            imageUrl,
            totalIssues: null,
            sourceUrl,
          });
        }

        releases.push({
          id: stableId(sourceUrl),
          seriesId,
          seriesTitle: seriesName,
          category,
          publisher: "Panini",
          issueNumber: null,
          issueTitle: rawTitle !== seriesName ? rawTitle : null,
          releaseDate,
          price,
          imageUrl,
          sourceUrl,
        });
      });

      log(`[panini] pagina ${pageNum}: ${items.length} articoli`);
    }
  } finally {
    await browser.close();
  }

  log(`[panini] totale ${releases.length} uscite, ${seriesMap.size} testate`);
  return { series: Array.from(seriesMap.values()), releases };
}

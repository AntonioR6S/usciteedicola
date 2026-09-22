import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrapePrimaEdicola } from "./sources/primaedicola.js";
import { scrapeTuttoInEdicola } from "./sources/tuttoinedicola.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const maxCollanePerCategory = isDryRun ? 3 : undefined;

  console.log(`Avvio scraping (dry-run: ${isDryRun})...`);

  const primaedicola = await scrapePrimaEdicola({
    maxCollanePerCategory,
    log: (msg) => console.log(msg),
  });

  let tuttoinedicola: { series: typeof primaedicola.series; releases: typeof primaedicola.releases } = {
    series: [],
    releases: [],
  };
  try {
    tuttoinedicola = await scrapeTuttoInEdicola({ log: (msg) => console.log(msg) });
  } catch (err) {
    console.error("[tuttoinedicola] scraping fallito, proseguo senza questa fonte:", (err as Error).message);
  }

  const rawSeries = [...primaedicola.series, ...tuttoinedicola.series];
  const rawReleases = [...primaedicola.releases, ...tuttoinedicola.releases];

  const series = Array.from(new Map(rawSeries.map((s) => [s.id, s])).values());
  const releases = Array.from(new Map(rawReleases.map((r) => [r.id, r])).values());
  releases.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

  console.log(
    `Trovate ${series.length} collane, ${releases.length} uscite (${rawReleases.length - releases.length} duplicati rimossi).`,
  );

  const byCategory: Record<string, number> = {};
  for (const r of releases) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  console.log("Per categoria:", byCategory);

  const bySource: Record<string, number> = { primaedicola: primaedicola.releases.length, tuttoinedicola: tuttoinedicola.releases.length };
  console.log("Per fonte:", bySource);

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, "series.json"), JSON.stringify(series, null, 2), "utf-8");
  await writeFile(
    path.join(DATA_DIR, "releases.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), releases }, null, 2),
    "utf-8",
  );
  console.log(`Scritti data/series.json e data/releases.json`);
}

main().catch((err) => {
  console.error("Scraping fallito:", err);
  process.exit(1);
});

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Release, Series } from "./types";

const CACHE_KEY_RELEASES = "cache:releases";
const CACHE_KEY_SERIES = "cache:series";

const bundledReleases = require("../../assets/data/releases.json") as {
  generatedAt: string;
  releases: Release[];
};
const bundledSeries = require("../../assets/data/series.json") as Series[];

export interface EdicolaData {
  generatedAt: string;
  releases: Release[];
  series: Series[];
  source: "remote" | "cache" | "bundled";
}

function getDataBaseUrl(): string | null {
  const extra = Constants.expoConfig?.extra as { dataBaseUrl?: string } | undefined;
  const url = extra?.dataBaseUrl;
  if (!url || url.includes("REPLACE_ME")) return null;
  return url;
}

export async function loadData(): Promise<EdicolaData> {
  const baseUrl = getDataBaseUrl();

  if (baseUrl) {
    try {
      const [releasesRes, seriesRes] = await Promise.all([
        fetch(`${baseUrl}/releases.json`),
        fetch(`${baseUrl}/series.json`),
      ]);
      if (releasesRes.ok && seriesRes.ok) {
        const releasesJson = (await releasesRes.json()) as { generatedAt: string; releases: Release[] };
        const seriesJson = (await seriesRes.json()) as Series[];
        await AsyncStorage.setItem(CACHE_KEY_RELEASES, JSON.stringify(releasesJson));
        await AsyncStorage.setItem(CACHE_KEY_SERIES, JSON.stringify(seriesJson));
        return {
          generatedAt: releasesJson.generatedAt,
          releases: releasesJson.releases,
          series: seriesJson,
          source: "remote",
        };
      }
    } catch {
      // rete non disponibile: proviamo con la cache locale
    }
  }

  try {
    const [cachedReleases, cachedSeries] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY_RELEASES),
      AsyncStorage.getItem(CACHE_KEY_SERIES),
    ]);
    if (cachedReleases && cachedSeries) {
      const releasesJson = JSON.parse(cachedReleases) as { generatedAt: string; releases: Release[] };
      const seriesJson = JSON.parse(cachedSeries) as Series[];
      return {
        generatedAt: releasesJson.generatedAt,
        releases: releasesJson.releases,
        series: seriesJson,
        source: "cache",
      };
    }
  } catch {
    // procede con i dati integrati nell'app
  }

  return {
    generatedAt: bundledReleases.generatedAt,
    releases: bundledReleases.releases,
    series: bundledSeries,
    source: "bundled",
  };
}

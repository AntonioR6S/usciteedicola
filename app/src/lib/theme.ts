import type { Category } from "./types";

export const CATEGORY_COLORS: Record<Category, string> = {
  fumetti: "#3B82F6",
  libri: "#8B5CF6",
  modellini: "#F59E0B",
  figures: "#EC4899",
  collezionabili: "#14B8A6",
};

const light = {
  background: "#F7F7F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F0F3",
  text: "#14151A",
  textMuted: "#6B6E76",
  border: "#E7E7EC",
  accent: "#2E6F40",
  accentSoft: "#E4F2E7",
};

const dark = {
  background: "#0E1013",
  surface: "#191B20",
  surfaceAlt: "#232630",
  text: "#F2F3F5",
  textMuted: "#9498A3",
  border: "#2A2D36",
  accent: "#4CAF6D",
  accentSoft: "#173323",
};

export type Theme = typeof light;
export type ColorScheme = "light" | "dark";

export function getThemeTokens(scheme: ColorScheme): Theme {
  return scheme === "dark" ? dark : light;
}

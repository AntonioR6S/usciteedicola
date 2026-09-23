export type Category = "fumetti" | "libri" | "modellini" | "figures" | "collezionabili" | "riviste";

export const CATEGORY_LABELS: Record<Category, string> = {
  fumetti: "Fumetti",
  libri: "Libri",
  modellini: "Modellini",
  figures: "Figures",
  collezionabili: "Collezionabili",
  riviste: "Riviste",
};

export const CATEGORY_ORDER: Category[] = [
  "fumetti",
  "libri",
  "modellini",
  "figures",
  "collezionabili",
  "riviste",
];

export interface Series {
  id: string;
  title: string;
  category: Category;
  publisher: string | null;
  imageUrl: string | null;
  totalIssues: number | null;
  sourceUrl: string;
}

export interface Release {
  id: string;
  seriesId: string;
  seriesTitle: string;
  category: Category;
  publisher: string | null;
  issueNumber: number | null;
  issueTitle: string | null;
  releaseDate: string;
  price: number | null;
  imageUrl: string | null;
  sourceUrl: string;
  projected?: boolean;
}

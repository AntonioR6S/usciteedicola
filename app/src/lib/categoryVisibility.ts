import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Category } from "./types";

const KEY = "hiddenCategories";

export async function getHiddenCategories(): Promise<Category[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Category[]) : [];
}

export async function toggleHiddenCategory(category: Category): Promise<Category[]> {
  const list = await getHiddenCategories();
  const next = list.includes(category) ? list.filter((c) => c !== category) : [...list, category];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

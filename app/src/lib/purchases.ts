import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "purchasedReleaseIds";

export async function getPurchasedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function togglePurchased(releaseId: string): Promise<string[]> {
  const ids = await getPurchasedIds();
  const next = ids.includes(releaseId) ? ids.filter((id) => id !== releaseId) : [...ids, releaseId];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

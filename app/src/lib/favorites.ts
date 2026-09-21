import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "followedSeriesIds";

export async function getFollowedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function toggleFollowed(seriesId: string): Promise<string[]> {
  const ids = await getFollowedIds();
  const next = ids.includes(seriesId) ? ids.filter((id) => id !== seriesId) : [...ids, seriesId];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

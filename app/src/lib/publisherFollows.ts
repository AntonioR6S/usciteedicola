import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "followedPublishers";

export async function getFollowedPublishers(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function toggleFollowedPublisher(publisher: string): Promise<string[]> {
  const list = await getFollowedPublishers();
  const next = list.includes(publisher) ? list.filter((p) => p !== publisher) : [...list, publisher];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

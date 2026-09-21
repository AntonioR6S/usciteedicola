import AsyncStorage from "@react-native-async-storage/async-storage";

const LEAD_DAYS_KEY = "notificationLeadDays";

export async function getNotificationLeadDays(): Promise<number> {
  const raw = await AsyncStorage.getItem(LEAD_DAYS_KEY);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function setNotificationLeadDays(days: number): Promise<void> {
  await AsyncStorage.setItem(LEAD_DAYS_KEY, String(days));
}

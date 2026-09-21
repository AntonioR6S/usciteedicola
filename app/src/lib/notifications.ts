import * as Notifications from "expo-notifications";
import type { Release } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

export const NOTIFICATION_LEAD_OPTIONS = [
  { days: 0, label: "Il giorno stesso" },
  { days: 1, label: "1 giorno prima" },
  { days: 2, label: "2 giorni prima" },
  { days: 7, label: "7 giorni prima" },
] as const;

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Ricrea da zero le notifiche locali per le prossime uscite delle collane seguite. */
export async function rescheduleFollowedNotifications(
  releases: Release[],
  followedSeriesIds: string[],
  leadDays = 0,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (followedSeriesIds.length === 0) return;

  const followedSet = new Set(followedSeriesIds);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcoming = releases
    .filter((r) => followedSet.has(r.seriesId) && new Date(r.releaseDate) >= todayStart)
    .slice(0, 60); // limite prudente per non saturare le notifiche pianificabili

  for (const release of upcoming) {
    const date = new Date(release.releaseDate);
    date.setDate(date.getDate() - leadDays);
    date.setHours(9, 0, 0, 0);
    if (date.getTime() <= Date.now()) continue;

    const dayNote = leadDays > 0 ? ` (tra ${leadDays} giorn${leadDays === 1 ? "o" : "i"})` : "";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `In edicola: ${release.seriesTitle}${dayNote}`,
        body: release.issueNumber
          ? `Numero ${release.issueNumber}${release.issueTitle ? " - " + release.issueTitle : ""}`
          : (release.issueTitle ?? "Nuova uscita disponibile"),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }
}

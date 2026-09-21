import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { loadData, type EdicolaData } from "./dataSource";
import { getFollowedIds, toggleFollowed as toggleFollowedStorage } from "./favorites";
import { getPurchasedIds, togglePurchased as togglePurchasedStorage } from "./purchases";
import { getNotificationLeadDays, setNotificationLeadDays } from "./preferences";
import { rescheduleFollowedNotifications, requestNotificationPermissions } from "./notifications";

interface DataContextValue {
  data: EdicolaData | null;
  loading: boolean;
  error: string | null;
  followedIds: string[];
  purchasedIds: string[];
  leadDays: number;
  refresh: () => Promise<void>;
  toggleFollow: (seriesId: string) => Promise<void>;
  togglePurchased: (releaseId: string) => Promise<void>;
  setLeadDays: (days: number) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EdicolaData | null>(null);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [leadDays, setLeadDaysState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loaded, followed, purchased, lead] = await Promise.all([
        loadData(),
        getFollowedIds(),
        getPurchasedIds(),
        getNotificationLeadDays(),
      ]);
      setData(loaded);
      setFollowedIds(followed);
      setPurchasedIds(purchased);
      setLeadDaysState(lead);
      rescheduleFollowedNotifications(loaded.releases, followed, lead).catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFollow = useCallback(
    async (seriesId: string) => {
      const wasFollowing = followedIds.includes(seriesId);
      const next = await toggleFollowedStorage(seriesId);
      setFollowedIds(next);
      if (!wasFollowing) {
        await requestNotificationPermissions().catch(() => false);
      }
      if (data) rescheduleFollowedNotifications(data.releases, next, leadDays).catch(() => {});
    },
    [data, followedIds, leadDays],
  );

  const togglePurchased = useCallback(async (releaseId: string) => {
    const next = await togglePurchasedStorage(releaseId);
    setPurchasedIds(next);
  }, []);

  const setLeadDays = useCallback(
    async (days: number) => {
      setLeadDaysState(days);
      await setNotificationLeadDays(days);
      if (data) rescheduleFollowedNotifications(data.releases, followedIds, days).catch(() => {});
    },
    [data, followedIds],
  );

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        followedIds,
        purchasedIds,
        leadDays,
        refresh,
        toggleFollow,
        togglePurchased,
        setLeadDays,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useEdicolaData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useEdicolaData deve essere usato dentro <DataProvider>");
  return ctx;
}

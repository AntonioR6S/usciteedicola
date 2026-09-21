import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { loadData, type EdicolaData } from "./dataSource";
import { getFollowedIds, toggleFollowed as toggleFollowedStorage } from "./favorites";
import { getFollowedPublishers, toggleFollowedPublisher as togglePublisherStorage } from "./publisherFollows";
import { getPurchasedIds, togglePurchased as togglePurchasedStorage } from "./purchases";
import { getNotificationLeadDays, setNotificationLeadDays } from "./preferences";
import { rescheduleFollowedNotifications, requestNotificationPermissions } from "./notifications";

interface DataContextValue {
  data: EdicolaData | null;
  loading: boolean;
  error: string | null;
  followedIds: string[];
  followedPublishers: string[];
  /** Unione di collane seguite esplicitamente + collane dei publisher seguiti. */
  effectiveFollowedIds: string[];
  purchasedIds: string[];
  leadDays: number;
  refresh: () => Promise<void>;
  toggleFollow: (seriesId: string) => Promise<void>;
  toggleFollowPublisher: (publisher: string) => Promise<void>;
  togglePurchased: (releaseId: string) => Promise<void>;
  setLeadDays: (days: number) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EdicolaData | null>(null);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followedPublishers, setFollowedPublishers] = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [leadDays, setLeadDaysState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveFollowedIds = useMemo(() => {
    if (!data) return followedIds;
    if (followedPublishers.length === 0) return followedIds;
    const publisherSet = new Set(followedPublishers);
    const viaPublisher = data.series.filter((s) => s.publisher && publisherSet.has(s.publisher)).map((s) => s.id);
    return Array.from(new Set([...followedIds, ...viaPublisher]));
  }, [data, followedIds, followedPublishers]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loaded, followed, publishers, purchased, lead] = await Promise.all([
        loadData(),
        getFollowedIds(),
        getFollowedPublishers(),
        getPurchasedIds(),
        getNotificationLeadDays(),
      ]);
      setData(loaded);
      setFollowedIds(followed);
      setFollowedPublishers(publishers);
      setPurchasedIds(purchased);
      setLeadDaysState(lead);
      const publisherSet = new Set(publishers);
      const viaPublisher = loaded.series.filter((s) => s.publisher && publisherSet.has(s.publisher)).map((s) => s.id);
      const effective = Array.from(new Set([...followed, ...viaPublisher]));
      rescheduleFollowedNotifications(loaded.releases, effective, lead).catch(() => {});
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
      if (data) {
        const publisherSet = new Set(followedPublishers);
        const viaPublisher = data.series.filter((s) => s.publisher && publisherSet.has(s.publisher)).map((s) => s.id);
        const effective = Array.from(new Set([...next, ...viaPublisher]));
        rescheduleFollowedNotifications(data.releases, effective, leadDays).catch(() => {});
      }
    },
    [data, followedIds, followedPublishers, leadDays],
  );

  const toggleFollowPublisher = useCallback(
    async (publisher: string) => {
      const wasFollowing = followedPublishers.includes(publisher);
      const next = await togglePublisherStorage(publisher);
      setFollowedPublishers(next);
      if (!wasFollowing) {
        await requestNotificationPermissions().catch(() => false);
      }
      if (data) {
        const publisherSet = new Set(next);
        const viaPublisher = data.series.filter((s) => s.publisher && publisherSet.has(s.publisher)).map((s) => s.id);
        const effective = Array.from(new Set([...followedIds, ...viaPublisher]));
        rescheduleFollowedNotifications(data.releases, effective, leadDays).catch(() => {});
      }
    },
    [data, followedIds, followedPublishers, leadDays],
  );

  const togglePurchased = useCallback(async (releaseId: string) => {
    const next = await togglePurchasedStorage(releaseId);
    setPurchasedIds(next);
  }, []);

  const setLeadDays = useCallback(
    async (days: number) => {
      setLeadDaysState(days);
      await setNotificationLeadDays(days);
      if (data) rescheduleFollowedNotifications(data.releases, effectiveFollowedIds, days).catch(() => {});
    },
    [data, effectiveFollowedIds],
  );

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        followedIds,
        followedPublishers,
        effectiveFollowedIds,
        purchasedIds,
        leadDays,
        refresh,
        toggleFollow,
        toggleFollowPublisher,
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

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { loadData, type EdicolaData } from "./dataSource";
import { getFollowedIds, toggleFollowed as toggleFollowedStorage } from "./favorites";
import { getFollowedPublishers, toggleFollowedPublisher as togglePublisherStorage } from "./publisherFollows";
import { getPurchasedIds, togglePurchased as togglePurchasedStorage } from "./purchases";
import { getNotificationLeadDays, setNotificationLeadDays } from "./preferences";
import { getHiddenCategories, toggleHiddenCategory } from "./categoryVisibility";
import { rescheduleFollowedNotifications, requestNotificationPermissions } from "./notifications";
import type { Category } from "./types";

interface DataContextValue {
  /** Dati già filtrati: le categorie nascoste dall'utente non compaiono. */
  data: EdicolaData | null;
  loading: boolean;
  error: string | null;
  followedIds: string[];
  followedPublishers: string[];
  /** Unione di collane seguite esplicitamente + collane dei publisher seguiti. */
  effectiveFollowedIds: string[];
  purchasedIds: string[];
  hiddenCategories: Category[];
  leadDays: number;
  refresh: () => Promise<void>;
  toggleFollow: (seriesId: string) => Promise<void>;
  toggleFollowPublisher: (publisher: string) => Promise<void>;
  togglePurchased: (releaseId: string) => Promise<void>;
  toggleCategoryHidden: (category: Category) => Promise<void>;
  setLeadDays: (days: number) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function filterByCategories(data: EdicolaData, hidden: Category[]): EdicolaData {
  if (hidden.length === 0) return data;
  const hiddenSet = new Set(hidden);
  return {
    ...data,
    releases: data.releases.filter((r) => !hiddenSet.has(r.category)),
    series: data.series.filter((s) => !hiddenSet.has(s.category)),
  };
}

function computeEffective(data: EdicolaData, followed: string[], publishers: string[]): string[] {
  const seriesIds = new Set(data.series.map((s) => s.id));
  const publisherSet = new Set(publishers);
  const viaPublisher = data.series.filter((s) => s.publisher && publisherSet.has(s.publisher)).map((s) => s.id);
  return Array.from(new Set([...followed, ...viaPublisher])).filter((id) => seriesIds.has(id));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<EdicolaData | null>(null);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followedPublishers, setFollowedPublishers] = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Category[]>([]);
  const [leadDays, setLeadDaysState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(
    () => (rawData ? filterByCategories(rawData, hiddenCategories) : null),
    [rawData, hiddenCategories],
  );

  const effectiveFollowedIds = useMemo(
    () => (data ? computeEffective(data, followedIds, followedPublishers) : followedIds),
    [data, followedIds, followedPublishers],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loaded, followed, publishers, purchased, lead, hidden] = await Promise.all([
        loadData(),
        getFollowedIds(),
        getFollowedPublishers(),
        getPurchasedIds(),
        getNotificationLeadDays(),
        getHiddenCategories(),
      ]);
      setRawData(loaded);
      setFollowedIds(followed);
      setFollowedPublishers(publishers);
      setPurchasedIds(purchased);
      setLeadDaysState(lead);
      setHiddenCategories(hidden);
      const visible = filterByCategories(loaded, hidden);
      rescheduleFollowedNotifications(visible.releases, computeEffective(visible, followed, publishers), lead).catch(
        () => {},
      );
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
        rescheduleFollowedNotifications(data.releases, computeEffective(data, next, followedPublishers), leadDays).catch(
          () => {},
        );
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
        rescheduleFollowedNotifications(data.releases, computeEffective(data, followedIds, next), leadDays).catch(
          () => {},
        );
      }
    },
    [data, followedIds, followedPublishers, leadDays],
  );

  const togglePurchased = useCallback(async (releaseId: string) => {
    const next = await togglePurchasedStorage(releaseId);
    setPurchasedIds(next);
  }, []);

  const toggleCategoryHidden = useCallback(
    async (category: Category) => {
      const next = await toggleHiddenCategory(category);
      setHiddenCategories(next);
      if (rawData) {
        const visible = filterByCategories(rawData, next);
        rescheduleFollowedNotifications(
          visible.releases,
          computeEffective(visible, followedIds, followedPublishers),
          leadDays,
        ).catch(() => {});
      }
    },
    [rawData, followedIds, followedPublishers, leadDays],
  );

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
        hiddenCategories,
        leadDays,
        refresh,
        toggleFollow,
        toggleFollowPublisher,
        togglePurchased,
        toggleCategoryHidden,
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

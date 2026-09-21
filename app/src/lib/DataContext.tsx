import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { loadData, type EdicolaData } from "./dataSource";
import { getFollowedIds, toggleFollowed as toggleFollowedStorage } from "./favorites";
import { rescheduleFollowedNotifications } from "./notifications";

interface DataContextValue {
  data: EdicolaData | null;
  loading: boolean;
  error: string | null;
  followedIds: string[];
  refresh: () => Promise<void>;
  toggleFollow: (seriesId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EdicolaData | null>(null);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loaded, followed] = await Promise.all([loadData(), getFollowedIds()]);
      setData(loaded);
      setFollowedIds(followed);
      rescheduleFollowedNotifications(loaded.releases, followed).catch(() => {});
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
      const next = await toggleFollowedStorage(seriesId);
      setFollowedIds(next);
      if (data) rescheduleFollowedNotifications(data.releases, next).catch(() => {});
    },
    [data],
  );

  return (
    <DataContext.Provider value={{ data, loading, error, followedIds, refresh, toggleFollow }}>
      {children}
    </DataContext.Provider>
  );
}

export function useEdicolaData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useEdicolaData deve essere usato dentro <DataProvider>");
  return ctx;
}

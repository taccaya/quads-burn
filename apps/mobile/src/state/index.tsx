import type { HeatLogStoreV1, HeatSessionLog } from '@company/domain';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loadHeatLogs, saveHeatLogs } from '@/features/squat-heat/services/heatLogRepository';
import { getEmptyHeatLogStore, sortHeatSessionsDescending } from '@/features/squat-heat/store/heatLogStore';

type HeatLogsContextValue = {
  isReady: boolean;
  sessions: HeatSessionLog[];
  addSession: (session: HeatSessionLog) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const HeatLogsContext = createContext<HeatLogsContextValue | null>(null);

export function HeatLogsProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [store, setStore] = useState<HeatLogStoreV1>(() => getEmptyHeatLogStore());
  const storeRef = useRef(store);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const reload = useCallback(async () => {
    const loaded = await loadHeatLogs();
    const nextStore: HeatLogStoreV1 = {
      ...loaded,
      sessions: sortHeatSessionsDescending(loaded.sessions)
    };
    storeRef.current = nextStore;
    setStore(nextStore);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await reload();
      if (mounted) {
        setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reload]);

  const addSession = useCallback(async (session: HeatSessionLog) => {
    const nextStore: HeatLogStoreV1 = {
      ...storeRef.current,
      sessions: sortHeatSessionsDescending([session, ...storeRef.current.sessions])
    };
    storeRef.current = nextStore;
    setStore(nextStore);
    await saveHeatLogs(nextStore);
  }, []);

  const removeSession = useCallback(async (id: string) => {
    const nextStore: HeatLogStoreV1 = {
      ...storeRef.current,
      sessions: storeRef.current.sessions.filter((session) => session.id !== id)
    };
    storeRef.current = nextStore;
    setStore(nextStore);
    await saveHeatLogs(nextStore);
  }, []);

  const value = useMemo<HeatLogsContextValue>(
    () => ({
      isReady,
      sessions: store.sessions,
      addSession,
      removeSession,
      reload
    }),
    [addSession, isReady, reload, removeSession, store.sessions]
  );

  return <HeatLogsContext.Provider value={value}>{children}</HeatLogsContext.Provider>;
}

export function useHeatLogs() {
  const context = useContext(HeatLogsContext);
  if (!context) {
    throw new Error('useHeatLogs must be used inside HeatLogsProvider.');
  }
  return context;
}

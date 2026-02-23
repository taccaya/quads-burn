import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HeatLogStoreV1 } from '@company/domain';
import { getEmptyHeatLogStore, HEAT_LOG_STORAGE_KEY } from '../store/heatLogStore';

function isSessionArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object');
}

function isHeatLogStoreV1(value: unknown): value is HeatLogStoreV1 {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<HeatLogStoreV1>;
  return candidate.version === 1 && isSessionArray(candidate.sessions);
}

export async function loadHeatLogs(): Promise<HeatLogStoreV1> {
  try {
    const raw = await AsyncStorage.getItem(HEAT_LOG_STORAGE_KEY);
    if (!raw) {
      return getEmptyHeatLogStore();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isHeatLogStoreV1(parsed)) {
      return getEmptyHeatLogStore();
    }

    return parsed;
  } catch {
    return getEmptyHeatLogStore();
  }
}

export async function saveHeatLogs(store: HeatLogStoreV1): Promise<void> {
  await AsyncStorage.setItem(HEAT_LOG_STORAGE_KEY, JSON.stringify(store));
}

export async function deleteHeatLog(id: string): Promise<void> {
  const store = await loadHeatLogs();
  const nextStore: HeatLogStoreV1 = {
    ...store,
    sessions: store.sessions.filter((session) => session.id !== id)
  };
  await saveHeatLogs(nextStore);
}

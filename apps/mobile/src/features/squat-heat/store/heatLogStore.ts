import { createEmptyHeatLogStore, type HeatLogStoreV1, type HeatSessionLog } from '@company/domain';

export const HEAT_LOG_STORAGE_KEY = '@quads-burn/squat-heat-log-store/v1';

export function getEmptyHeatLogStore(): HeatLogStoreV1 {
  return createEmptyHeatLogStore();
}

export function sortHeatSessionsDescending(sessions: HeatSessionLog[]) {
  return [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

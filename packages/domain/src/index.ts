export type { ExampleEntity } from './example';
export {
  SQUAT_HEAT_PROTOCOL,
  computeDailyBest,
  computeSessionTotals,
  computeWeeklyStats,
  createEmptyHeatLogStore,
  createHeatSessionLog,
  normalizeIntervalReps,
  sortSessionsDescending
} from './squatHeat';
export type {
  DailyBestStats,
  HeatLogStoreV1,
  HeatProtocol,
  HeatSessionDraft,
  HeatSessionLog,
  SessionTotals,
  WeeklyStats
} from './squatHeat';

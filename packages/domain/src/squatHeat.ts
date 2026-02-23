const MONDAY_INDEX = 1;
const SUNDAY_INDEX = 0;

export type HeatProtocol = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  totalSeconds: number;
  defaultRepCount: number;
};

export const SQUAT_HEAT_PROTOCOL: HeatProtocol = Object.freeze({
  workSeconds: 20,
  restSeconds: 10,
  rounds: 8,
  totalSeconds: 240,
  defaultRepCount: 20
});

export type HeatSessionLog = {
  id: string;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  intervalReps: number[];
  totalReps: number;
  bestIntervalReps: number;
};

export type HeatSessionDraft = {
  startedAt: string;
  completedAt: string;
  intervalReps: number[];
  durationSec?: number;
};

export type HeatLogStoreV1 = {
  version: 1;
  sessions: HeatSessionLog[];
};

export type SessionTotals = {
  totalReps: number;
  bestIntervalReps: number;
};

export type DailyBestStats = {
  dateKey: string;
  sessionCount: number;
  totalReps: number;
  bestTotalReps: number;
};

export type WeeklyStats = {
  weekStartDate: string;
  weekEndDate: string;
  sessionCount: number;
  totalReps: number;
  bestTotalReps: number;
  goalSessions: number;
  goalMet: boolean;
};

function clampNonNegativeInt(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
}

function toLocalDateKey(input: Date) {
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, '0');
  const day = `${input.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(input: string) {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function startOfIsoWeek(input: Date) {
  const start = new Date(input);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === SUNDAY_INDEX ? -6 : MONDAY_INDEX - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function sortByStartedAtDesc(a: HeatSessionLog, b: HeatSessionLog) {
  return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
}

export function createEmptyHeatLogStore(): HeatLogStoreV1 {
  return {
    version: 1,
    sessions: []
  };
}

export function normalizeIntervalReps(
  intervalReps: number[],
  rounds = SQUAT_HEAT_PROTOCOL.rounds,
  fallback = SQUAT_HEAT_PROTOCOL.defaultRepCount
) {
  return Array.from({ length: rounds }, (_, index) => {
    const value = intervalReps[index];
    if (typeof value !== 'number') {
      return fallback;
    }
    return clampNonNegativeInt(value);
  });
}

export function computeSessionTotals(intervalReps: number[]): SessionTotals {
  let totalReps = 0;
  let bestIntervalReps = 0;

  for (const value of intervalReps) {
    const normalized = clampNonNegativeInt(value);
    totalReps += normalized;
    if (normalized > bestIntervalReps) {
      bestIntervalReps = normalized;
    }
  }

  return {
    totalReps,
    bestIntervalReps
  };
}

export function createHeatSessionLog(draft: HeatSessionDraft): HeatSessionLog {
  const intervalReps = normalizeIntervalReps(draft.intervalReps);
  const totals = computeSessionTotals(intervalReps);
  const completedTime = parseDate(draft.completedAt).getTime();
  const id = `heat-${completedTime}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
    durationSec: draft.durationSec ?? SQUAT_HEAT_PROTOCOL.totalSeconds,
    intervalReps,
    totalReps: totals.totalReps,
    bestIntervalReps: totals.bestIntervalReps
  };
}

export function computeDailyBest(sessions: HeatSessionLog[]) {
  const statsByDate: Record<string, DailyBestStats> = {};

  for (const session of sessions) {
    const key = toLocalDateKey(parseDate(session.startedAt));
    const current = statsByDate[key];

    if (!current) {
      statsByDate[key] = {
        dateKey: key,
        sessionCount: 1,
        totalReps: session.totalReps,
        bestTotalReps: session.totalReps
      };
      continue;
    }

    current.sessionCount += 1;
    current.totalReps += session.totalReps;
    current.bestTotalReps = Math.max(current.bestTotalReps, session.totalReps);
  }

  return statsByDate;
}

export function computeWeeklyStats(
  sessions: HeatSessionLog[],
  now: Date = new Date(),
  goalSessions = 3
): WeeklyStats {
  const weekStart = startOfIsoWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  let sessionCount = 0;
  let totalReps = 0;
  let bestTotalReps = 0;

  for (const session of sessions) {
    const startedAt = parseDate(session.startedAt).getTime();
    if (startedAt < weekStart.getTime() || startedAt > weekEnd.getTime()) {
      continue;
    }

    sessionCount += 1;
    totalReps += session.totalReps;
    bestTotalReps = Math.max(bestTotalReps, session.totalReps);
  }

  return {
    weekStartDate: toLocalDateKey(weekStart),
    weekEndDate: toLocalDateKey(weekEnd),
    sessionCount,
    totalReps,
    bestTotalReps,
    goalSessions,
    goalMet: sessionCount >= goalSessions
  };
}

export function sortSessionsDescending(sessions: HeatSessionLog[]) {
  return [...sessions].sort(sortByStartedAtDesc);
}

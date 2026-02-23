import type { HeatSessionLog } from '@company/domain';
import { formatLocalTime, toDateKey } from './date';

const header = [
  'date',
  'time',
  'total_reps',
  'best_interval',
  'interval_1',
  'interval_2',
  'interval_3',
  'interval_4',
  'interval_5',
  'interval_6',
  'interval_7',
  'interval_8',
  'duration_sec'
].join(',');

export function buildHeatSessionsCsv(sessions: HeatSessionLog[]) {
  const lines = sessions.map((session) => {
    const intervals = Array.from({ length: 8 }, (_, index) => session.intervalReps[index] ?? 0);
    return [
      toDateKey(session.startedAt),
      formatLocalTime(session.startedAt),
      session.totalReps,
      session.bestIntervalReps,
      ...intervals,
      session.durationSec
    ].join(',');
  });

  return [header, ...lines].join('\n');
}

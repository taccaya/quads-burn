import type { WeeklyStats } from '@company/domain';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/design-system';

type WeeklyGoalCardProps = {
  stats: WeeklyStats;
};

export function WeeklyGoalCard({ stats }: WeeklyGoalCardProps) {
  const progress = Math.min(1, stats.sessionCount / Math.max(1, stats.goalSessions));
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>今週の目標</Text>
      <View style={styles.valueRow}>
        <Text style={styles.valueMain}>{stats.sessionCount}</Text>
        <Text style={styles.valueSub}> / {stats.goalSessions} 回</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.percentage}>{percentage}%</Text>
      <Text style={styles.meta}>
        期間: {stats.weekStartDate} - {stats.weekEndDate}
      </Text>
      <Text style={styles.meta}>
        合計回数: {stats.totalReps} / 最高: {stats.bestTotalReps}
      </Text>
      <Text style={[styles.status, stats.goalMet ? styles.statusDone : styles.statusPending]}>
        {stats.goalMet ? '今週の目標を達成しています' : '週3回を目標に続けましょう'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  valueMain: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 38,
    fontVariant: ['tabular-nums']
  },
  valueSub: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    paddingBottom: 3
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#e2e8f0'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a'
  },
  percentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534'
  },
  meta: {
    fontSize: 13,
    color: '#475569'
  },
  status: {
    fontSize: 14,
    fontWeight: '600'
  },
  statusDone: {
    color: '#166534'
  },
  statusPending: {
    color: '#92400e'
  }
});

import type { HeatSessionLog } from '@company/domain';
import { StyleSheet } from 'react-native';
import { Button, Text, View } from '@/design-system';
import { formatLocalTime } from '../utils/date';

type SessionListItemProps = {
  session: HeatSessionLog;
  onDelete?: (id: string) => void;
};

export function SessionListItem({ session, onDelete }: SessionListItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>開始</Text>
        <Text style={styles.time}>{formatLocalTime(session.startedAt)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.total}>合計 {session.totalReps} 回</Text>
        <Text style={styles.best}>最高 {session.bestIntervalReps} 回</Text>
      </View>
      <Text style={styles.intervals}>区間: {session.intervalReps.join(' / ')}</Text>
      {onDelete ? (
        <Button
          onPress={() => onDelete(session.id)}
          style={styles.deleteButton}
          textStyle={styles.deleteButtonText}
        >
          この記録を削除
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 6
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  date: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  time: {
    color: '#475569',
    fontSize: 13
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  total: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800'
  },
  best: {
    color: '#0b4a6f',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderCurve: 'continuous'
  },
  intervals: {
    color: '#334155',
    fontSize: 12
  },
  deleteButton: {
    marginTop: 6,
    minHeight: 36,
    backgroundColor: '#ffffff'
  },
  deleteButtonText: {
    color: '#be123c',
    fontSize: 12,
    textDecorationLine: 'underline'
  }
});

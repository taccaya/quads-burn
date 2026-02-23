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
        <Text style={styles.date}>開始時刻</Text>
        <Text style={styles.time}>{formatLocalTime(session.startedAt)}</Text>
      </View>
      <Text style={styles.total}>合計 {session.totalReps} 回</Text>
      <Text style={styles.meta}>最高区間 {session.bestIntervalReps} 回</Text>
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
  total: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800'
  },
  meta: {
    color: '#475569',
    fontSize: 13
  },
  intervals: {
    color: '#334155',
    fontSize: 12
  },
  deleteButton: {
    marginTop: 6,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1
  },
  deleteButtonText: {
    color: '#be123c'
  }
});

import type { HeatTimerPhase, HeatTimerStatus } from '../hooks/useHeatTimer';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/design-system';

type HeatTimerCardProps = {
  status: HeatTimerStatus;
  phase: HeatTimerPhase;
  roundNumber: number;
  totalRounds: number;
  remainingPhaseSeconds: number;
  remainingTotalSeconds: number;
};

function formatAsClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
}

function labelForPhase(status: HeatTimerStatus, phase: HeatTimerPhase) {
  if (status === 'idle') {
    return '準備';
  }
  if (status === 'completed') {
    return '完了';
  }
  return phase === 'work' ? 'スクワット' : '休憩';
}

function cardStyleForPhase(status: HeatTimerStatus, phase: HeatTimerPhase) {
  if (status === 'running' && phase === 'work') {
    return {
      backgroundColor: '#fef2f2'
    };
  }

  if (status === 'running' && phase === 'rest') {
    return {
      backgroundColor: '#eff6ff'
    };
  }

  if (status === 'completed') {
    return {
      backgroundColor: '#ecfdf5'
    };
  }

  return {
    backgroundColor: '#ffffff'
  };
}

export function HeatTimerCard({
  status,
  phase,
  roundNumber,
  totalRounds,
  remainingPhaseSeconds,
  remainingTotalSeconds
}: HeatTimerCardProps) {
  return (
    <View style={[styles.card, cardStyleForPhase(status, phase)]}>
      <View style={styles.row}>
        <Text style={styles.phase}>{labelForPhase(status, phase)}</Text>
        <Text style={styles.round}>
          ラウンド {Math.min(roundNumber, totalRounds)} / {totalRounds}
        </Text>
      </View>
      <Text style={styles.totalTimer}>{formatAsClock(remainingTotalSeconds)}</Text>
      <Text style={styles.phaseTimer}>区間残り {formatAsClock(Math.max(remainingPhaseSeconds, 0))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 20,
    gap: 10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  phase: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a'
  },
  round: {
    fontSize: 13,
    color: '#475569'
  },
  totalTimer: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
    fontVariant: ['tabular-nums']
  },
  phaseTimer: {
    fontSize: 14,
    color: '#475569',
    fontVariant: ['tabular-nums']
  }
});

import type { HeatTimerPhase, HeatTimerStatus } from '../hooks/useHeatTimer';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/design-system';

type HeatTimerCardProps = {
  status: HeatTimerStatus;
  phase: HeatTimerPhase;
  roundIndex: number;
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
      backgroundColor: '#dc2626'
    };
  }

  if (status === 'running' && phase === 'rest') {
    return {
      backgroundColor: '#2563eb'
    };
  }

  if (status === 'completed') {
    return {
      backgroundColor: '#16a34a'
    };
  }

  return {
    backgroundColor: '#1e293b'
  };
}

function getCompletedRoundCount(
  status: HeatTimerStatus,
  phase: HeatTimerPhase,
  roundIndex: number,
  totalRounds: number
) {
  if (status === 'idle') {
    return 0;
  }

  if (status === 'completed') {
    return totalRounds;
  }

  if (phase === 'rest') {
    return Math.min(totalRounds, roundIndex + 1);
  }

  return Math.min(totalRounds, roundIndex);
}

export function HeatTimerCard({
  status,
  phase,
  roundIndex,
  roundNumber,
  totalRounds,
  remainingPhaseSeconds,
  remainingTotalSeconds
}: HeatTimerCardProps) {
  const completedRounds = getCompletedRoundCount(status, phase, roundIndex, totalRounds);

  return (
    <View style={[styles.card, cardStyleForPhase(status, phase)]}>
      <View style={styles.row}>
        <View style={styles.phaseBadge}>
          <Text style={styles.phase}>{labelForPhase(status, phase)}</Text>
        </View>
        <Text style={styles.round}>
          ラウンド {Math.min(roundNumber, totalRounds)} / {totalRounds}
        </Text>
      </View>
      <Text style={styles.totalTimer}>{formatAsClock(remainingTotalSeconds)}</Text>
      <Text style={styles.phaseTimer}>区間残り {formatAsClock(Math.max(remainingPhaseSeconds, 0))}</Text>
      <View style={styles.dots}>
        {Array.from({ length: totalRounds }, (_, index) => (
          <View
            key={`round-dot-${index}`}
            style={[styles.dot, index < completedRounds ? styles.dotCompleted : styles.dotPending]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 22,
    gap: 10,
    shadowColor: '#020617',
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  phaseBadge: {
    borderRadius: 999,
    borderCurve: 'continuous',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  phase: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  round: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600'
  },
  totalTimer: {
    fontSize: 64,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    fontVariant: ['tabular-nums']
  },
  phaseTimer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontVariant: ['tabular-nums']
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderCurve: 'continuous'
  },
  dotCompleted: {
    backgroundColor: 'rgba(255,255,255,0.92)'
  },
  dotPending: {
    backgroundColor: 'rgba(255,255,255,0.32)'
  }
});

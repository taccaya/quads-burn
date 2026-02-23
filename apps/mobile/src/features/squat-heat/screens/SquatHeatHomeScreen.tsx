import {
  SQUAT_HEAT_PROTOCOL,
  computeDailyBest,
  computeSessionTotals,
  computeWeeklyStats,
  createHeatSessionLog,
  type HeatSessionDraft
} from '@company/domain';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button, Screen, Text, View } from '@/design-system';
import { env } from '@/lib/env';
import { useHeatTimer } from '../hooks/useHeatTimer';
import { playCue, releaseCueAudio } from '../services/soundService';
import { HeatTimerCard } from '../components/HeatTimerCard';
import { IntervalRepInput } from '../components/IntervalRepInput';
import { WeeklyGoalCard } from '../components/WeeklyGoalCard';
import { toDateKey } from '../utils/date';
import { useHeatLogs } from '@/state';

export function SquatHeatHomeScreen() {
  const router = useRouter();
  const { isReady, sessions, addSession } = useHeatLogs();

  const handleSessionComplete = useCallback(
    (draft: HeatSessionDraft) => {
      const log = createHeatSessionLog(draft);
      void addSession(log);
    },
    [addSession]
  );

  const timer = useHeatTimer({
    onSessionComplete: handleSessionComplete
  });

  useEffect(() => {
    if (!timer.latestCue) {
      return;
    }
    void playCue(timer.latestCue);
  }, [timer.latestCue]);

  useEffect(() => {
    return () => {
      void releaseCueAudio();
    };
  }, []);

  const totals = useMemo(() => computeSessionTotals(timer.intervalReps), [timer.intervalReps]);
  const todayKey = toDateKey(new Date());
  const dailyBest = useMemo(() => computeDailyBest(sessions), [sessions]);
  const todayStats = dailyBest[todayKey];
  const weeklyStats = useMemo(() => computeWeeklyStats(sessions, new Date(), 3), [sessions]);

  const startOrReset = () => {
    if (timer.status === 'running') {
      Alert.alert('セッションを中止しますか？', 'このセッションの記録は保存されません。', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '中止', style: 'destructive', onPress: timer.reset }
      ]);
      return;
    }
    timer.start();
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>QUADS BURN</Text>
        </View>
        <Text style={styles.title}>{env.appName}</Text>
        <Text style={styles.subtitle}>4分で完了。20秒運動 / 10秒休憩 x 8ラウンド</Text>
      </View>

      <HeatTimerCard
        status={timer.status}
        phase={timer.phase}
        roundIndex={timer.roundIndex}
        roundNumber={timer.roundNumber}
        totalRounds={SQUAT_HEAT_PROTOCOL.rounds}
        remainingPhaseSeconds={timer.remainingPhaseSeconds}
        remainingTotalSeconds={timer.remainingTotalSeconds}
      />

      <Button
        onPress={startOrReset}
        style={[
          styles.startButton,
          timer.status === 'running'
            ? styles.abortButton
            : timer.status === 'completed'
              ? styles.restartButton
              : styles.startIdleButton
        ]}
      >
        {timer.status === 'running'
          ? 'セッションを中止'
          : timer.status === 'completed'
            ? 'もう一度スタート'
            : 'スタート'}
      </Button>

      <Button
        onPress={() => router.push('/history')}
        style={styles.historyButton}
        textStyle={styles.historyButtonText}
      >
        履歴とカレンダー
      </Button>

      {timer.editableRoundIndex !== null ? (
        <IntervalRepInput
          roundNumber={timer.editableRoundIndex + 1}
          value={timer.intervalReps[timer.editableRoundIndex]}
          onChange={(value) => timer.setRepForRound(timer.editableRoundIndex ?? 0, value)}
        />
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            休憩中に回数を入力します。未入力時はデフォルトで20回として記録されます。
          </Text>
        </View>
      )}

      {timer.status !== 'running' ? (
        <>
          <View style={styles.todayCard}>
            <Text style={styles.sectionTitle}>今日の記録</Text>
            <Text style={styles.todayText}>現在のセッション合計: {totals.totalReps} 回</Text>
            <Text style={styles.todayText}>
              保存済みセッション: {todayStats ? `${todayStats.sessionCount} 件` : '0 件'}
            </Text>
            <Text style={styles.todayText}>
              日別ベスト: {todayStats ? `${todayStats.bestTotalReps} 回` : '-'}
            </Text>
          </View>

          <WeeklyGoalCard stats={weeklyStats} />
        </>
      ) : null}

      {!isReady ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>ログを読み込んでいます...</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  header: {
    gap: 6
  },
  brandPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    borderCurve: 'continuous',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991b1b',
    letterSpacing: 0.9
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 14,
    color: '#334155'
  },
  startButton: {
    minHeight: 64,
    borderRadius: 14
  },
  startIdleButton: {
    backgroundColor: '#16a34a'
  },
  abortButton: {
    backgroundColor: '#dc2626'
  },
  restartButton: {
    backgroundColor: '#0f766e'
  },
  historyButton: {
    minHeight: 42,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d1d5db'
  },
  historyButtonText: {
    color: '#334155',
    fontWeight: '600'
  },
  infoCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 14
  },
  infoText: {
    color: '#92400e',
    fontSize: 13
  },
  todayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 6
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700'
  },
  todayText: {
    color: '#334155',
    fontSize: 14
  }
});

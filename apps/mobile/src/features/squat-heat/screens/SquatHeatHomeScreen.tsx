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
        <Text style={styles.title}>スクワットヒート</Text>
        <Text style={styles.subtitle}>20秒運動 / 10秒休憩 x 8ラウンド (4分)</Text>
      </View>

      <HeatTimerCard
        status={timer.status}
        phase={timer.phase}
        roundNumber={timer.roundNumber}
        totalRounds={SQUAT_HEAT_PROTOCOL.rounds}
        remainingPhaseSeconds={timer.remainingPhaseSeconds}
        remainingTotalSeconds={timer.remainingTotalSeconds}
      />

      <Button
        onPress={startOrReset}
        style={[
          styles.startButton,
          timer.status === 'running' ? styles.abortButton : styles.startIdleButton
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
        履歴とカレンダーを見る
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
    gap: 12
  },
  header: {
    gap: 4
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 13,
    color: '#475569'
  },
  startButton: {
    minHeight: 56
  },
  startIdleButton: {
    backgroundColor: '#15803d'
  },
  abortButton: {
    backgroundColor: '#dc2626'
  },
  historyButton: {
    minHeight: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  historyButtonText: {
    color: '#334155',
    fontWeight: '600'
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 14
  },
  infoText: {
    color: '#475569',
    fontSize: 13
  },
  todayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
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

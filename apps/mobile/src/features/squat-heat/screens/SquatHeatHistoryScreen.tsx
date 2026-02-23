import { SQUAT_HEAT_PROTOCOL, computeDailyBest, createHeatSessionLog } from '@company/domain';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Button, Screen, Text, View } from '@/design-system';
import { env } from '@/lib/env';
import { syncSessionToAppleHealth } from '../services/appleHealthService';
import { exportHeatLogsAsCsv, exportHeatLogsAsJson } from '../services/exportService';
import { ManualSessionEntryCard, type ManualSessionInput } from '../components/ManualSessionEntryCard';
import { SessionListItem } from '../components/SessionListItem';
import { toDateKey } from '../utils/date';
import { useHeatLogs } from '@/state';

type MarkedDate = {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
};

export function SquatHeatHistoryScreen() {
  const { sessions, removeSession, addSession } = useHeatLogs();
  const screenRef = useRef<ScrollView | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isManualFormVisible, setIsManualFormVisible] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [shouldScrollToManualForm, setShouldScrollToManualForm] = useState(false);

  const dailyBest = useMemo(() => computeDailyBest(sessions), [sessions]);
  const selectedDaily = dailyBest[selectedDate];

  const sessionsForSelectedDay = useMemo(
    () => sessions.filter((session) => toDateKey(session.startedAt) === selectedDate),
    [selectedDate, sessions]
  );

  const markedDates = useMemo<Record<string, MarkedDate>>(() => {
    const marks: Record<string, MarkedDate> = {};
    for (const key of Object.keys(dailyBest)) {
      marks[key] = {
        marked: true,
        dotColor: '#dc2626'
      };
    }

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: '#0f172a',
      selectedTextColor: '#ffffff'
    };

    return marks;
  }, [dailyBest, selectedDate]);

  const confirmDelete = (id: string) => {
    Alert.alert('記録を削除しますか？', 'この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          void removeSession(id);
        }
      }
    ]);
  };

  const submitManualSession = useCallback(
    async ({ startedAtIso, intervalReps }: ManualSessionInput) => {
      const startedAt = new Date(startedAtIso);
      if (Number.isNaN(startedAt.getTime())) {
        Alert.alert('保存に失敗しました', '開始日時が正しくありません。');
        throw new Error('Invalid manual session datetime.');
      }

      const completedAt = new Date(startedAt.getTime() + SQUAT_HEAT_PROTOCOL.totalSeconds * 1000);
      const log = createHeatSessionLog({
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationSec: SQUAT_HEAT_PROTOCOL.totalSeconds,
        intervalReps
      });

      setIsSubmittingManual(true);

      try {
        await addSession(log);
        const syncResult = await syncSessionToAppleHealth(log);
        if (__DEV__ && syncResult === 'failed') {
          console.warn('[QuadsBurn] Manual session did not sync to Apple Health.');
        }
        setIsManualFormVisible(false);
        Alert.alert('保存しました', '手動でセッション記録を追加しました。');
      } catch (error) {
        Alert.alert('保存に失敗しました', '手動登録に失敗しました。');
        throw error;
      } finally {
        setIsSubmittingManual(false);
      }
    },
    [addSession]
  );

  const runExportJson = async () => {
    try {
      await exportHeatLogsAsJson(sessions);
    } catch {
      Alert.alert('エクスポートに失敗しました', 'JSONの共有に失敗しました。');
    }
  };

  const runExportCsv = async () => {
    try {
      await exportHeatLogsAsCsv(sessions);
    } catch {
      Alert.alert('エクスポートに失敗しました', 'CSVの共有に失敗しました。');
    }
  };

  const openExportMenu = () => {
    Alert.alert('エクスポート形式', '共有したい形式を選択してください。', [
      { text: 'JSON', onPress: () => void runExportJson() },
      { text: 'CSV', onPress: () => void runExportCsv() },
      { text: 'キャンセル', style: 'cancel' }
    ]);
  };

  const toggleManualForm = () => {
    setIsManualFormVisible((previous) => {
      const next = !previous;
      if (next) {
        setShouldScrollToManualForm(true);
      }
      return next;
    });
  };

  const onManualFormLayout = (event: LayoutChangeEvent) => {
    if (!shouldScrollToManualForm) {
      return;
    }
    const y = Math.max(event.nativeEvent.layout.y - 12, 0);
    screenRef.current?.scrollTo({ y, animated: true });
    setShouldScrollToManualForm(false);
  };

  return (
    <Screen scrollRef={screenRef} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>{env.appName.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>履歴とカレンダー</Text>
        <Text style={styles.subtitle}>日ごとの成績を確認し、全ログを共有できます</Text>
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          enableSwipeMonths
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            todayTextColor: '#dc2626',
            dayTextColor: '#0f172a',
            textDisabledColor: '#cbd5e1',
            arrowColor: '#0f172a',
            monthTextColor: '#0f172a',
            textMonthFontWeight: '700',
            textDayHeaderFontSize: 12,
            textDayFontSize: 14,
            textMonthFontSize: 16
          }}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>選択日: {selectedDate}</Text>
        <Text style={styles.summaryText}>
          記録件数: {selectedDaily ? `${selectedDaily.sessionCount} 件` : '0 件'}
        </Text>
        <Text style={styles.summaryText}>
          日別ベスト: {selectedDaily ? `${selectedDaily.bestTotalReps} 回` : '-'}
        </Text>
      </View>

      <View style={styles.manualActionRow}>
        <Button
          onPress={toggleManualForm}
          style={styles.manualActionButton}
          textStyle={styles.manualActionButtonText}
        >
          {isManualFormVisible ? '手動登録フォームを閉じる' : '手動で記録を追加'}
        </Button>
      </View>

      {isManualFormVisible ? (
        <View onLayout={onManualFormLayout}>
          <ManualSessionEntryCard
            selectedDate={selectedDate}
            isSubmitting={isSubmittingManual}
            onSubmit={submitManualSession}
          />
        </View>
      ) : null}

      <View style={styles.exportRow}>
        <Button onPress={openExportMenu} style={styles.exportButton}>
          全ログをエクスポート
        </Button>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>当日のセッション</Text>
        {sessionsForSelectedDay.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>この日の記録はありません。</Text>
          </View>
        ) : (
          sessionsForSelectedDay.map((session) => (
            <SessionListItem key={session.id} session={session} onDelete={confirmDelete} />
          ))
        )}
      </View>
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
    fontSize: 30,
    color: '#0f172a',
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 14,
    color: '#334155'
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 6
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700'
  },
  summaryText: {
    color: '#334155',
    fontSize: 14
  },
  manualActionRow: {
    flexDirection: 'row'
  },
  manualActionButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  manualActionButtonText: {
    color: '#0369a1',
    fontWeight: '700'
  },
  exportRow: {
    flexDirection: 'row'
  },
  exportButton: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#0f172a'
  },
  listSection: {
    gap: 8
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 14
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13
  }
});

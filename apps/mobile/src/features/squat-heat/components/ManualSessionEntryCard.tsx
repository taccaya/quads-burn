import { SQUAT_HEAT_PROTOCOL } from '@company/domain';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput as NativeTextInput, type TextInput as RNTextInput } from 'react-native';
import { Button, Text, View } from '@/design-system';

export type ManualSessionInput = {
  startedAtIso: string;
  intervalReps: number[];
};

type ManualSessionEntryCardProps = {
  selectedDate: string;
  isSubmitting: boolean;
  onSubmit: (input: ManualSessionInput) => Promise<void> | void;
};

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

function toCurrentTimeParts() {
  const now = new Date();
  return {
    hour: pad(now.getHours()),
    minute: pad(now.getMinutes())
  };
}

function createDefaultIntervalInputs() {
  return Array.from(
    { length: SQUAT_HEAT_PROTOCOL.rounds },
    () => `${SQUAT_HEAT_PROTOCOL.defaultRepCount}`
  );
}

function parseStartedAt(selectedDate: string, hourText: string, minuteText: string) {
  const normalizedHour = hourText.trim();
  const normalizedMinute = minuteText.trim();

  if (!/^\d{1,2}$/.test(normalizedHour) || !/^\d{1,2}$/.test(normalizedMinute)) {
    return null;
  }

  const hour = Number(normalizedHour);
  const minute = Number(normalizedMinute);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const base = new Date(`${selectedDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  base.setHours(hour, minute, 0, 0);
  return base;
}

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map((value) => Number(value));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return dateKey;
  }
  return `${month}/${day}`;
}

export function ManualSessionEntryCard({
  selectedDate,
  isSubmitting,
  onSubmit
}: ManualSessionEntryCardProps) {
  const defaultTime = useMemo(() => toCurrentTimeParts(), []);
  const [hourInput, setHourInput] = useState(defaultTime.hour);
  const [minuteInput, setMinuteInput] = useState(defaultTime.minute);
  const [intervalInputs, setIntervalInputs] = useState<string[]>(() => createDefaultIntervalInputs());
  const [timeError, setTimeError] = useState<string | null>(null);
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const minuteRef = useRef<RNTextInput | null>(null);
  const intervalRefs = useRef<Array<RNTextInput | null>>([]);

  const rounds = useMemo(
    () => Array.from({ length: SQUAT_HEAT_PROTOCOL.rounds }, (_, index) => index),
    []
  );
  const shortDateLabel = useMemo(() => formatShortDate(selectedDate), [selectedDate]);
  const hasEmptyInterval = useMemo(
    () => intervalInputs.some((value) => value.trim().length === 0),
    [intervalInputs]
  );
  const previewTotal = useMemo(
    () =>
      intervalInputs.reduce((sum, value) => {
        const raw = value.trim();
        if (raw.length === 0) {
          return sum + SQUAT_HEAT_PROTOCOL.defaultRepCount;
        }
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < 0) {
          return sum;
        }
        return sum + Math.round(parsed);
      }, 0),
    [intervalInputs]
  );

  const setIntervalInput = (index: number, value: string) => {
    const normalized = value.replace(/[^\d]/g, '');
    setIntervalInputs((previous) => {
      const next = [...previous];
      next[index] = normalized;
      return next;
    });

    if (intervalError) {
      setIntervalError(null);
    }

    if (normalized.length >= 2 && index < SQUAT_HEAT_PROTOCOL.rounds - 1) {
      intervalRefs.current[index + 1]?.focus();
    }
  };

  const resetInputs = () => {
    const now = toCurrentTimeParts();
    setHourInput(now.hour);
    setMinuteInput(now.minute);
    setIntervalInputs(createDefaultIntervalInputs());
    setTimeError(null);
    setIntervalError(null);
  };

  const submit = async () => {
    const startedAt = parseStartedAt(selectedDate, hourInput, minuteInput);
    if (!startedAt) {
      setTimeError('正しい時刻を入力してください（例: 06:30）');
      return;
    }
    setTimeError(null);

    const parsedIntervalReps = intervalInputs.map((value) => {
      const raw = value.trim();
      if (raw.length === 0) {
        return SQUAT_HEAT_PROTOCOL.defaultRepCount;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return Number.NaN;
      }
      return Math.round(parsed);
    });

    if (parsedIntervalReps.some((value) => Number.isNaN(value))) {
      setIntervalError('0以上の整数で入力してください。');
      return;
    }
    setIntervalError(null);

    try {
      await onSubmit({
        startedAtIso: startedAt.toISOString(),
        intervalReps: parsedIntervalReps
      });
      resetInputs();
    } catch {
      return;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>手動で記録を追加</Text>
      <Text style={styles.description}>
        選択日（{selectedDate}）にログを追加します。時刻と各区間の回数を入力してください。
      </Text>

      <View style={styles.timeRow}>
        <Text style={styles.label}>開始時刻</Text>
        <View style={styles.timeInputRow}>
          <NativeTextInput
            value={hourInput}
            onChangeText={(value) => {
              const normalized = value.replace(/[^\d]/g, '');
              setHourInput(normalized);
              if (timeError) {
                setTimeError(null);
              }
              if (normalized.length === 2) {
                minuteRef.current?.focus();
              }
            }}
            style={styles.timeInput}
            placeholder="HH"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType="next"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.colonText}>:</Text>
          <NativeTextInput
            ref={minuteRef}
            value={minuteInput}
            onChangeText={(value) => {
              setMinuteInput(value.replace(/[^\d]/g, ''));
              if (timeError) {
                setTimeError(null);
              }
            }}
            style={styles.timeInput}
            placeholder="mm"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}
      </View>

      <View style={styles.intervalGrid}>
        {rounds.map((index) => (
          <View key={`manual-round-${index + 1}`} style={styles.intervalCell}>
            <Text style={styles.intervalLabel}>R{index + 1}</Text>
            <NativeTextInput
              ref={(value) => {
                intervalRefs.current[index] = value;
              }}
              value={intervalInputs[index] ?? ''}
              onChangeText={(value) => setIntervalInput(index, value)}
              style={styles.intervalInput}
              placeholder={`${SQUAT_HEAT_PROTOCOL.defaultRepCount}`}
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              returnKeyType={index === SQUAT_HEAT_PROTOCOL.rounds - 1 ? 'done' : 'next'}
              maxLength={2}
            />
          </View>
        ))}
      </View>
      <Text style={styles.previewText}>
        合計: {previewTotal} 回（
        {hasEmptyInterval
          ? `空欄は${SQUAT_HEAT_PROTOCOL.defaultRepCount}回として計算`
          : `${SQUAT_HEAT_PROTOCOL.rounds}ラウンド`}
        ）
      </Text>
      {intervalError ? <Text style={styles.errorText}>{intervalError}</Text> : null}

      <View style={styles.buttonRow}>
        <Button onPress={resetInputs} style={styles.resetButton} textStyle={styles.resetButtonText}>
          リセット
        </Button>
        <Button onPress={() => void submit()} disabled={isSubmitting} style={styles.saveButton}>
          {isSubmitting ? '保存中...' : `${shortDateLabel} の記録として保存`}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  description: {
    fontSize: 13,
    color: '#334155'
  },
  timeRow: {
    gap: 6
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  label: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13
  },
  colonText: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '700',
    lineHeight: 28
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderCurve: 'continuous',
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  intervalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  intervalCell: {
    width: '22%',
    minWidth: 62,
    gap: 6
  },
  intervalLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700'
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 8,
    paddingVertical: 9,
    textAlign: 'center',
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  previewText: {
    color: '#0369a1',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  errorText: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '600'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  resetButtonText: {
    color: '#334155'
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0284c7'
  }
});

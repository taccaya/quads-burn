import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text, TextInput, View } from '@/design-system';

type IntervalRepInputProps = {
  roundNumber: number;
  value: number;
  onChange: (value: number) => void;
};

function clamp(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(999, Math.round(value)));
}

export function IntervalRepInput({ roundNumber, value, onChange }: IntervalRepInputProps) {
  const [textValue, setTextValue] = useState(`${value}`);

  useEffect(() => {
    setTextValue(`${value}`);
  }, [value]);

  const apply = (next: number) => {
    const clamped = clamp(next);
    setTextValue(`${clamped}`);
    onChange(clamped);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>ラウンド{roundNumber}の回数を入力</Text>
      <View style={styles.valuePanel}>
        <Text style={styles.valueLabel}>現在値</Text>
        <Text style={styles.valueNumber}>{value} 回</Text>
      </View>
      <View style={styles.controls}>
        <Button onPress={() => apply(value - 1)} style={styles.smallButton} textStyle={styles.buttonText}>
          -1
        </Button>
        <Button onPress={() => apply(value + 1)} style={styles.smallButton} textStyle={styles.buttonText}>
          +1
        </Button>
        <Button onPress={() => apply(value + 2)} style={styles.smallButton} textStyle={styles.buttonText}>
          +2
        </Button>
      </View>
      <TextInput
        keyboardType="number-pad"
        value={textValue}
        onChangeText={(next) => {
          const digits = next.replace(/[^0-9]/g, '');
          setTextValue(digits);
          onChange(clamp(Number(digits || 0)));
        }}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  valuePanel: {
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#fef3c7',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
    alignItems: 'center'
  },
  valueLabel: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600'
  },
  valueNumber: {
    color: '#7c2d12',
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums']
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  smallButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: '#1f2937'
  },
  buttonText: {
    fontSize: 15,
    color: '#ffffff'
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '700',
    fontVariant: ['tabular-nums']
  }
});

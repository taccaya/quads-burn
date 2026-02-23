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
      <View style={styles.quickActions}>
        <Button onPress={() => apply(18)} style={styles.quickButton} textStyle={styles.quickButtonText}>
          18
        </Button>
        <Button onPress={() => apply(20)} style={styles.quickButton} textStyle={styles.quickButtonText}>
          20
        </Button>
        <Button onPress={() => apply(21)} style={styles.quickButton} textStyle={styles.quickButtonText}>
          21
        </Button>
      </View>
      <View style={styles.controls}>
        <Button onPress={() => apply(value - 1)} style={styles.smallButton} textStyle={styles.buttonText}>
          -1
        </Button>
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
        <Button onPress={() => apply(value + 1)} style={styles.smallButton} textStyle={styles.buttonText}>
          +1
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
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  smallButton: {
    flex: 1,
    minHeight: 42
  },
  buttonText: {
    fontSize: 15
  },
  input: {
    flex: 1.4,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '700'
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8
  },
  quickButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#1e293b'
  },
  quickButtonText: {
    fontSize: 15
  }
});

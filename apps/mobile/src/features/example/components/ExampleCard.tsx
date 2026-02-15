import type { ExampleEntity } from '@company/domain';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/design-system';

type ExampleCardProps = {
  item: ExampleEntity;
};

export function ExampleCard({ item }: ExampleCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.meta}>Status: {item.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700'
  },
  description: {
    color: '#374151',
    fontSize: 14
  },
  meta: {
    color: '#6b7280',
    fontSize: 13
  }
});

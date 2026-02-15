import type { ExampleEntity } from '@company/domain';
import { StyleSheet } from 'react-native';
import { Button, Screen, Text, View } from '@/design-system';
import { env } from '@/lib/env';
import { ExampleCard } from '../components/ExampleCard';

const sampleItem: ExampleEntity = {
  id: 'example-entity',
  title: 'Feature Starter',
  description: 'Replace this sample feature with your app-specific domain logic.',
  status: 'ready'
};

const noop = () => undefined;

export function HomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.heading}>{env.appName}</Text>
        <Text style={styles.subheading}>Reusable starter for iOS and Android apps.</Text>
      </View>
      <ExampleCard item={sampleItem} />
      <Button onPress={noop}>Primary action</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: 8
  },
  heading: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700'
  },
  subheading: {
    color: '#4b5563',
    fontSize: 14
  }
});

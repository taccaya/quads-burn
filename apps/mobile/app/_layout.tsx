import { Stack } from 'expo-router';
import { HeatLogsProvider } from '@/state';

export default function RootLayout() {
  return (
    <HeatLogsProvider>
      <Stack
        screenOptions={{
          headerTitleAlign: 'center'
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Quads Burn'
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: 'Quads Burn Log'
          }}
        />
      </Stack>
    </HeatLogsProvider>
  );
}

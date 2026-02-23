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
            title: 'スクワットヒート'
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: '記録とカレンダー'
          }}
        />
      </Stack>
    </HeatLogsProvider>
  );
}

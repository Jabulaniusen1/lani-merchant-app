import { Stack } from 'expo-router';

export default function MenuLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="edit/[id]" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

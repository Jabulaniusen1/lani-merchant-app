import { Stack } from 'expo-router';

export default function RestaurantLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="edit/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

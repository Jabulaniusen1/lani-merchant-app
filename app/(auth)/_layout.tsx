import { Stack } from 'expo-router';

export default function AuthLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="merchant-type" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="create-restaurant" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

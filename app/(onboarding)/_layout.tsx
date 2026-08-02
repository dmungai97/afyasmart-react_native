import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="health-check" />
      <Stack.Screen name="symptom-chat" />
      <Stack.Screen name="analysis-loading" />
      <Stack.Screen name="locked-results" />
    </Stack>
  );
}
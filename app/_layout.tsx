import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const token = useAuthStore((state) => state.token);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const segments = useSegments();
  const router = useRouter();
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    loadAuth().then(() => setAuthLoaded(true));
  }, [loadAuth]);

  useEffect(() => {
    if (!authLoaded) return;

    const seg = segments as string[];
    const first = seg[0] ?? '';

    const inAuthGroup       = first === '(auth)';
    const inOnboardingGroup = first === '(onboarding)';
    const inTabsGroup       = first === '(tabs)';
    const onWelcome         = first === 'index' || first === '';

    // Already in the right place — do nothing
    if (inTabsGroup) return;

    if (!token) {
      // Not logged in — send to welcome
      if (!inAuthGroup && !onWelcome) {
        router.replace('/');
      }
    } else if (!hasCompletedOnboarding) {
      // Logged in but onboarding pending
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/step1' as any);
      }
    } else {
      // Fully set up — send to symptoms (first screen of main app)
      if (!inTabsGroup) {
        if (!inTabsGroup) router.replace('/(tabs)' as any);
      }
    }
  }, [authLoaded, token, hasCompletedOnboarding, segments, router]);

  return <Slot />;
}
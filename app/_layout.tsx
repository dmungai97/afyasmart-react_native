import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const token                  = useAuthStore((s) => s.token);
  const user                   = useAuthStore((s) => s.user);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const loadAuth               = useAuthStore((s) => s.loadAuth);
  const segments               = useSegments();
  const router                 = useRouter();
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    loadAuth().then(() => setAuthLoaded(true));
  }, [loadAuth]);

  useEffect(() => {
    if (!authLoaded) return;

    const seg  = segments as string[];
    const first = seg[0] ?? '';

    const inAuth       = first === '(auth)';
    const inOnboarding = first === '(onboarding)';
    const inTabs       = first === '(tabs)';
    const onRoot       = first === 'index' || first === '';

    // ── Not logged in ──────────────────────────────────────────
    if (!token) {
      if (!inAuth && !onRoot) router.replace('/');
      return;
    }

    // ── Logged in + subscribed → full app ──────────────────────
    if (user?.is_subscribed) {
      if (!inTabs) router.replace('/(tabs)' as any);
      return;
    }

    // ── Logged in, NOT subscribed ──────────────────────────────
    if (!hasCompletedOnboarding) {
      // First time — show welcome funnel
      if (!inOnboarding) router.replace('/(onboarding)/welcome' as any);
    } else {
      // Returning unsubscribed user — drop into symptom chat teaser
      if (!inOnboarding) router.replace('/(onboarding)/symptom-chat' as any);
    }

  }, [authLoaded, token, user, hasCompletedOnboarding, segments, router]);

  return <Slot />;
}
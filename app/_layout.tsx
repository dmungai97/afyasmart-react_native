import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const token = useAuthStore((state) => state.token);
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const segments = useSegments();
  const router = useRouter();
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    loadAuth().then(() => setAuthLoaded(true));
  }, [loadAuth]);

  useEffect(() => {
    if (!authLoaded) return;
    if ((segments as string[]).length === 0) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    }
  }, [authLoaded, token, segments, router]);

  return <Slot />;
}
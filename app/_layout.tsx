import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "../src/store/authStore";

export default function RootLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const loadAuth = useAuthStore((s) => s.loadAuth);
  const segments = useSegments();
  const router = useRouter();
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    loadAuth().then(() => setAuthLoaded(true));
  }, [loadAuth]);

  useEffect(() => {
    if (!authLoaded) return;

    const seg = segments as string[];
    const first = seg[0] ?? "";

    const inAuth = first === "(auth)";
    const inOnboarding = first === "(onboarding)";
    const inTabs = first === "(tabs)";
    const inSubscription = seg.includes("subscription");
    const onWelcome = inOnboarding && seg[1] === "welcome";
    const onRoot = first === "index" || first === "";

    if (!token) {
      if (!inAuth && !onRoot && !onWelcome)
        router.replace("/(onboarding)/welcome" as any);
      return;
    }

    if (user?.is_subscribed) {
      if (!inTabs) router.replace("/(tabs)" as any);
      return;
    }

    if (inSubscription) return;

    if (!hasCompletedOnboarding) {
      if (!inOnboarding) router.replace("/(onboarding)/welcome" as any);
      return;
    }

    if (inOnboarding) {
      router.replace("/(tabs)" as any);
      return;
    }

    if (inAuth || onRoot) {
      router.replace("/(tabs)" as any);
    }
  }, [authLoaded, token, user, hasCompletedOnboarding, segments, router]);

  return <Slot />;
}

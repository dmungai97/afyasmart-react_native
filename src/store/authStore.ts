import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: "user" | "admin" | "super_admin";
  is_subscribed: boolean;
  has_subscribed: boolean;
  onboarding_completed: boolean;
  subscription_plan?: string | null;
  chat_count: number;
  subscription_expires_at: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;

  // Actions
  setAuth: (token: string, user: User, isNew?: boolean) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: (token: string) => Promise<void>;
};

const clearPersistedAuth = async () => {
  await AsyncStorage.multiRemove(["token", "user", "hasCompletedOnboarding", "isNewUser"]);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hasCompletedOnboarding: false,
  isNewUser: false,

  setAuth: async (token, user, isNew = false) => {
    const onboarded = await AsyncStorage.getItem("hasCompletedOnboarding");
    const hasOnboarded = onboarded === "true" || user.onboarding_completed;
    const updatedUser = { ...user, onboarding_completed: hasOnboarded };

    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    if (hasOnboarded) {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      await AsyncStorage.removeItem("isNewUser");
    } else if (isNew) {
      // Persisted (not just in-memory) so the "force this brand-new account
      // through onboarding" gate in app/_layout.tsx survives the app being
      // closed/killed before onboarding actually finishes.
      await AsyncStorage.setItem("isNewUser", "true");
    }
    set({
      token,
      user: updatedUser,
      hasCompletedOnboarding: hasOnboarded,
      isNewUser: isNew,
    });

    if (hasOnboarded && !user.onboarding_completed) {
      try {
        const { markOnboardingCompleted } = await import("../services/auth.service");
        await markOnboardingCompleted();
      } catch {
        // Local onboarding state is enough to continue; server sync can happen later.
      }
    }
  },

  clearAuth: async () => {
    try {
      const { logoutUser } = await import("../services/auth.service");
      await logoutUser();
    } catch {
      // Local state should still clear if Firebase sign-out is unavailable.
    }

    await clearPersistedAuth();
    set({
      token: null,
      user: null,
      hasCompletedOnboarding: false,
      isNewUser: false,
    });
  },

  loadAuth: async () => {
    try {
      // Firebase Auth's own SDK persists the real session — this store never
      // writes a "token" key to AsyncStorage (the in-memory token here is
      // always re-derived fresh via refreshUser()), so there's nothing to
      // clear. token starts null below regardless.
      const raw = await AsyncStorage.getItem("user");
      const onboarded = await AsyncStorage.getItem("hasCompletedOnboarding");
      const isNewUserStored = await AsyncStorage.getItem("isNewUser");
      const user: User | null = raw ? JSON.parse(raw) : null;
      set({
        token: null,
        user,
        hasCompletedOnboarding: onboarded === "true" || Boolean(user?.onboarding_completed),
        isNewUser: isNewUserStored === "true",
      });
    } catch {
      await clearPersistedAuth();
      set({
        token: null,
        user: null,
        hasCompletedOnboarding: false,
        isNewUser: false,
      });
    }
  },

  completeOnboarding: async () => {
    const current = get().user;
    const updated = current ? { ...current, onboarding_completed: true } : current;

    await AsyncStorage.setItem("hasCompletedOnboarding", "true");
    await AsyncStorage.removeItem("isNewUser");
    if (updated) await AsyncStorage.setItem("user", JSON.stringify(updated));
    set({ user: updated, hasCompletedOnboarding: true, isNewUser: false });

    if (current) {
      try {
        const { markOnboardingCompleted } = await import("../services/auth.service");
        await markOnboardingCompleted();
      } catch {
        // Keep local completion even if Firestore is temporarily unavailable.
      }
    }
  },

  // Call after login/payment to sync latest user state from Firebase
  refreshUser: async (token: string) => {
    try {
      const { getCurrentUserProfile } = await import("../services/auth.service");
      const { firebaseAuth } = await import("../services/firebase");
      const current = firebaseAuth.currentUser;

      if (!current) {
        await clearPersistedAuth();
        set({
          token: null,
          user: null,
          hasCompletedOnboarding: false,
          isNewUser: false,
        });
        return;
      }

      const user = await getCurrentUserProfile();
      if (!user) return;

      const freshToken = await current.getIdToken();
      const hasOnboarded = get().hasCompletedOnboarding || user.onboarding_completed;
      const updatedUser = { ...user, onboarding_completed: hasOnboarded };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      if (hasOnboarded) {
        await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        await AsyncStorage.removeItem("isNewUser");
      }
      set({
        user: updatedUser,
        token: freshToken ?? token,
        hasCompletedOnboarding: hasOnboarded,
        // Preserve rather than hardcode false — this runs on every app open
        // with an active session, so hardcoding false here would immediately
        // clobber the value loadAuth() just restored from AsyncStorage,
        // undoing the "isNewUser survives a restart" fix above.
        isNewUser: hasOnboarded ? false : get().isNewUser,
      });
    } catch (error) {
      console.error("Failed to refresh user", error);
      await clearPersistedAuth();
      set({
        token: null,
        user: null,
        hasCompletedOnboarding: false,
        isNewUser: false,
      });
    }
  },
}));

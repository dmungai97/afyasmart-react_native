import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_subscribed: boolean;
  chat_count: number;
  subscription_expires_at: string | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;

  // Actions
  setAuth:             (token: string, user: User, isNew?: boolean) => Promise<void>;
  clearAuth:           () => Promise<void>;
  loadAuth:            () => Promise<void>;
  completeOnboarding:  () => Promise<void>;
  updateSubscription:  (data: {
    is_subscribed: boolean;
    chat_count?: number;
    subscription_expires_at?: string | null;
  }) => Promise<void>;
  refreshUser:         (token: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hasCompletedOnboarding: false,
  isNewUser: false,

  setAuth: async (token, user, isNew = false) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isNewUser: isNew });
  },

  clearAuth: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('hasCompletedOnboarding');
    set({ token: null, user: null, hasCompletedOnboarding: false, isNewUser: false });
  },

  loadAuth: async () => {
    const token    = await AsyncStorage.getItem('token');
    const raw      = await AsyncStorage.getItem('user');
    const onboarded= await AsyncStorage.getItem('hasCompletedOnboarding');
    const user: User | null = raw ? JSON.parse(raw) : null;
    set({
      token: token ?? null,
      user,
      hasCompletedOnboarding: onboarded === 'true',
      isNewUser: false,
    });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    set({ hasCompletedOnboarding: true, isNewUser: false });
  },

  // Call this after a successful subscription payment
  updateSubscription: async ({ is_subscribed, chat_count, subscription_expires_at }) => {
    const current = get().user;
    if (!current) return;

    const updated: User = {
      ...current,
      is_subscribed,
      chat_count:              chat_count             ?? current.chat_count,
      subscription_expires_at: subscription_expires_at ?? current.subscription_expires_at,
    };

    await AsyncStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  // Call after login/payment to sync latest user state from server
  refreshUser: async (token: string) => {
    try {
      const { default: api } = await import('../services/api');
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user: User = res.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      // silently fail — stale data is acceptable
    }
  },
}));
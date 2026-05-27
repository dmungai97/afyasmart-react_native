import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";
import { useAuthStore } from "../store/authStore";

const planDays: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export const getSubscriptionExpiry = (plan: string) => {
  const days = planDays[plan] ?? 1;
  return new Date(Date.now() + days * 86_400_000).toISOString();
};

export const subscribeUser = async (
  token: string | null,
  plan: string,
): Promise<{ subscription_expires_at: string }> => {
  void token;
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to subscribe.");

  const subscription_expires_at = getSubscriptionExpiry(plan);
  await updateDoc(doc(firestore, "users", uid), {
    is_subscribed: true,
    has_subscribed: true,
    subscription_plan: plan,
    chat_count: 0,
    subscription_expires_at,
    updated_at: serverTimestamp(),
  });

  await useAuthStore.getState().updateSubscription({
    is_subscribed: true,
    has_subscribed: true,
    subscription_plan: plan,
    chat_count: 0,
    subscription_expires_at,
  });

  return { subscription_expires_at };
};

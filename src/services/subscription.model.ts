export type SubscriptionPlan = "free" | "daily" | "weekly" | "monthly";

export type SubscriptionUser = {
  is_subscribed?: boolean;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  chat_count?: number;
} | null;

export const FREE_CHAT_LIMIT = 5;

export const isSubscriptionActive = (user: SubscriptionUser) => {
  if (!user?.is_subscribed) return false;
  if (!user.subscription_expires_at) return true;

  const expiresAt = new Date(user.subscription_expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
};

export const getSubscriptionPlan = (user: SubscriptionUser): SubscriptionPlan => {
  if (!isSubscriptionActive(user)) return "free";

  const plan = user?.subscription_plan;
  return plan === "daily" || plan === "weekly" || plan === "monthly"
    ? plan
    : "monthly";
};

export const getRemainingFreeChats = (user: SubscriptionUser) => {
  if (isSubscriptionActive(user)) return FREE_CHAT_LIMIT;
  return Math.max(0, FREE_CHAT_LIMIT - Number(user?.chat_count ?? 0));
};

export const getAccessState = (user: SubscriptionUser) => {
  const subscribed = isSubscriptionActive(user);
  const remainingChats = getRemainingFreeChats(user);

  return {
    plan: getSubscriptionPlan(user),
    subscribed,
    limited: !subscribed,
    remainingChats,
    chatLimitReached: !subscribed && remainingChats <= 0,
  };
};

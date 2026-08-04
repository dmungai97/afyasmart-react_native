// Shared by admin.service.ts and useAdminDashboard.ts, which both read the
// same paymentRequests/users shapes and previously kept separate copies of
// these helpers that could silently drift out of sync.

const planAmounts: Record<string, number> = {
  daily: 20,
  weekly: 100,
  monthly: 200,
};

export const formatDate = (value: any) => {
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value
        ? new Date(value)
        : null;
  if (!date || Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const paymentAmount = (data: any) => {
  const direct = Number(data?.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const plan = data?.plan;
  if (plan === "daily" || plan === "weekly" || plan === "monthly") {
    return planAmounts[plan];
  }
  return 0;
};

export const getDateValue = (value: any) => {
  if (!value) return null;
  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const isActiveSubscription = (data: any) => {
  if (!data?.is_subscribed) return false;

  const expiresAt = getDateValue(data.subscription_expires_at);
  return !expiresAt || expiresAt > new Date();
};

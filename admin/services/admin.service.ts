import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

// ── Constants ────────────────────────────────────────────────────────────────

const planAmounts: Record<string, number> = {
  daily: 20,
  weekly: 100,
  monthly: 200,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const getDateValue = (value: any) => {
  if (!value) return null;
  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isActiveSubscription = (data: any) => {
  if (!data?.is_subscribed) return false;

  const expiresAt = getDateValue(data.subscription_expires_at);
  return !expiresAt || expiresAt > new Date();
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminMetric = {
  totalUsers: number;
  activeUsers: number;
  subscriptions: number;
  doctors: number;
  pharmacies: number;
  drugs: number;
  totalFacilities: number;
  totalRevenue: number;
  pendingPayouts: number;
  pendingPayoutsValue: number;
  planCounts: { daily: number; weekly: number; monthly: number };
  conversionRate: number;
};

export type AdminRecentUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  subscribed: boolean;
};

export type AdminTransaction = {
  id: string;
  name: string;
  type: string;
  amount: number;
  status: string;
  time: string;
};

export type AdminDashboardData = {
  metrics: AdminMetric;
  recentUsers: AdminRecentUser[];
  recentTransactions: AdminTransaction[];
  weeklyRevenue?: number[];
  weeklySubscribers?: number[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  subscriptionPlan: string;
  isSubscribed: boolean;
  hasSubscribed: boolean;
  subscriptionExpiresAt: string | null;
  isExpired?: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
};

export type AdminFacility = {
  id: string;
  type: "doctor" | "pharmacy";
  name: string;
  location: string;
  phone: string;
  email: string;
  specialization?: string;    // doctor only
  hospital?: string;          // doctor only
  rating?: number;            // doctor only
  available?: boolean;        // doctor only
  experienceYears?: number;   // doctor only
  address?: string;           // pharmacy only
  openingHours?: string;      // pharmacy only
  open24hrs?: boolean;        // pharmacy only
  open?: boolean;             // pharmacy only
};

export type AdminPayment = {
  id: string;
  phone: string;
  uid: string;
  plan: string;
  amount: number;
  status: string;
  paid: boolean;
  createdAt: string;
  paidAt: string | null;
};

// ── Dashboard data (legacy, used by service only) ────────────────────────────

const countCollection = async (collectionName: string) => {
  const snap = await getCountFromServer(collection(firestore, collectionName));
  return snap.data().count;
};

const countQuery = async (collectionName: string, field: string, value: unknown) => {
  const snap = await getCountFromServer(
    query(collection(firestore, collectionName), where(field, "==", value)),
  );
  return snap.data().count;
};

export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const [totalUsers, activeUsersSnap, subscriptions, doctors, pharmacies, drugs] =
    await Promise.all([
      countCollection("users"),
      getDocs(query(collection(firestore, "users"), where("is_subscribed", "==", true))),
      countQuery("users", "has_subscribed", true),
      countCollection("doctors"),
      countCollection("pharmacies"),
      countCollection("drugs"),
    ]);

  let daily = 0;
  let weekly = 0;
  let monthly = 0;
  const activeUsers = activeUsersSnap.docs.filter((item) => {
    const data = item.data();
    const active = isActiveSubscription(data);
    if (active) {
      const plan = data.subscription_plan;
      if (plan === "daily") daily++;
      else if (plan === "weekly") weekly++;
      else if (plan === "monthly") monthly++;
    }
    return active;
  }).length;

  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
  const weeklySubscribers = [0, 0, 0, 0, 0, 0, 0];

  let paidTransactions: AdminTransaction[] = [];
  let totalRevenue = 0;
  try {
    const paymentsSnap = await getDocs(
      query(collection(firestore, "paymentRequests"), where("paid", "==", true)),
    );
    paidTransactions = paymentsSnap.docs.map((item) => {
      const data = item.data();
      const amount = paymentAmount(data);
      totalRevenue += amount;

      const dateVal = data.paid_at ?? data.created_at;
      const date = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
      if (!Number.isNaN(date.getTime()) && date >= startOfWeek) {
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyRevenue[dayIndex] += amount;
          weeklySubscribers[dayIndex] += 1;
        }
      }

      return {
        id: item.id,
        name: data.phone ?? data.uid ?? "Payment",
        type: data.plan ? `${data.plan} subscription` : "Subscription",
        amount,
        status: data.status ?? "paid",
        time: formatDate(data.paid_at ?? data.updated_at ?? data.created_at),
      };
    });
  } catch {
    paidTransactions = [];
  }

  let pendingPayouts = 0;
  let pendingPayoutsValue = 0;
  try {
    const pendingSnap = await getDocs(
      query(collection(firestore, "paymentRequests"), where("status", "==", "pending")),
    );
    pendingPayouts = pendingSnap.size;
    pendingSnap.docs.forEach((docSnap) => {
      pendingPayoutsValue += paymentAmount(docSnap.data());
    });
  } catch {
    pendingPayouts = 0;
    pendingPayoutsValue = 0;
  }

  let recentUsers: AdminRecentUser[] = [];
  try {
    const usersSnap = await getDocs(
      query(collection(firestore, "users"), orderBy("created_at", "desc"), limit(5)),
    );
    recentUsers = usersSnap.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        name: data.name ?? data.displayName ?? "AfyaSmart User",
        email: data.email ?? "",
        plan: data.subscription_plan ?? "free",
        subscribed: isActiveSubscription(data),
      };
    });
  } catch {
    recentUsers = [];
  }

  const recentTransactions = paidTransactions
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

  const conversionRate = totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0;

  return {
    metrics: {
      totalUsers,
      activeUsers,
      subscriptions,
      doctors,
      pharmacies,
      drugs,
      totalFacilities: doctors + pharmacies,
      totalRevenue,
      pendingPayouts,
      pendingPayoutsValue,
      planCounts: { daily, weekly, monthly },
      conversionRate,
    },
    recentUsers,
    recentTransactions,
    weeklyRevenue,
    weeklySubscribers,
  };
};

// ── Users Management ──────────────────────────────────────────────────────────

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const snap = await getDocs(
    query(collection(firestore, "users"), orderBy("created_at", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();

    const expiresDate = getDateValue(data.subscription_expires_at);
    const isExpired = Boolean(expiresDate && expiresDate < new Date());
    const isSubscribed = isActiveSubscription(data);

    return {
      id: d.id,
      name: data.name ?? data.displayName ?? "AfyaSmart User",
      email: data.email ?? "",
      phone: data.phone ?? "",
      role: data.role ?? "user",
      subscriptionPlan: data.subscription_plan ?? "free",
      isSubscribed,
      hasSubscribed: Boolean(data.has_subscribed),
      subscriptionExpiresAt: data.subscription_expires_at
        ? formatDate(data.subscription_expires_at)
        : null,
      isExpired,
      onboardingCompleted: Boolean(data.onboarding_completed),
      createdAt: formatDate(data.created_at),
    };
  });
};

export const updateAdminUser = async (
  userId: string,
  updates: Partial<{
    name: string;
    role: string;
    is_subscribed: boolean;
    subscription_plan: string;
    subscription_expires_at: string | null;
  }>,
) => {
  const { subscription_expires_at, ...rest } = updates;
  const normalizedUpdates = {
    ...rest,
    ...(subscription_expires_at !== undefined
      ? {
          subscription_expires_at: subscription_expires_at
            ? Timestamp.fromDate(new Date(subscription_expires_at))
            : null,
        }
      : {}),
  };

  await updateDoc(doc(firestore, "users", userId), {
    ...normalizedUpdates,
    updated_at: serverTimestamp(),
  });
};

// ── Facilities Management ─────────────────────────────────────────────────────

export const fetchAllFacilities = async (): Promise<AdminFacility[]> => {
  const [doctorsSnap, pharmaciesSnap] = await Promise.all([
    getDocs(collection(firestore, "doctors")),
    getDocs(collection(firestore, "pharmacies")),
  ]);

  const doctors: AdminFacility[] = doctorsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: "doctor",
      name: data.name ?? "Unknown Doctor",
      location: data.location ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      specialization: data.specialization ?? "",
      hospital: data.hospital ?? "",
      rating: Number(data.rating ?? 0),
      available: Boolean(data.available),
      experienceYears: Number(data.experience_years ?? 0),
    };
  });

  const pharmacies: AdminFacility[] = pharmaciesSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: "pharmacy",
      name: data.name ?? "Unknown Pharmacy",
      location: data.location ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      openingHours: data.opening_hours ?? "",
      open24hrs: Boolean(data.open_24hrs),
      open: Boolean(data.open),
    };
  });

  return [...doctors, ...pharmacies];
};

export const addFacility = async (
  type: "doctor" | "pharmacy",
  data: Record<string, any>,
) => {
  const col = type === "doctor" ? "doctors" : "pharmacies";
  await addDoc(collection(firestore, col), {
    ...data,
    created_at: serverTimestamp(),
  });
};

export const updateFacility = async (
  type: "doctor" | "pharmacy",
  id: string,
  data: Record<string, any>,
) => {
  const col = type === "doctor" ? "doctors" : "pharmacies";
  await updateDoc(doc(firestore, col, id), {
    ...data,
    updated_at: serverTimestamp(),
  });
};

export const deleteFacility = async (
  type: "doctor" | "pharmacy",
  id: string,
) => {
  const col = type === "doctor" ? "doctors" : "pharmacies";
  await deleteDoc(doc(firestore, col, id));
};

// ── Payments / Transactions ───────────────────────────────────────────────────

export const fetchAllPayments = async (): Promise<AdminPayment[]> => {
  const snap = await getDocs(
    query(collection(firestore, "paymentRequests"), orderBy("created_at", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      phone: data.phone ?? data.uid ?? "Unknown",
      uid: data.uid ?? "",
      plan: data.plan ?? "unknown",
      amount: paymentAmount(data),
      status: data.status ?? "unknown",
      paid: Boolean(data.paid),
      createdAt: formatDate(data.created_at),
      paidAt: data.paid_at ? formatDate(data.paid_at) : null,
    };
  });
};

export const reconcilePayment = async (
  paymentId: string,
  uid: string,
  plan: string,
) => {
  const now = new Date();
  let days = 0;
  if (plan === "daily") days = 1;
  else if (plan === "weekly") days = 7;
  else if (plan === "monthly") days = 30;

  let expiresAt: Timestamp | null = null;
  if (uid && days > 0) {
    let baseDate = now;
    try {
      const userDoc = await getDoc(doc(firestore, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData?.is_subscribed && userData?.subscription_expires_at) {
          const currentExpiry =
            typeof userData.subscription_expires_at.toDate === "function"
              ? userData.subscription_expires_at.toDate()
              : new Date(userData.subscription_expires_at);
          if (!Number.isNaN(currentExpiry.getTime()) && currentExpiry > now) {
            baseDate = currentExpiry; // Stack/accumulate time!
          }
        }
      }
    } catch (err) {
      console.warn("Failed to check existing subscription for stacking:", err);
    }
    const expiryDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    expiresAt = Timestamp.fromDate(expiryDate);
  }

  // 1. Update the payment request to paid
  await updateDoc(doc(firestore, "paymentRequests", paymentId), {
    paid: true,
    status: "paid",
    paid_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // 2. Activate user subscription
  if (uid) {
    await updateDoc(doc(firestore, "users", uid), {
      is_subscribed: true,
      has_subscribed: true,
      subscription_plan: plan,
      subscription_expires_at: expiresAt,
      updated_at: serverTimestamp(),
    });
  }
};

export const rejectPayment = async (paymentId: string) => {
  await updateDoc(doc(firestore, "paymentRequests", paymentId), {
    paid: false,
    status: "failed",
    updated_at: serverTimestamp(),
  });
};

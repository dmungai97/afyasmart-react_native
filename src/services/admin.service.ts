import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { firestore } from "./firebase";

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
  const [totalUsers, activeUsers, subscriptions, doctors, pharmacies, drugs] =
    await Promise.all([
      countCollection("users"),
      countQuery("users", "is_subscribed", true),
      countQuery("users", "has_subscribed", true),
      countCollection("doctors"),
      countCollection("pharmacies"),
      countCollection("drugs"),
    ]);

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
  try {
    pendingPayouts = await countQuery("paymentRequests", "status", "pending");
  } catch {
    pendingPayouts = 0;
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
        subscribed: Boolean(data.is_subscribed),
      };
    });
  } catch {
    recentUsers = [];
  }

  const recentTransactions = paidTransactions
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

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
    },
    recentUsers,
    recentTransactions,
  };
};

// ── Users Management ──────────────────────────────────────────────────────────

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const snap = await getDocs(
    query(collection(firestore, "users"), orderBy("created_at", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? data.displayName ?? "AfyaSmart User",
      email: data.email ?? "",
      phone: data.phone ?? "",
      role: data.role ?? "user",
      subscriptionPlan: data.subscription_plan ?? "free",
      isSubscribed: Boolean(data.is_subscribed),
      hasSubscribed: Boolean(data.has_subscribed),
      subscriptionExpiresAt: data.subscription_expires_at
        ? formatDate(data.subscription_expires_at)
        : null,
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
  }>,
) => {
  await updateDoc(doc(firestore, "users", userId), {
    ...updates,
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

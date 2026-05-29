import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "./firebase";

const planAmounts: Record<string, number> = {
  daily: 20,
  weekly: 100,
  monthly: 200,
};

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

const formatDate = (value: any) => {
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

const paymentAmount = (data: any) => {
  const direct = Number(data?.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const plan = data?.plan;
  if (plan === "daily" || plan === "weekly" || plan === "monthly") {
    return planAmounts[plan];
  }
  return 0;
};

export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const [
    totalUsers,
    activeUsers,
    subscriptions,
    doctors,
    pharmacies,
    drugs,
  ] = await Promise.all([
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

import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getCountFromServer,
  getDocs,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { firestore, firebaseAuth } from "@/src/services/firebase";
import {
  AdminDashboardData,
  AdminMetric,
  AdminRecentUser,
  AdminTransaction,
} from "@admin/services/admin.service";
import { useAuthStore } from "@/src/store/authStore";

const planAmounts: Record<string, number> = {
  daily: 20,
  weekly: 100,
  monthly: 200,
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

export const useAdminDashboard = () => {
  const token = useAuthStore((s) => s.token);
  const [dashboard, setDashboard] = useState<AdminDashboardData>({
    metrics: {
      totalUsers: 0,
      activeUsers: 0,
      subscriptions: 0,
      doctors: 0,
      pharmacies: 0,
      drugs: 0,
      totalFacilities: 0,
      totalRevenue: 0,
      pendingPayouts: 0,
      pendingPayoutsValue: 0,
      planCounts: { daily: 0, weekly: 0, monthly: 0 },
      conversionRate: 0,
    },
    recentUsers: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    let unsubPayments: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    let aggregatesLoaded = false;
    let paymentsLoaded = false;
    let usersLoaded = false;

    const checkLoadingState = () => {
      if (aggregatesLoaded && paymentsLoaded && usersLoaded) {
        setLoading(false);
      }
    };

    // Listen to Firebase Auth state change to ensure requests are authorized
    const unsubAuth = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      // Clean up existing listeners on auth change
      if (unsubPayments) {
        unsubPayments();
        unsubPayments = null;
      }
      if (unsubUsers) {
        unsubUsers();
        unsubUsers = null;
      }

      if (!firebaseUser) {
        console.warn("[useAdminDashboard] Firebase SDK User is null. Waiting for auth state or sign in.");
        setLoading(false);
        return;
      }

      aggregatesLoaded = false;
      paymentsLoaded = false;
      usersLoaded = false;
      initialLoadDone.current = false;
      setLoading(true);

      // Fast aggregates count using getCountFromServer (no document reads)
      const syncAggregates = async () => {
        try {
          const [
            totalUsers,
            activeUsersSnap,
            subscriptions,
            doctors,
            pharmacies,
            drugs,
          ] = await Promise.all([
            getCountFromServer(collection(firestore, "users")),
            getDocs(query(collection(firestore, "users"), where("is_subscribed", "==", true))),
            getCountFromServer(query(collection(firestore, "users"), where("has_subscribed", "==", true))),
            getCountFromServer(collection(firestore, "doctors")),
            getCountFromServer(collection(firestore, "pharmacies")),
            getCountFromServer(collection(firestore, "drugs")),
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

          if (active) {
            setDashboard((prev) => {
              const tUsers = totalUsers.data().count;
              return {
                ...prev,
                metrics: {
                  ...prev.metrics,
                  totalUsers: tUsers,
                  activeUsers,
                  subscriptions: subscriptions.data().count,
                  doctors: doctors.data().count,
                  pharmacies: pharmacies.data().count,
                  drugs: drugs.data().count,
                  totalFacilities: doctors.data().count + pharmacies.data().count,
                  planCounts: { daily, weekly, monthly },
                  conversionRate: tUsers > 0 ? Number(((activeUsers / tUsers) * 100).toFixed(1)) : 0,
                },
              };
            });
            aggregatesLoaded = true;
            checkLoadingState();
          }
        } catch (err) {
          console.error("Error syncing dashboard counts:", err);
          if (active) {
            aggregatesLoaded = true;
            checkLoadingState();
          }
        }
      };

      // Trigger initial counts sync
      void syncAggregates();

      // 1. Listen to paymentRequests in real time for recent transactions and total revenue
      const paymentsQuery = query(
        collection(firestore, "paymentRequests"),
        orderBy("created_at", "desc")
      );

      unsubPayments = onSnapshot(
        paymentsQuery,
        (snapshot) => {
          let totalRevenue = 0;
          let pendingPayouts = 0;
          let pendingPayoutsValue = 0;
          const paidTransactions: AdminTransaction[] = [];

          // Calculate start of current week (Monday)
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(now.setDate(diff));
          startOfWeek.setHours(0, 0, 0, 0);

          const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
          const weeklySubscribers = [0, 0, 0, 0, 0, 0, 0];

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === "pending") {
              pendingPayouts++;
              pendingPayoutsValue += paymentAmount(data);
            }
            if (data.paid === true) {
              const amount = paymentAmount(data);
              totalRevenue += amount;
              paidTransactions.push({
                id: docSnap.id,
                name: data.phone ?? data.uid ?? "Payment",
                type: data.plan ? `${data.plan} subscription` : "Subscription",
                amount,
                status: data.status ?? "paid",
                time: formatDate(data.paid_at ?? data.updated_at ?? data.created_at),
              });

              // Group by day of the current week
              const dateVal = data.paid_at ?? data.created_at;
              const date = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
              if (!Number.isNaN(date.getTime()) && date >= startOfWeek) {
                const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
                if (dayIndex >= 0 && dayIndex < 7) {
                  weeklyRevenue[dayIndex] += amount;
                  weeklySubscribers[dayIndex] += 1;
                }
              }
            }
          });

          if (active) {
            setDashboard((prev) => ({
              ...prev,
              metrics: {
                ...prev.metrics,
                totalRevenue,
                pendingPayouts,
                pendingPayoutsValue,
              },
              recentTransactions: paidTransactions.slice(0, 5),
              weeklyRevenue,
              weeklySubscribers,
            }));
            paymentsLoaded = true;
            checkLoadingState();
          }

          if (initialLoadDone.current) {
            void syncAggregates();
          } else {
            initialLoadDone.current = true;
          }
        },
        (err: any) => {
          console.error("Payment Requests listener error:", err);
          if (active) {
            setError(err?.message ?? "Error loading payment requests.");
            paymentsLoaded = true;
            checkLoadingState();
          }
        }
      );

      // 2. Listen to users in real time for recent registrations
      const usersQuery = query(
        collection(firestore, "users"),
        orderBy("created_at", "desc"),
        limit(5)
      );

      unsubUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const recentUsers: AdminRecentUser[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name ?? data.displayName ?? "AfyaSmart User",
              email: data.email ?? "",
              plan: data.subscription_plan ?? "free",
              subscribed: isActiveSubscription(data),
            };
          });

          if (active) {
            setDashboard((prev) => ({
              ...prev,
              recentUsers,
            }));
            usersLoaded = true;
            checkLoadingState();
          }

          if (initialLoadDone.current) {
            void syncAggregates();
          }
        },
        (err: any) => {
          console.error("Users listener error:", err);
          if (active) {
            setError(err?.message ?? "Error loading recent users.");
            usersLoaded = true;
            checkLoadingState();
          }
        }
      );
    });

    return () => {
      active = false;
      unsubAuth();
      if (unsubPayments) unsubPayments();
      if (unsubUsers) unsubUsers();
    };
  }, [token]);

  return { dashboard, loading, error };
};

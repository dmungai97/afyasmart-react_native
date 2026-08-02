import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { firebaseAuth, firestore } from '@/src/services/firebase';
import { callFunction, FunctionApiError } from '@/src/services/functionsApi';

export interface Referral {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  joinedDate: string;
}

export interface Earning {
  id: string;
  name: string;
  planName: string;
  amount: number;
  commission: number;
  date: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Processing' | 'Failed';
  mpesaNumber: string;
}

const formatDate = (value: any): string => {
  const date =
    typeof value?.toDate === 'function' ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const planLabel = (plan?: string) =>
  plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan` : 'Subscription';

const payoutStatusLabel = (status: string): Withdrawal['status'] => {
  if (status === 'paid') return 'Completed';
  if (status === 'rejected') return 'Failed';
  return 'Processing';
};

interface AffiliateState {
  loading: boolean;
  enrolled: boolean;
  affiliateId: string;
  affiliateSince: string | null;
  availableBalance: number;
  pendingEarnings: number;
  totalEarned: number;
  referralsCount: number;
  activeUsersCount: number;
  conversionRate: number;
  referrals: Referral[];
  earnings: Earning[];
  withdrawals: Withdrawal[];
  earningsToday: number;
  earningsThisWeek: number;
  earningsThisMonth: number;
  load: () => Promise<void>;
  enroll: () => Promise<{ success: boolean; message?: string }>;
  addWithdrawal: (
    amount: number,
    mpesaNumber: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

const emptyState = {
  loading: false,
  enrolled: false,
  affiliateId: '',
  affiliateSince: null as string | null,
  availableBalance: 0,
  pendingEarnings: 0,
  totalEarned: 0,
  referralsCount: 0,
  activeUsersCount: 0,
  conversionRate: 0,
  referrals: [] as Referral[],
  earnings: [] as Earning[],
  withdrawals: [] as Withdrawal[],
  earningsToday: 0,
  earningsThisWeek: 0,
  earningsThisMonth: 0,
};

export const useAffiliateStore = create<AffiliateState>((set, get) => ({
  ...emptyState,

  load: async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      set({ ...emptyState });
      return;
    }

    set({ loading: true });

    const affiliateSnap = await getDoc(doc(firestore, 'affiliates', uid));
    if (!affiliateSnap.exists()) {
      set({ ...emptyState, loading: false });
      return;
    }

    const affiliate = affiliateSnap.data();

    const [referralsSnap, earningsSnap, payoutsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'users'), where('referred_by_uid', '==', uid))),
      getDocs(
        query(
          collection(firestore, 'commissions'),
          where('affiliate_uid', '==', uid),
          orderBy('created_at', 'desc'),
        ),
      ),
      getDocs(
        query(
          collection(firestore, 'payoutRequests'),
          where('affiliate_uid', '==', uid),
          orderBy('created_at', 'desc'),
        ),
      ),
    ]);

    const referredNameByUid = new Map<string, string>();
    const referrals: Referral[] = referralsSnap.docs.map((d) => {
      const data = d.data();
      const name = data.name ?? data.displayName ?? 'AfyaSmart User';
      referredNameByUid.set(d.id, name);
      return {
        id: d.id,
        name,
        status: data.is_subscribed ? 'Active' : 'Inactive',
        joinedDate: formatDate(data.created_at),
      };
    });

    const activeUsersCount = referrals.filter((r) => r.status === 'Active').length;
    const conversionRate =
      referrals.length > 0 ? Math.round((activeUsersCount / referrals.length) * 100) : 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let earningsToday = 0;
    let earningsThisWeek = 0;
    let earningsThisMonth = 0;

    const earnings: Earning[] = earningsSnap.docs.map((d) => {
      const data = d.data();
      const commission = Number(data.commission_amount ?? 0);
      const createdAt =
        typeof data.created_at?.toDate === 'function' ? data.created_at.toDate() : null;

      if (createdAt) {
        if (createdAt >= startOfToday) earningsToday += commission;
        if (createdAt >= startOfWeek) earningsThisWeek += commission;
        if (createdAt >= startOfMonth) earningsThisMonth += commission;
      }

      return {
        id: d.id,
        name: referredNameByUid.get(data.referred_uid) ?? 'Referred user',
        planName: planLabel(data.plan),
        amount: Number(data.amount ?? 0),
        commission,
        date: formatDate(data.created_at),
      };
    });

    const withdrawals: Withdrawal[] = payoutsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        amount: Number(data.amount ?? 0),
        date: formatDate(data.created_at),
        status: payoutStatusLabel(data.status ?? 'pending'),
        mpesaNumber: data.phone ?? '',
      };
    });

    set({
      loading: false,
      enrolled: true,
      affiliateId: affiliate.code ?? '',
      affiliateSince: formatDate(affiliate.created_at),
      availableBalance: Number(affiliate.available_balance ?? 0),
      pendingEarnings: Number(affiliate.pending_balance ?? 0),
      totalEarned: Number(affiliate.total_earned ?? 0),
      referralsCount: referrals.length,
      activeUsersCount,
      conversionRate,
      referrals,
      earnings,
      withdrawals,
      earningsToday,
      earningsThisWeek,
      earningsThisMonth,
    });
  },

  enroll: async () => {
    try {
      await callFunction('enrollAffiliate', { method: 'POST' });
      await get().load();
      return { success: true };
    } catch (error) {
      const message =
        error instanceof FunctionApiError
          ? error.message
          : 'Could not enroll as an affiliate. Please try again.';
      return { success: false, message };
    }
  },

  addWithdrawal: async (amount: number, mpesaNumber: string) => {
    const { availableBalance } = get();

    if (amount <= 0 || amount < 100) {
      return { success: false, message: 'Minimum withdrawal amount is Ksh 100.' };
    }
    if (amount > availableBalance) {
      return { success: false, message: 'You do not have enough available balance.' };
    }

    try {
      await callFunction('requestPayout', { method: 'POST', body: { amount, phone: mpesaNumber } });
      await get().load();
      return { success: true };
    } catch (error) {
      const message =
        error instanceof FunctionApiError
          ? error.message
          : 'Unable to process withdrawal request.';
      return { success: false, message };
    }
  },
}));

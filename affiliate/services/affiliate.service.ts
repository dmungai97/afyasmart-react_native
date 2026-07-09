import { create } from 'zustand';

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

interface AffiliateState {
  affiliateId: string;
  availableBalance: number;
  pendingEarnings: number;
  totalEarned: number;
  referralsCount: number;
  activeUsersCount: number;
  conversionRate: number;
  referrals: Referral[];
  earnings: Earning[];
  withdrawals: Withdrawal[];
  addWithdrawal: (amount: number, mpesaNumber: string) => boolean;
}

export const useAffiliateStore = create<AffiliateState>((set, get) => ({
  affiliateId: 'AFYA-7K9X2',
  availableBalance: 1240.00,
  pendingEarnings: 320.00,
  totalEarned: 5600.00,
  referralsCount: 42,
  activeUsersCount: 30,
  conversionRate: 71, // 71%

  referrals: [
    { id: '1', name: 'John Mwangi', status: 'Active', joinedDate: '20 Apr 2024' },
    { id: '2', name: 'Mary Wanjiru', status: 'Active', joinedDate: '18 Apr 2024' },
    { id: '3', name: 'City Pharmacy', status: 'Active', joinedDate: '15 Apr 2024' },
    { id: '4', name: 'AAR Hospital', status: 'Inactive', joinedDate: '10 Apr 2024' },
    { id: '5', name: 'Brian Otieno', status: 'Inactive', joinedDate: '05 Apr 2024' },
  ],

  earnings: [
    { id: '1', name: 'John Mwangi', planName: 'Monthly Plan', amount: 200, commission: 60, date: '28 Apr 2024, 10:30 AM' },
    { id: '2', name: 'Mary Wanjiru', planName: 'Weekly Plan', amount: 100, commission: 30, date: '28 Apr 2024, 09:15 AM' },
    { id: '3', name: 'City Pharmacy', planName: 'Monthly Plan', amount: 200, commission: 60, date: '27 Apr 2024, 04:20 PM' },
    { id: '4', name: 'AAR Hospital', planName: 'Monthly Plan', amount: 200, commission: 60, date: '23 Apr 2024, 11:05 AM' },
    { id: '5', name: 'Good Health Clinic', planName: 'Weekly Plan', amount: 100, commission: 30, date: '22 Apr 2024, 02:10 PM' },
  ],

  withdrawals: [
    { id: 'w1', amount: 500, date: '27 Apr 2024, 10:30 AM', status: 'Completed', mpesaNumber: '254712345678' },
    { id: 'w2', amount: 300, date: '25 Apr 2024, 09:15 AM', status: 'Processing', mpesaNumber: '254712345678' },
    { id: 'w3', amount: 200, date: '22 Apr 2024, 04:45 PM', status: 'Failed', mpesaNumber: '254712345678' },
  ],

  addWithdrawal: (amount: number, mpesaNumber: string) => {
    const state = get();
    if (amount <= 0 || amount > state.availableBalance || amount < 100) {
      return false;
    }

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${pad(hour12)}:${pad(now.getMinutes())} ${ampm}`;

    const newWithdrawal: Withdrawal = {
      id: `w-${Date.now()}`,
      amount,
      date: dateStr,
      status: 'Processing',
      mpesaNumber,
    };

    set({
      availableBalance: state.availableBalance - amount,
      withdrawals: [newWithdrawal, ...state.withdrawals],
    });

    return true;
  },
}));

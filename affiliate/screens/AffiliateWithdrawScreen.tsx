import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAffiliateStore } from '../services/affiliate.service';
import { useAuthStore } from '@/src/store/authStore';

const GREEN = '#0B6E6E';
const GREEN_DARK = '#053E3E';
const LIGHT_BG = '#F5F7FA';

export function AffiliateWithdrawScreen() {
  const availableBalance = useAffiliateStore((s) => s.availableBalance);
  const withdrawals = useAffiliateStore((s) => s.withdrawals);
  const addWithdrawal = useAffiliateStore((s) => s.addWithdrawal);
  const load = useAffiliateStore((s) => s.load);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    load();
  }, [load]);

  const [amountStr, setAmountStr] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return `Ksh ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (amt < 100) {
      Alert.alert('Below Limit', 'Minimum withdrawal amount is Ksh 100.');
      return;
    }
    if (amt > availableBalance) {
      Alert.alert('Insufficient Balance', 'You do not have enough available balance.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid M-Pesa phone number.');
      return;
    }

    setLoading(true);
    const result = await addWithdrawal(amt, phone.trim());
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Withdrawal Requested',
        `Your withdrawal of Ksh ${amt.toLocaleString()} to ${phone} has been submitted for review.`
      );
      setAmountStr('');
    } else {
      Alert.alert('Error', result.message ?? 'Unable to process withdrawal request.');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return '#16A34A';
    if (status === 'Processing') return '#D97706';
    return '#DC2626';
  };

  const getStatusBgColor = (status: string) => {
    if (status === 'Completed') return '#DCFCE7';
    if (status === 'Processing') return '#FEF3C7';
    return '#FEE2E2';
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Withdraw to M-Pesa</Text>
      </View>

      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Balance banner inside withdraw screen */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
              </View>
              <View style={styles.walletIconWrap}>
                <Ionicons name="wallet-outline" size={24} color={GREEN} />
              </View>
            </View>

            {/* Inputs Card */}
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Enter Amount</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 500"
                  placeholderTextColor="#94A3B8"
                  value={amountStr}
                  onChangeText={setAmountStr}
                />
                <Text style={styles.currencyLabel}>Ksh</Text>
              </View>
              <Text style={styles.hintText}>Minimum withdrawal: Ksh 100</Text>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>M-Pesa Number</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  placeholder="2547XXXXXXXX"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Ionicons name="phone-portrait-outline" size={18} color="#94A3B8" />
              </View>

              {/* Warning/Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color={GREEN} style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  Make sure your M-Pesa number is correct. Payments are processed instantly.
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleWithdraw}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Withdraw Now</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Recent Withdrawals Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.withdrawItem}>
            <View style={[styles.statusIconWrap, { backgroundColor: getStatusBgColor(item.status) }]}>
              <Ionicons 
                name={item.status === 'Completed' ? 'checkmark' : item.status === 'Processing' ? 'hourglass-outline' : 'close'} 
                size={16} 
                color={getStatusColor(item.status)} 
              />
            </View>
            <View style={styles.withdrawDetails}>
              <Text style={styles.withdrawAmount}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.withdrawDate}>{item.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>No recent withdrawal records found</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    backgroundColor: GREEN,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  balanceAmount: {
    color: GREEN,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(11,110,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 24,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FAFAFA',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    height: '100%',
  },
  currencyLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(11,110,110,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(11,110,110,0.15)',
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoIcon: {
    marginTop: 1,
  },
  infoText: {
    color: GREEN,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '600',
  },
  withdrawItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#F1F5F9',
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  withdrawDetails: {
    flex: 1,
  },
  withdrawAmount: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  withdrawDate: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});

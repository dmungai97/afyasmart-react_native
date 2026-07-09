import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAffiliateStore, Earning } from '../services/affiliate.service';

const GREEN = '#0B6E6E';
const GREEN_DARK = '#053E3E';
const LIGHT_BG = '#F5F7FA';

export function AffiliateEarningsScreen() {
  const earnings = useAffiliateStore((s) => s.earnings);
  const availableBalance = useAffiliateStore((s) => s.availableBalance);
  const pendingEarnings = useAffiliateStore((s) => s.pendingEarnings);
  const totalEarned = useAffiliateStore((s) => s.totalEarned);

  const [activeTab, setActiveTab] = useState<'Overview' | 'Transactions'>('Transactions');
  const [filterPeriod, setFilterPeriod] = useState<'Today' | 'This Week' | 'This Month' | 'All'>('This Month');

  const formatCurrency = (val: number) => {
    return `Ksh ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedWrap}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'Overview' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Overview')}
          >
            <Text style={[styles.segmentText, activeTab === 'Overview' && styles.segmentTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'Transactions' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Transactions')}
          >
            <Text style={[styles.segmentText, activeTab === 'Transactions' && styles.segmentTextActive]}>
              Transactions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'Overview' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.overviewContent} showsVerticalScrollIndicator={false}>
          {/* Overview summary cards */}
          <View style={styles.sumCard}>
            <View style={[styles.sumIconWrap, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Ionicons name="cash-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.sumDetails}>
              <Text style={styles.sumLabel}>Available Balance</Text>
              <Text style={styles.sumVal}>{formatCurrency(availableBalance)}</Text>
              <Text style={styles.sumSub}>Ready for withdrawal</Text>
            </View>
          </View>

          <View style={styles.sumCard}>
            <View style={[styles.sumIconWrap, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.sumDetails}>
              <Text style={styles.sumLabel}>Pending Earnings</Text>
              <Text style={styles.sumVal}>{formatCurrency(pendingEarnings)}</Text>
              <Text style={styles.sumSub}>Under verification process</Text>
            </View>
          </View>

          <View style={styles.sumCard}>
            <View style={[styles.sumIconWrap, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <Ionicons name="trending-up-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.sumDetails}>
              <Text style={styles.sumLabel}>Total Lifetime Earned</Text>
              <Text style={styles.sumVal}>{formatCurrency(totalEarned)}</Text>
              <Text style={styles.sumSub}>Cumulative commissions earned</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={earnings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.earningItem}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                </View>
                
                <View style={styles.earningBody}>
                  <View style={styles.earningTopRow}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userAmount}>Ksh {item.amount}</Text>
                  </View>
                  <Text style={styles.planName}>{item.planName}</Text>
                  <Text style={styles.earningDate}>{item.date}</Text>
                </View>

                <View style={styles.commissionWrap}>
                  <Text style={styles.commissionLabel}>Your Commission</Text>
                  <Text style={styles.commissionAmount}>Ksh {item.commission}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                <Text style={styles.emptyText}>No commissions records found</Text>
              </View>
            }
          />

          {/* Period Filter Chips */}
          <View style={styles.filterWrap}>
            {['Today', 'This Week', 'This Month', 'All'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.filterChip,
                  filterPeriod === period && styles.filterChipActive
                ]}
                onPress={() => setFilterPeriod(period as any)}
              >
                <Text style={[
                  styles.filterText,
                  filterPeriod === period && styles.filterTextActive
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
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
  segmentedWrap: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  overviewContent: {
    padding: 20,
    gap: 12,
  },
  sumCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  sumIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumDetails: {
    flex: 1,
  },
  sumLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  sumVal: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  sumSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 160,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  earningBody: {
    flex: 1,
  },
  earningTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  userName: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  userAmount: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  earningDate: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  commissionWrap: {
    alignItems: 'flex-end',
  },
  commissionLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  commissionAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  filterWrap: {
    position: 'absolute',
    bottom: 84,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: GREEN,
  },
  filterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

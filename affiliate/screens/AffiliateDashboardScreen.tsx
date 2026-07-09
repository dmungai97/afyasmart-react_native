import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAffiliateStore } from '../services/affiliate.service';
import { useAuthStore } from '@/src/store/authStore';

const GREEN = '#0B6E6E';
const GREEN_DARK = '#053E3E';
const LIGHT_BG = '#F5F7FA';

export function AffiliateDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  
  const availableBalance = useAffiliateStore((s) => s.availableBalance);
  const pendingEarnings = useAffiliateStore((s) => s.pendingEarnings);
  const totalEarned = useAffiliateStore((s) => s.totalEarned);
  
  const referralsCount = useAffiliateStore((s) => s.referralsCount);
  const activeUsersCount = useAffiliateStore((s) => s.activeUsersCount);
  const conversionRate = useAffiliateStore((s) => s.conversionRate);
  const affiliateId = useAffiliateStore((s) => s.affiliateId);

  const formatCurrency = (val: number) => {
    return `Ksh ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const displayName = user?.name?.split(' ')[0] ?? 'Duncan';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.menuBtn}>
              <Ionicons name="menu-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerAppTitle}>AfyaSmart</Text>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(displayName[0] ?? 'D').toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.welcomeWrap}>
              <Text style={styles.affTag}>Affiliate</Text>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>Affiliate ID: {affiliateId}</Text>
                <Ionicons name="copy-outline" size={12} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </View>
        </View>

        {/* Hero Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
            </View>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
          </View>
          
          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStatCol}>
              <Text style={styles.balStatLabel}>Pending Earnings</Text>
              <Text style={styles.balStatVal}>{formatCurrency(pendingEarnings)}</Text>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatCol}>
              <Text style={styles.balStatLabel}>Total Earned</Text>
              <Text style={styles.balStatVal}>{formatCurrency(totalEarned)}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.withdrawBtn}
            onPress={() => router.push('/affiliate/withdraw' as any)}
          >
            <Text style={styles.withdrawBtnText}>Withdraw to M-Pesa</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Overview Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <TouchableOpacity onPress={() => router.push('/affiliate/earnings' as any)}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Today</Text>
            <Text style={[styles.overviewVal, { color: '#16A34A' }]}>Ksh 120</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>This Week</Text>
            <Text style={[styles.overviewVal, { color: '#16A34A' }]}>Ksh 540</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>This Month</Text>
            <Text style={[styles.overviewVal, { color: '#16A34A' }]}>Ksh 1,840</Text>
          </View>
        </View>

        {/* Performance Section */}
        <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginTop: 24, marginBottom: 12 }]}>
          Performance
        </Text>
        
        <View style={styles.perfRow}>
          <View style={styles.perfCol}>
            <View style={[styles.perfIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.perfVal}>{referralsCount}</Text>
            <Text style={styles.perfLabel}>Referrals</Text>
          </View>
          
          <View style={styles.perfCol}>
            <View style={[styles.perfIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.perfVal}>{activeUsersCount}</Text>
            <Text style={styles.perfLabel}>Active Users</Text>
          </View>

          <View style={styles.perfCol}>
            <View style={[styles.perfIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="trending-up" size={20} color="#D97706" />
            </View>
            <Text style={styles.perfVal}>{conversionRate}%</Text>
            <Text style={styles.perfLabel}>Conversion Rate</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: GREEN,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuBtn: {
    padding: 4,
  },
  headerAppTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 28,
    padding: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  welcomeWrap: {
    flex: 1,
  },
  affTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: -2,
    marginBottom: 4,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 6,
  },
  idText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: -44,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E6EAEF',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  balanceLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#1E293B',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginBottom: 18,
  },
  balanceStatCol: {
    flex: 1,
  },
  balStatLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  balStatVal: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  balanceStatDivider: {
    width: 0.5,
    backgroundColor: '#E2E8F0',
  },
  withdrawBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  withdrawBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 13,
    color: GREEN,
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  overviewLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  overviewVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  perfRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  perfCol: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  perfIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  perfVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  perfLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});

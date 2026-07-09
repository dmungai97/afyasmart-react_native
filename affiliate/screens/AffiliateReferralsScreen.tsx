import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, Share, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAffiliateStore, Referral } from '../services/affiliate.service';

const GREEN = '#0B6E6E';
const GREEN_DARK = '#053E3E';
const LIGHT_BG = '#F5F7FA';

export function AffiliateReferralsScreen() {
  const referrals = useAffiliateStore((s) => s.referrals);
  const referralsCount = useAffiliateStore((s) => s.referralsCount);
  const activeUsersCount = useAffiliateStore((s) => s.activeUsersCount);
  const affiliateId = useAffiliateStore((s) => s.affiliateId);

  const [activeTab, setActiveTab] = useState<'List' | 'Link'>('List');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const referralLink = `https://afyasmart.app/register?ref=${affiliateId}`;

  const inactiveUsersCount = referralsCount - activeUsersCount;

  const copyToClipboard = async (text: string, message: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', message);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Use my referral link to register on AfyaSmart: ${referralLink}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const filteredReferrals = referrals.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Referrals</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedWrap}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'List' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('List')}
          >
            <Text style={[styles.segmentText, activeTab === 'List' && styles.segmentTextActive]}>
              My Referrals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'Link' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Link')}
          >
            <Text style={[styles.segmentText, activeTab === 'Link' && styles.segmentTextActive]}>
              Referral Link
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'List' ? (
        <FlatList
          data={filteredReferrals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Summary stats block */}
              <View style={styles.statsCard}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Invited</Text>
                  <Text style={[styles.statVal, { color: '#4F46E5' }]}>{referralsCount}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Active</Text>
                  <Text style={[styles.statVal, { color: '#059669' }]}>{activeUsersCount}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Inactive</Text>
                  <Text style={[styles.statVal, { color: '#DC2626' }]}>{inactiveUsersCount}</Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search referrals..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter chips */}
              <View style={styles.chipsRow}>
                {['All', 'Active', 'Inactive'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      statusFilter === status && styles.chipActive
                    ]}
                    onPress={() => setStatusFilter(status as any)}
                  >
                    <Text style={[
                      styles.chipText,
                      statusFilter === status && styles.chipTextActive
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.referralItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={styles.referralDetails}>
                <Text style={styles.referralName}>{item.name}</Text>
                <Text style={styles.referralDate}>Joined {item.joinedDate}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.status === 'Active' ? '#DCFCE7' : '#F1F5F9' }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: item.status === 'Active' ? '#16A34A' : '#64748B' }
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>No referrals found</Text>
            </View>
          }
        />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.linkContent} showsVerticalScrollIndicator={false}>
          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <TouchableOpacity 
              style={styles.codeBadgeRow}
              onPress={() => copyToClipboard(affiliateId, 'Referral code copied to clipboard!')}
              activeOpacity={0.7}
            >
              <Text style={styles.codeText}>{affiliateId}</Text>
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Referral Link Box */}
          <Text style={styles.boxLabel}>Your Referral Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
            <TouchableOpacity 
              style={styles.copyBtn}
              onPress={() => copyToClipboard(referralLink, 'Referral link copied to clipboard!')}
            >
              <Ionicons name="copy-outline" size={18} color={GREEN} />
            </TouchableOpacity>
          </View>

          {/* Share Via */}
          <Text style={styles.shareLabel}>Share via</Text>
          <View style={styles.shareRowOptions}>
            <TouchableOpacity style={styles.shareIconCol} onPress={handleShare}>
              <View style={[styles.shareIconWrap, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.shareOptionText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareIconCol} onPress={handleShare}>
              <View style={[styles.shareIconWrap, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="paper-plane" size={20} color="#0088cc" />
              </View>
              <Text style={styles.shareOptionText}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareIconCol} onPress={handleShare}>
              <View style={[styles.shareIconWrap, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </View>
              <Text style={styles.shareOptionText}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareIconCol} onPress={handleShare}>
              <View style={[styles.shareIconWrap, { backgroundColor: '#ECEFF1' }]}>
                <Ionicons name="chatbox-ellipses" size={20} color="#546E7A" />
              </View>
              <Text style={styles.shareOptionText}>SMS</Text>
            </TouchableOpacity>
          </View>

          {/* Invite & Earn Promo Card */}
          <View style={styles.promoCard}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoTitle}>Invite & Earn</Text>
              <Text style={styles.promoDesc}>
                Earn 30% commission for every successful subscription of your referral.
              </Text>
            </View>
            <View style={styles.giftIconWrap}>
              <Text style={{ fontSize: 36 }}>🎁</Text>
            </View>
          </View>
        </ScrollView>
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
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statDivider: {
    width: 0.5,
    backgroundColor: '#E2E8F0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: GREEN,
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#F1F5F9',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  referralDetails: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  referralDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
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
  scroll: { flex: 1 },
  linkContent: {
    padding: 20,
    paddingBottom: 60,
  },
  codeCard: {
    backgroundColor: GREEN,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  codeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  boxLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingLeft: 14,
    height: 48,
    gap: 10,
    marginBottom: 24,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  copyBtn: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  shareLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  shareRowOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  shareIconCol: {
    alignItems: 'center',
    width: '22%',
  },
  shareIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shareOptionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  promoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  promoLeft: {
    flex: 1,
  },
  promoTitle: {
    color: '#312E81',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  promoDesc: {
    color: '#4338CA',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  giftIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

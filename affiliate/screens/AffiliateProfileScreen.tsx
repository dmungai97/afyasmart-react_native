import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useAffiliateStore } from '../services/affiliate.service';

const GREEN = '#0B6E6E';
const DARK_NAVY = '#0B1F2D';
const LIGHT_BG = '#F5F7FA';

export function AffiliateProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const affiliateSince = useAffiliateStore((s) => s.affiliateSince);

  const formatPhone = (phone?: string) => {
    if (!phone) return '2547XXXXXXXX';
    return phone;
  };

  const handleExitAffiliate = () => {
    // Navigate back to the standard user dashboard
    router.replace('/(tabs)/profile' as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out of AfyaSmart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  const name = user?.name ?? 'Duncan';
  const initial = name[0]?.toUpperCase() ?? 'D';

  const menuItems = [
    { id: 'account', label: 'Account Details', icon: 'person-outline' as const },
    { id: 'mpesa', label: 'M-Pesa Details', icon: 'cash-outline' as const },
    { id: 'password', label: 'Change Password', icon: 'lock-closed-outline' as const },
    { id: 'notifs', label: 'Notification Settings', icon: 'notifications-outline' as const },
    { id: 'help', label: 'Help & Support', icon: 'help-circle-outline' as const },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Block with Avatar - Dark Navy as in screenshot */}
      <View style={styles.heroHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleExitAffiliate} style={styles.exitBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userPhone}>{formatPhone(user?.phone)}</Text>
          {affiliateSince && <Text style={styles.affiliateSince}>Affiliate since {affiliateSince}</Text>}
        </View>
      </View>

      {/* Menu Cards */}
      <View style={styles.menuCard}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={item.id} style={[styles.menuItem, idx < menuItems.length - 1 && styles.borderBottom]}>
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={18} color="#475569" />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Switch to Patient Portal Option */}
      <View style={[styles.menuCard, { marginTop: 12 }]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleExitAffiliate}>
          <View style={styles.menuLeft}>
            <Ionicons name="medical-outline" size={18} color={GREEN} />
            <Text style={[styles.menuLabel, { color: GREEN }]}>Switch to Patient Portal</Text>
          </View>
          <Ionicons name="swap-horizontal" size={16} color={GREEN} />
        </TouchableOpacity>
      </View>

      {/* Logout Option */}
      <View style={[styles.menuCard, { marginTop: 12 }]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuLeft}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={[styles.menuLabel, { color: '#DC2626' }]}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>AfyaSmart Affiliate v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  content: { paddingBottom: 40 },
  heroHeader: {
    backgroundColor: DARK_NAVY,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exitBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsIcon: {
    padding: 4,
  },
  avatarBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  userPhone: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  affiliateSince: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 32,
  },
});

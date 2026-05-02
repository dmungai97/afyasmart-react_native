import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

const TEAL = '#0B6E6E';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  danger?: boolean;
  onPress?: () => void;
};

export default function ProfileScreen() {
  const user      = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router    = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
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

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline',        label: 'Personal Information', sub: 'Name, email, phone' },
        { icon: 'lock-closed-outline',   label: 'Change Password',      sub: 'Update your password' },
        { icon: 'notifications-outline', label: 'Notifications',        sub: 'Manage alerts' },
      ],
    },
    {
      title: 'Health',
      items: [
        { icon: 'document-text-outline', label: 'Medical History',    sub: 'Your health records' },
        {
          icon: 'card-outline',
          label: 'Subscription Plan',
          sub: 'Free plan · Upgrade',
          onPress: () => router.push('/(tabs)/subscription' as any),
        },
        { icon: 'receipt-outline', label: 'Payment History', sub: 'View transactions' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline',      label: 'Help & Support',      sub: 'Get assistance' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy',      sub: 'How we use your data' },
        { icon: 'document-outline',         label: 'Terms & Conditions',  sub: 'Read our terms' },
        { icon: 'star-outline',             label: 'Rate AfyaSmart',       sub: 'Share your feedback' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
            {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Consultations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Prescriptions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>Free</Text>
            <Text style={styles.statLabel}>Current Plan</Text>
          </View>
        </View>
      </View>

      {/* Upgrade banner */}
      <TouchableOpacity
        style={styles.upgradeBanner}
        onPress={() => router.push('/(tabs)/subscription' as any)}
      >
        <View style={styles.upgradeIcon}>
          <Ionicons name="diamond-outline" size={20} color={TEAL} />
        </View>
        <View style={styles.upgradeText}>
          <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
          <Text style={styles.upgradeSub}>AI chat, unlimited consultations & more</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={TEAL} />
      </TouchableOpacity>

      {/* Menu sections */}
      {menuSections.map((section, si) => (
        <View key={si} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.menuItem,
                  i < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
                activeOpacity={item.onPress ? 0.7 : 1}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color={TEAL} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={item.onPress ? '#aaa' : '#ddd'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      <View style={styles.section}>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIconWrap, styles.menuIconDanger]}>
              <Ionicons name="log-out-outline" size={18} color="#c62828" />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, styles.dangerText]}>Logout</Text>
              <Text style={styles.menuSub}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>AfyaSmart v1.0.0 · Kenya</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9f9' },
  content:   { paddingBottom: 40 },

  header: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e8e8e8',
    marginBottom: 16,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(11,110,110,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: TEAL },
  userInfo:   { flex: 1 },
  userName:   { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  userEmail:  { fontSize: 13, color: '#888' },
  userPhone:  { fontSize: 13, color: '#888', marginTop: 1 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 0.5, backgroundColor: '#e8e8e8' },
  statNumber:  { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  statLabel:   { fontSize: 11, color: '#888' },

  upgradeBanner: {
    backgroundColor: 'rgba(11,110,110,0.06)',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(11,110,110,0.2)',
  },
  upgradeIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(11,110,110,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  upgradeText:  { flex: 1 },
  upgradeTitle: { fontSize: 14, fontWeight: '700', color: TEAL },
  upgradeSub:   { fontSize: 12, color: '#555', marginTop: 1 },

  section:      { marginHorizontal: 20, marginBottom: 12 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#888',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(11,110,110,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: 'rgba(198,40,40,0.08)' },
  menuText:   { flex: 1 },
  menuLabel:  { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  menuSub:    { fontSize: 11, color: '#888', marginTop: 1 },
  dangerText: { color: '#c62828' },
  version:    { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 8 },
});
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { getAccessState } from '@/src/services/subscription.model';

const TEAL        = '#005454';
const PURPLE      = '#712ae2';
const ORANGE      = '#D47A00';
const RED         = '#C62828';
const GREEN       = '#0B845C';

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  bg: string;
  premium?: boolean;
};

export function HomeScreen() {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const access    = getAccessState(user);

  const features: Feature[] = [
    {
      icon: 'chatbubble-ellipses',
      title: 'Health Assistant',
      subtitle: 'AI Chatbot',
      route: '/(tabs)/chat',
      color: PURPLE,
      bg: '#F3EEFF',
    },
    {
      icon: 'pulse',
      title: 'Symptoms',
      subtitle: 'Checker',
      route: '/(tabs)/symptoms',
      color: GREEN,
      bg: '#D1F7E2',
      premium: false, // Allowed for free tier (protected by 3 checks/day spam limit on API)
    },
    {
      icon: 'medical',
      title: 'Drugs',
      subtitle: 'Database',
      route: '/(tabs)/drugs',
      color: ORANGE,
      bg: '#FFEEDD',
      premium: true,
    },
    {
      icon: 'location',
      title: 'Nearby Health',
      subtitle: 'Services',
      route: '/(tabs)/map',
      color: RED,
      bg: '#FFE5E5',
      premium: true,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf9" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerUserInfo}>
            <Text style={styles.hiText}>Hi, {user?.name?.split(' ')[0] ?? 'User'} 👋</Text>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>AfyaSmart</Text>
              {access.subscribed && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color={TEAL} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroBanner}>
          {/* Decorative Icon */}
          <View style={styles.heroDecoIconWrap}>
            <Ionicons name="shield-half" size={180} color="rgba(255,255,255,0.08)" />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Your health, our priority</Text>
            <Text style={styles.heroDesc}>
              Get trusted health info and find the best care near you.
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/(tabs)/chat' as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.heroBtnText}>Chat Now</Text>
              <Ionicons name="arrow-forward" size={14} color={TEAL} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.featureGrid}>
            {features.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={styles.featureCard}
                onPress={() => {
                  if (f.premium && !access.subscribed) {
                    router.push('/(tabs)/subscription' as any);
                    return;
                  }
                  router.push(f.route as any);
                }}
                activeOpacity={0.85}
              >
                {/* Lock Badge */}
                {f.premium && !access.subscribed && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={12} color="#6e7979" />
                  </View>
                )}

                <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={28} color={f.color} />
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Unlock Banner */}
        {!access.subscribed && (
          <View style={styles.unlockBanner}>
            <View style={styles.unlockLeft}>
              <Text style={styles.unlockTitle}>Unlock Full Access</Text>
              <Text style={styles.unlockSub}>
                {access.freeChatEligible
                  ? `${access.remainingChats} free chat${access.remainingChats === 1 ? '' : 's'} left. Subscribe for full access.`
                  : 'Your subscription has ended. Renew to restore full access.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewPlansBtn}
              onPress={() => router.push('/(tabs)/subscription' as any)}
              activeOpacity={0.9}
            >
              <Text style={styles.viewPlansBtnText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Emergency Warning */}
        <View style={styles.emergencyBanner}>
          <Ionicons name="warning" size={18} color="#ba1a1a" style={{ marginTop: 2 }} />
          <Text style={styles.emergencyText}>
            For emergencies, go to your nearest hospital immediately.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7faf9' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 16 },
  header: {
    backgroundColor: '#f7faf9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontWeight: '700', fontSize: 18 },
  headerUserInfo: { flexDirection: 'column' },
  hiText: { color: '#3e4948', fontSize: 12, fontWeight: '500' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: TEAL, fontSize: 20, fontWeight: '700' },
  premiumBadge: {
    backgroundColor: '#eaddff',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: '#5a00c6',
    fontSize: 10,
    fontWeight: '800',
  },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#edf0f2',
  },
  heroBanner: {
    backgroundColor: '#006a6a',
    borderRadius: 24,
    padding: 24,
    height: 190,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroDecoIconWrap: {
    position: 'absolute',
    right: -20,
    top: -20,
    opacity: 0.15,
  },
  heroContent: {
    zIndex: 10,
    maxWidth: '75%',
    gap: 8,
  },
  heroTitle: {
    color: '#9dedec',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  heroDesc: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
    lineHeight: 20,
  },
  heroBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: TEAL,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroBtnText: { color: TEAL, fontWeight: '700', fontSize: 14 },
  gridContainer: {
    marginBottom: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#edf0f2',
    position: 'relative',
    shadowColor: TEAL,
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 8,
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#181c1c', textAlign: 'center' },
  featureSub: { fontSize: 12, color: '#3e4948', textAlign: 'center' },
  unlockBanner: {
    backgroundColor: '#004f50',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  unlockLeft: { flex: 1, gap: 4 },
  unlockTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  unlockSub: { fontSize: 12, color: '#ffffff', opacity: 0.8, lineHeight: 18 },
  viewPlansBtn: {
    backgroundColor: TEAL,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  viewPlansBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(250, 235, 235, 0.8)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    marginBottom: 24,
  },
  emergencyText: { fontSize: 12, color: '#93000a', flex: 1, lineHeight: 18, fontWeight: '500' },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    opacity: 0.6,
  },
  logoutText: { fontSize: 14, color: '#718096', fontWeight: '600' },
});

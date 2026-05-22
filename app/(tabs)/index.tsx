import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { getAccessState } from '../../src/services/subscription.model';

const TEAL        = '#0B6E6E';
const TEAL_DARK   = '#084F4F';
const PURPLE      = '#7C3AED';
const ORANGE      = '#EA580C';
const RED         = '#DC2626';
const BLUE        = '#2563EB';
const GREEN       = '#16A34A';

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  bg: string;
  premium?: boolean;
};

export default function HomeScreen() {
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const access    = getAccessState(user);

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening';

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
      bg: '#EDFAF2',
      premium: true,
    },
    {
      icon: 'medical',
      title: 'Drugs',
      subtitle: 'Database',
      route: '/(tabs)/drugs',
      color: ORANGE,
      bg: '#FFF4ED',
      premium: true,
    },
    {
      icon: 'location',
      title: 'Nearby Health',
      subtitle: 'Services',
      route: '/(tabs)/map',
      color: RED,
      bg: '#FFF0F0',
      premium: true,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name?.[0] ?? 'U').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.hiText}>
                Hi, {user?.name?.split(' ')[0] ?? 'there'} 👋
              </Text>
              <Text style={styles.subText}>How can we help you today?</Text>
              {/*  Change 3: Premium chip for subscribed users */}
              {user?.is_subscribed && (
                <View style={styles.subscribedChip}>
                  <Text style={styles.subscribedChipText}> Premium</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Hero Banner ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTag}>Your health, our priority</Text>
            <Text style={styles.heroDesc}>
              Get trusted health info and find the best care near you.
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/(tabs)/chat' as any)}
            >
              <Text style={styles.heroBtnText}>Chat Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroIllustration}>
            <View style={styles.doctorCircle}>
              <Ionicons name="person" size={48} color={TEAL} />
            </View>
            <View style={[styles.ring, { width: 80, height: 80, opacity: 0.15 }]} />
            <View style={[styles.ring, { width: 100, height: 100, opacity: 0.08 }]} />
          </View>
        </View>

        {/* ── Feature Grid ── */}
        <Text style={styles.sectionTitle}>What would you like to do?</Text>
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
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={26} color={f.color} />
              </View>
              {f.premium && !access.subscribed && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={10} color="#fff" />
                </View>
              )}
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Change 1: Unlock banner — hidden for subscribed users */}
        {!access.subscribed && (
          <View style={styles.unlockBanner}>
            <View style={styles.unlockLeft}>
              <View style={styles.crownWrap}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.unlockTitle}>Unlock Full Access</Text>
                <Text style={styles.unlockSub}>
                  {access.remainingChats} free chat{access.remainingChats === 1 ? '' : 's'} left. Subscribe for full access.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewPlansBtn}
              onPress={() => router.push('/(tabs)/subscription' as any)}
            >
              <Text style={styles.viewPlansBtnText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Emergency Banner ── */}
        <View style={styles.emergencyBanner}>
          <Ionicons name="warning" size={16} color={RED} />
          <Text style={styles.emergencyText}>
            For emergencies, go to your nearest hospital immediately.
          </Text>
        </View>

        {/* ✅ Change 2: Logout with redirect */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={async () => {
            await clearAuth();
            router.replace('/(auth)/login' as any);
          }}
        >
          <Ionicons name="log-out-outline" size={16} color="#999" />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  // ── Header ──
  header: {
    backgroundColor: TEAL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hiText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // New: Premium chip
  subscribedChip: {
    marginTop: 4,
    backgroundColor: 'rgba(22,163,74,0.20)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  subscribedChipText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Hero Banner ──
  heroBanner: {
    backgroundColor: TEAL,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroDesc: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  heroBtnText: { color: TEAL, fontWeight: '700', fontSize: 13 },
  heroIllustration: {
    width: 100, height: 100,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  doctorCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // ── Feature Grid ──
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  featureSub: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },

  // ── Unlock Banner ──
  unlockBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E0FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  unlockLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  crownWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF8E7',
    alignItems: 'center', justifyContent: 'center',
  },
  crownEmoji: { fontSize: 18 },
  unlockTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  unlockSub: { fontSize: 12, color: '#888', lineHeight: 18 },
  viewPlansBtn: {
    backgroundColor: TEAL,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  viewPlansBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statCard: { alignItems: 'center', gap: 6, flex: 1 },
  statLabel: { fontSize: 12, color: '#555', fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: '#eee' },

  // ── Emergency ──
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#FFCDD2',
  },
  emergencyText: { fontSize: 12, color: RED, flex: 1, lineHeight: 18 },

  // ── Logout ──
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 13, color: '#999' },
});

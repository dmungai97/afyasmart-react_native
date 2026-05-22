import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosisStore } from '../../src/store/diagnosisStore';
import { useAuthStore } from '../../src/store/authStore';

const TEAL       = '#0B6E6E';
const TEAL_DARK  = '#063D3D';
const BG         = '#F0F7F7';

const LOCKED_CONDITIONS = [
  { icon: 'fitness-outline',   label: 'Condition 1',  severity: 'Medium', color: '#F59E0B' },
  { icon: 'thermometer-outline', label: 'Condition 2', severity: 'High',   color: '#EF4444' },
  { icon: 'bandage-outline',   label: 'Condition 3',  severity: 'Low',    color: '#22C55E' },
];

const UNLOCK_FEATURES = [
  { icon: 'list-circle-outline',  text: 'Possible conditions with probabilities' },
  { icon: 'medical-outline',      text: 'Recommended medication & dosage'        },
  { icon: 'alert-circle-outline', text: 'Urgency level (Low / Medium / High)'    },
  { icon: 'location-outline',     text: 'Nearby hospitals, doctors & pharmacies' },
  { icon: 'chatbubble-ellipses-outline', text: 'Unlimited AI follow-up chat'     },
];

const PLANS = [
  { id: 'daily',   label: 'Daily',   price: 'Ksh 20',  badge: 'Most Popular', badgeColor: '#22C55E' },
  { id: 'weekly',  label: 'Weekly',  price: 'Ksh 100', badge: 'Save 30%',     badgeColor: TEAL      },
  { id: 'monthly', label: 'Monthly', price: 'Ksh 200', badge: 'Best Value',   badgeColor: '#7C3AED' },
];

export default function LockedResultsScreen() {
  const router = useRouter();
  const diagnosis = useDiagnosisStore((s) => s.pendingDiagnosis);
  const token = useAuthStore((s) => s.token);

  // ── Animations ─────────────────────────────────────────────
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Pulse on lock icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Subtle shake on lock after 2s
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue:  6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 80, useNativeDriver: true }),
      ]).start();
    }, 2000);
  }, []);

  const handleSubscribe = (planId: string) => {
    if (token) {
      router.push({
        pathname: '/(tabs)/subscription' as any,
        params: { plan: planId },
      });
      return;
    }

    router.push({
      pathname: '/(auth)/register' as any,
      params: { plan: planId, from: 'locked-results' },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top banner ── */}
        <Animated.View style={[styles.banner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.lockCircle, { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }]}>
            <Ionicons name="lock-closed" size={32} color="#fff" />
          </Animated.View>
          <Text style={styles.bannerTitle}>Analysis Complete ✅</Text>
          <Text style={styles.bannerSub}>
            We found <Text style={styles.bannerHighlight}>{diagnosis?.conditions.length ?? 3} possible conditions</Text> related to your symptoms
          </Text>
        </Animated.View>

        {/* ── Locked conditions ── */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Your Results</Text>
          {LOCKED_CONDITIONS.map((c, i) => (
            <View key={i} style={styles.conditionCard}>
              {/* Blurred content */}
              <View style={styles.conditionLeft}>
                <View style={[styles.conditionIconBg, { backgroundColor: c.color + '20' }]}>
                  <Ionicons name={c.icon as any} size={20} color={c.color} />
                </View>
                <View style={styles.conditionInfo}>
                  <View style={styles.conditionBlurBar} />
                  <View style={[styles.conditionBlurBar, { width: '60%', marginTop: 6 }]} />
                </View>
              </View>
              {/* Lock overlay */}
              <View style={styles.conditionLockChip}>
                <Ionicons name="lock-closed" size={11} color="#999" />
                <Text style={styles.conditionLockText}>Locked</Text>
              </View>
            </View>
          ))}

          {/* Urgency row — blurred */}
          <View style={styles.urgencyRow}>
            <Ionicons name="alert-circle" size={16} color="#F59E0B" />
            <Text style={styles.urgencyLabel}>Urgency Level:</Text>
            <View style={styles.urgencyBlur} />
            <Ionicons name="lock-closed" size={12} color="#ccc" />
          </View>
        </Animated.View>

        {/* ── What you unlock ── */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Unlock Full Results</Text>
          <View style={styles.featuresCard}>
            {UNLOCK_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Urgency hook ── */}
        <Animated.View style={[styles.hookBanner, { opacity: fadeAnim }]}>
          <Text style={styles.hookText}>
            🔒 Your first diagnosis is already prepared
          </Text>
          <Text style={styles.hookSub}>You&apos;re 1 step away from seeing your results</Text>
        </Animated.View>

        {/* ── Plans ── */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Choose a Plan</Text>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                plan.id === 'daily' && styles.planCardFeatured,
              ]}
              onPress={() => handleSubscribe(plan.id)}
              activeOpacity={0.82}
            >
              <View style={styles.planLeft}>
                <View style={styles.planLabelRow}>
                  <Text style={[
                    styles.planLabel,
                    plan.id === 'daily' && styles.planLabelFeatured,
                  ]}>
                    {plan.label}
                  </Text>
                  <View style={[styles.planBadge, { backgroundColor: plan.badgeColor + '20' }]}>
                    <Text style={[styles.planBadgeText, { color: plan.badgeColor }]}>
                      {plan.badge}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.planNote,
                  plan.id === 'daily' && styles.planNoteFeatured,
                ]}>
                  Full access · Cancel anytime
                </Text>
              </View>
              <View style={styles.planRight}>
                <Text style={[
                  styles.planPrice,
                  plan.id === 'daily' && styles.planPriceFeatured,
                ]}>
                  {plan.price}
                </Text>
                <Ionicons
                  name="arrow-forward-circle"
                  size={22}
                  color={plan.id === 'daily' ? '#fff' : TEAL}
                />
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Footer note ── */}
        <Text style={styles.footerNote}>
          Paid via M-Pesa · Secure & instant · No hidden charges
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 48 },

  // Banner
  banner: {
    backgroundColor: TEAL_DARK, alignItems: 'center',
    paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24,
    gap: 12,
  },
  lockCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  bannerTitle:     { color: '#fff', fontSize: 22, fontWeight: '900' },
  bannerSub:       { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  bannerHighlight: { color: '#4ADE80', fontWeight: '800' },

  // Section
  section:      { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  sectionTitle: { color: TEAL_DARK, fontSize: 16, fontWeight: '800', marginBottom: 4 },

  // Conditions
  conditionCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  conditionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  conditionIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  conditionInfo:  { flex: 1 },
  conditionBlurBar: {
    height: 10, backgroundColor: '#E5E5E5',
    borderRadius: 5, width: '80%',
  },
  conditionLockChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  conditionLockText: { color: '#999', fontSize: 11, fontWeight: '600' },

  // Urgency
  urgencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF9EC', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  urgencyLabel: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  urgencyBlur:  { flex: 1, height: 10, backgroundColor: '#FDE68A', borderRadius: 5, opacity: 0.6 },

  // Features
  featuresCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: '#444', fontSize: 13, flex: 1, lineHeight: 20 },

  // Hook
  hookBanner: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: '#FFF3CD', borderRadius: 14,
    padding: 16, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  hookText: { color: '#92400E', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  hookSub:  { color: '#A16207', fontSize: 12, textAlign: 'center' },

  // Plans
  planCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  planCardFeatured: {
    backgroundColor: TEAL_DARK,
    borderColor: '#4ADE80',
  },
  planLeft:       { flex: 1, gap: 4 },
  planLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel:      { color: TEAL_DARK, fontSize: 16, fontWeight: '800' },
  planLabelFeatured: { color: '#fff' },
  planBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  planBadgeText:  { fontSize: 10, fontWeight: '700' },
  planNote:       { color: '#999', fontSize: 11 },
  planNoteFeatured: { color: 'rgba(255,255,255,0.5)' },
  planRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planPrice:      { color: TEAL_DARK, fontSize: 18, fontWeight: '900' },
  planPriceFeatured: { color: '#4ADE80' },

  // Footer
  footerNote: {
    color: '#aaa', fontSize: 11, textAlign: 'center',
    marginTop: 20, paddingHorizontal: 24,
  },
});

import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosisStore } from '@/src/store/diagnosisStore';
import { useAuthStore } from '@/src/store/authStore';
import { PAPER, INK, INK_MUTED, INK_FAINT, ACCENT, RULE, SUCCESS, WARNING, DANGER } from '../theme';

const FALLBACK_CONDITIONS = [
  { icon: 'fitness-outline',     severity: 'Medium', color: WARNING },
  { icon: 'thermometer-outline', severity: 'High',   color: DANGER  },
  { icon: 'bandage-outline',     severity: 'Low',     color: SUCCESS },
];

const SEVERITY_ICON: Record<string, string> = {
  High: 'thermometer-outline',
  Medium: 'fitness-outline',
  Low: 'bandage-outline',
};

const SEVERITY_COLOR: Record<string, string> = {
  High: DANGER,
  Medium: WARNING,
  Low: SUCCESS,
};

const UNLOCK_FEATURES = [
  { icon: 'list-circle-outline',  text: 'Possible conditions with probabilities' },
  { icon: 'medical-outline',      text: 'Recommended medication & dosage'        },
  { icon: 'alert-circle-outline', text: 'Urgency level (Low / Medium / High)'    },
  { icon: 'location-outline',     text: 'Nearby hospitals, doctors & pharmacies' },
  { icon: 'chatbubble-ellipses-outline', text: 'Unlimited AI follow-up chat'     },
];

const PLANS = [
  { id: 'daily',   label: 'Daily',   price: 'Ksh 20',  badge: 'Most Popular' },
  { id: 'weekly',  label: 'Weekly',  price: 'Ksh 100', badge: 'Save 30%'     },
  { id: 'monthly', label: 'Monthly', price: 'Ksh 200', badge: 'Best Value'   },
];

export function LockedResultsScreen() {
  const router = useRouter();
  const diagnosis = useDiagnosisStore((s) => s.pendingDiagnosis);
  const token = useAuthStore((s) => s.token);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  const displayConditions = diagnosis?.conditions.length
    ? diagnosis.conditions.map((c) => ({
        icon: SEVERITY_ICON[c.level] ?? 'fitness-outline',
        severity: c.level,
        color: SEVERITY_COLOR[c.level] ?? WARNING,
      }))
    : FALLBACK_CONDITIONS;

  useEffect(() => {
    // This is the true end of the onboarding funnel (welcome -> health-check ->
    // symptom-chat -> analysis-loading -> here) regardless of whether the user
    // subscribes next, so this is where onboarding should be marked complete.
    completeOnboarding();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();

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
      <StatusBar barStyle="light-content" backgroundColor={INK} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top banner */}
        <Animated.View style={[styles.banner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.lockCircle, { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }]}>
            <Ionicons name="lock-closed-outline" size={30} color={PAPER} />
          </Animated.View>
          <Text style={styles.bannerTitle}>Analysis Complete</Text>
          <Text style={styles.bannerSub}>
            We found <Text style={styles.bannerHighlight}>{diagnosis?.conditions.length ?? 3} possible conditions</Text> related to your symptoms
          </Text>
        </Animated.View>

        {/* Locked conditions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Your Results</Text>
          <View style={styles.ruleList}>
            {displayConditions.map((c, i) => (
              <View key={i} style={styles.conditionRow}>
                <View style={styles.conditionLeft}>
                  <View style={[styles.conditionRule, { backgroundColor: c.color }]} />
                  <Ionicons name={c.icon as any} size={18} color={c.color} style={{ marginRight: 10 }} />
                  <View style={styles.conditionInfo}>
                    <View style={styles.conditionBlurBar} />
                    <View style={[styles.conditionBlurBar, { width: '60%', marginTop: 6 }]} />
                  </View>
                </View>
                <View style={styles.conditionLockChip}>
                  <Ionicons name="lock-closed-outline" size={11} color={INK_FAINT} />
                  <Text style={styles.conditionLockText}>Locked</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Urgency row — blurred */}
          <View style={styles.urgencyRow}>
            <Ionicons name="alert-circle-outline" size={16} color={ACCENT} />
            <Text style={styles.urgencyLabel}>Urgency Level:</Text>
            <View style={styles.urgencyBlur} />
            <Ionicons name="lock-closed-outline" size={12} color={INK_FAINT} />
          </View>
        </Animated.View>

        {/* What you unlock */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Unlock Full Results</Text>
          <View style={styles.ruleList}>
            {UNLOCK_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Ionicons name="checkmark" size={13} color={PAPER} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Urgency hook */}
        <Animated.View style={[styles.hookBanner, { opacity: fadeAnim }]}>
          <Text style={styles.hookText}>
            🔒 Your first diagnosis is already prepared
          </Text>
          <Text style={styles.hookSub}>You&apos;re 1 step away from seeing your results</Text>
        </Animated.View>

        {/* Plans */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Choose a Plan</Text>
          <View style={styles.ruleList}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planRow,
                  plan.id === 'daily' && styles.planRowFeatured,
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
                    <View style={styles.planBadge}>
                      <Text style={[
                        styles.planBadgeText,
                        plan.id === 'daily' && styles.planBadgeTextFeatured,
                      ]}>
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
                    name="arrow-forward"
                    size={18}
                    color={plan.id === 'daily' ? PAPER : INK}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Paid via M-Pesa · Secure & instant · No hidden charges
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: PAPER },
  scroll: { paddingBottom: 48 },
  banner: {
    backgroundColor: INK, alignItems: 'center',
    paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24,
    gap: 12,
  },
  lockCircle: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(238,241,234,0.35)',
  },
  bannerTitle:     { color: PAPER, fontSize: 21, fontWeight: '600' },
  bannerSub:       { color: 'rgba(238,241,234,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  bannerHighlight: { color: ACCENT, fontWeight: '600' },
  section:      { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { color: INK, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  ruleList: {
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  conditionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: RULE,
  },
  conditionLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  conditionRule:  { width: 2, height: 20, marginRight: 12 },
  conditionInfo:  { flex: 1 },
  conditionBlurBar: {
    height: 10, backgroundColor: RULE,
    width: '80%',
  },
  conditionLockChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  conditionLockText: { color: INK_FAINT, fontSize: 11, fontWeight: '600' },
  urgencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: RULE,
  },
  urgencyLabel: { color: INK_MUTED, fontSize: 13, fontWeight: '600' },
  urgencyBlur:  { flex: 1, height: 10, backgroundColor: RULE },
  featureRow:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: RULE,
  },
  featureCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: INK, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: INK_MUTED, fontSize: 13, flex: 1, lineHeight: 20 },
  hookBanner: {
    marginHorizontal: 20, marginTop: 24,
    paddingVertical: 16, alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: RULE,
  },
  hookText: { color: INK, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  hookSub:  { color: INK_FAINT, fontSize: 12, textAlign: 'center' },
  planRow: {
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: RULE,
  },
  planRowFeatured: {
    backgroundColor: INK,
    marginHorizontal: -20, paddingHorizontal: 20,
    borderBottomColor: INK,
  },
  planLeft:       { flex: 1, gap: 4 },
  planLabelRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel:      { color: INK, fontSize: 15, fontWeight: '600' },
  planLabelFeatured: { color: PAPER },
  planBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: ACCENT, borderRadius: 20 },
  planBadgeText:  { fontSize: 10, fontWeight: '600', color: ACCENT },
  planBadgeTextFeatured: { color: ACCENT },
  planNote:       { color: INK_FAINT, fontSize: 11 },
  planNoteFeatured: { color: 'rgba(238,241,234,0.55)' },
  planRight:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planPrice:      { color: INK, fontSize: 17, fontWeight: '600' },
  planPriceFeatured: { color: ACCENT },
  footerNote: {
    color: INK_FAINT, fontSize: 11, textAlign: 'center',
    marginTop: 24, paddingHorizontal: 24,
  },
});

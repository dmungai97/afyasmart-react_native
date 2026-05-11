import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');
const TEAL      = '#0B6E6E';
const TEAL_DARK = '#063D3D';

const FEATURES = [
  { icon: 'pulse-outline',            label: 'AI Symptom Analysis'     },
  { icon: 'medical-outline',          label: 'Drug Information'         },
  { icon: 'location-outline',         label: 'Nearby Health Services'   },
  { icon: 'chatbubble-ellipses-outline', label: 'Personal Health Chat'  },
];

export default function WelcomeScreen() {
  const router           = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  // ── Animations ────────────────────────────────────────────────
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const scaleAnim   = useRef(new Animated.Value(0.8)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();

    // Pulse loop on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleStart = async () => {
    router.push('/(onboarding)/health-check' as any);
  };

  const handleSkip = async () => {
    // Mark onboarding done, go straight to teaser chat on next visit
    await completeOnboarding();
    router.replace('/(onboarding)/symptom-chat' as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* ── Background ── */}
      <View style={styles.bgTop}>
        <View style={[styles.circle, { width: 300, height: 300, top: -100, right: -80, opacity: 0.1 }]} />
        <View style={[styles.circle, { width: 180, height: 180, top: 80,   left: -60, opacity: 0.07 }]} />
      </View>

      {/* ── Skip ── */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* ── Logo ── */}
      <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.logoOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.logoInner}>
            <View style={styles.crossV} />
            <View style={styles.crossH} />
          </View>
        </Animated.View>
        <View style={styles.pulseDot} />
      </Animated.View>

      {/* ── Hero text ── */}
      <Animated.View style={[styles.heroSection, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <Text style={styles.appName}>AfyaSmart</Text>
        <Text style={styles.tagline}>
          Find out what your symptoms{'\n'}mean in <Text style={styles.taglineAccent}>60 seconds</Text>
        </Text>
      </Animated.View>

      {/* ── Feature pills ── */}
      <Animated.View style={[styles.featuresRow, { opacity: fadeAnim }]}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featurePill}>
            <Ionicons name={f.icon as any} size={14} color={TEAL} />
            <Text style={styles.featurePillText}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── Trust strip ── */}
      <Animated.View style={[styles.trustStrip, { opacity: fadeAnim }]}>
        <View style={styles.trustItem}>
          <Ionicons name="shield-checkmark" size={14} color="#4ADE80" />
          <Text style={styles.trustText}>Trusted by Kenyans</Text>
        </View>
        <View style={styles.trustDot} />
        <View style={styles.trustItem}>
          <Ionicons name="lock-closed" size={14} color="#4ADE80" />
          <Text style={styles.trustText}>Private & Secure</Text>
        </View>
        <View style={styles.trustDot} />
        <View style={styles.trustItem}>
          <Ionicons name="flash" size={14} color="#4ADE80" />
          <Text style={styles.trustText}>Instant Results</Text>
        </View>
      </Animated.View>

      {/* ── CTA ── */}
      <Animated.View style={[styles.ctaSection, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Start Free Health Check</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.ctaNote}>
          No credit card required · Takes only 60 seconds
        </Text>
      </Animated.View>

      {/* ── Pricing hint — no pressure ── */}
      <Animated.View style={[styles.pricingHint, { opacity: fadeAnim }]}>
        <Text style={styles.pricingHintText}>
          Full access from <Text style={styles.pricingHintAccent}>Ksh 20/day</Text>
        </Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TEAL_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Background decoration
  bgTop:  { ...StyleSheet.absoluteFillObject },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },

  // Skip
  skipBtn: { position: 'absolute', top: 56, right: 24 },
  skipText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoOuter: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  crossV:   { position: 'absolute', width: 6, height: 32, backgroundColor: '#fff', borderRadius: 3 },
  crossH:   { position: 'absolute', width: 32, height: 6, backgroundColor: '#fff', borderRadius: 3 },
  pulseDot: {
    position: 'absolute', bottom: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#4ADE80',
    borderWidth: 2, borderColor: TEAL_DARK,
  },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 32 },
  appName: {
    color: '#fff', fontSize: 36, fontWeight: '900',
    letterSpacing: 1, marginBottom: 12,
  },
  tagline: {
    color: 'rgba(255,255,255,0.75)', fontSize: 17,
    textAlign: 'center', lineHeight: 26,
  },
  taglineAccent: { color: '#4ADE80', fontWeight: '800' },

  // Feature pills
  featuresRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8, marginBottom: 28,
    width: '100%',
  },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
  },
  featurePillText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },

  // Trust strip
  trustStrip: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 36,
  },
  trustItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText:  { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  trustDot:   { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },

  // CTA
  ctaSection: { width: '100%', alignItems: 'center', gap: 12 },
  ctaBtn: {
    width: '100%', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4ADE80',
    borderRadius: 16, paddingVertical: 17,
  },
  ctaBtnText: { color: '#063D3D', fontSize: 17, fontWeight: '900' },
  ctaNote:    { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' },

  // Pricing hint
  pricingHint: { position: 'absolute', bottom: 36 },
  pricingHintText:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' },
  pricingHintAccent: { color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
});
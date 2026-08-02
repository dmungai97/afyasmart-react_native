import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TEAL_DARK = "#061A1A";

const seededDoctors = require("../../../seed-data/doctors.json") as { hospital: string }[];
const seededPharmacies = require("../../../seed-data/pharmacies.json") as unknown[];

// A few recognizable, real institutions to name-drop instead of a generic
// "trusted by Kenyans" badge — pulled from the same seed data the app itself
// ships with, so the count and names stay accurate as that data grows.
const FEATURED_HOSPITALS = ["Kenyatta National Hospital", "Aga Khan University Hospital", "Nairobi Hospital"];
const featuredHospitalNames = FEATURED_HOSPITALS.filter((h) =>
  seededDoctors.some((d) => d.hospital === h),
);

const STRINGS = {
  appName1: "Afya",
  appName2: "Smart",
  taglineText: "Find out what your symptoms\nmean in ",
  taglineAccent: "60 seconds",
  trusted: `${seededDoctors.length}+ Doctors · ${seededPharmacies.length}+ Pharmacies`,
  secure: "Private & Secure",
  instant: "Instant Results",
  networkNote: featuredHospitalNames.length
    ? `Network includes ${featuredHospitalNames.join(", ")} & more nationwide`
    : "",
  ctaText: "Start Free Health Check",
  disclaimer: "Not a replacement for professional medical advice",
};

const FEATURES = [
  {
    icon: "pulse-outline",
    title: "Symptom Checker",
    desc: "Understand your health in 60 seconds",
    color: "#3B82F6",
  },
  {
    icon: "chatbubble-ellipses-outline",
    title: "AI Health Chat",
    desc: "24/7 personal companion for concerns",
    color: "#10B981",
  },
  {
    icon: "medical-outline",
    title: "Drug Information",
    desc: "Verify dosages, side effects & details",
    color: "#F59E0B",
  },
  {
    icon: "location-outline",
    title: "Local Services",
    desc: "Locate clinics and specialists near you",
    color: "#8B5CF6",
  },
];

export function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const cardAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        80,
        cardAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStart = async () => {
    router.push("/(onboarding)/health-check" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Decorative Aurora glow */}
      <View style={styles.bgContainer}>
        <View style={[styles.blob, { backgroundColor: "#0D9488", top: -120, right: -100, width: 340, height: 340, opacity: 0.08 }]} />
        <View style={[styles.blob, { backgroundColor: "#0D9488", top: -80, right: -60, width: 240, height: 240, opacity: 0.05 }]} />
        <View style={[styles.blob, { backgroundColor: "#2563EB", top: "35%", left: -140, width: 280, height: 280, opacity: 0.06 }]} />
        <View style={[styles.blob, { backgroundColor: "#2563EB", top: "38%", left: -90, width: 180, height: 180, opacity: 0.04 }]} />
        <View style={[styles.blob, { backgroundColor: "#10B981", bottom: -100, right: -80, width: 300, height: 300, opacity: 0.08 }]} />
        <View style={[styles.blob, { backgroundColor: "#10B981", bottom: -60, right: -40, width: 200, height: 200, opacity: 0.05 }]} />
      </View>

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoSection,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Animated.View
          style={[styles.logoOuter, { transform: [{ scale: pulseAnim }] }]}
        >
          <View style={styles.logoInner}>
            <View style={styles.crossV} />
            <View style={styles.crossH} />
          </View>
        </Animated.View>
        <View style={styles.pulseDot} />
      </Animated.View>

      {/* Hero text */}
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>
          {STRINGS.appName1}
          <Text style={{ color: "#10B981" }}>{STRINGS.appName2}</Text>
        </Text>
        <Text style={styles.tagline}>
          {STRINGS.taglineText}
          <Text style={styles.taglineAccent}>{STRINGS.taglineAccent}</Text>
        </Text>
      </Animated.View>

      {/* Feature Cards Grid */}
      <View style={styles.featuresGrid}>
        {FEATURES.map((f, i) => {
          const scale = cardAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0.85, 1],
          });
          const translateY = cardAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.featureCard,
                {
                  opacity: cardAnims[i],
                  transform: [{ scale }, { translateY }],
                },
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: f.color + "15" }]}>
                <Ionicons name={f.icon as any} size={16} color={f.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{f.title}</Text>
                <Text style={styles.cardDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Trust strip */}
      <Animated.View style={[styles.trustStrip, { opacity: fadeAnim }]}>
        <View style={styles.trustItem}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.trustText}>{STRINGS.trusted}</Text>
        </View>
        <View style={styles.trustDot} />
        <View style={styles.trustItem}>
          <Ionicons name="lock-closed" size={14} color="#10B981" />
          <Text style={styles.trustText}>{STRINGS.secure}</Text>
        </View>
        <View style={styles.trustDot} />
        <View style={styles.trustItem}>
          <Ionicons name="flash" size={14} color="#10B981" />
          <Text style={styles.trustText}>{STRINGS.instant}</Text>
        </View>
      </Animated.View>

      {!!STRINGS.networkNote && (
        <Animated.Text style={[styles.networkNote, { opacity: fadeAnim }]}>
          {STRINGS.networkNote}
        </Animated.Text>
      )}

      {/* CTA */}
      <Animated.View
        style={[
          styles.ctaSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnText}>{STRINGS.ctaText}</Text>
          <Ionicons name="arrow-forward" size={20} color="#061A1A" />
        </TouchableOpacity>
        <Text style={styles.ctaNote}>{STRINGS.disclaimer}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TEAL_DARK,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#061A1A",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  logoSection: { alignItems: "center", marginBottom: 20 },
  logoOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  logoInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  crossV: {
    position: "absolute",
    width: 6,
    height: 28,
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  crossH: {
    position: "absolute",
    width: 28,
    height: 6,
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  pulseDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2.5,
    borderColor: "#061A1A",
  },
  heroSection: { alignItems: "center", marginBottom: 28 },
  appName: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
    textShadowColor: "rgba(255, 255, 255, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  taglineAccent: { color: "#10B981", fontWeight: "800" },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
    width: "100%",
  },
  featureCard: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 12,
    minHeight: 116,
    justifyContent: "flex-start",
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  cardDesc: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  trustStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500" },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  networkNote: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  ctaSection: { width: "100%", alignItems: "center", gap: 10 },
  ctaBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#10B981",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaBtnText: { color: "#061A1A", fontSize: 16, fontWeight: "900" },
  ctaNote: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    textAlign: "center",
  },
});

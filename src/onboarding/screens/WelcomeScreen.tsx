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

import { PAPER, INK, INK_MUTED, INK_FAINT, ACCENT, RULE, RULE_STRONG } from "../theme";

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
  taglineText: "Find out what your symptoms mean in ",
  taglineAccent: "60 seconds",
  trusted: `${seededDoctors.length}+ doctors`,
  trustedSub: `${seededPharmacies.length}+ pharmacies`,
  secure: "Private and secure",
  networkNote: featuredHospitalNames.length
    ? `Network includes ${featuredHospitalNames.join(", ")} and more nationwide`
    : "",
  ctaText: "Start your check-in",
  disclaimer: "Not a replacement for professional medical advice",
};

const FEATURES = [
  {
    icon: "pulse-outline",
    title: "Symptom checker",
    desc: "Understand your health in 60 seconds",
  },
  {
    icon: "chatbubble-ellipses-outline",
    title: "Health chat",
    desc: "Talk through a concern any time of day",
  },
  {
    icon: "medical-outline",
    title: "Drug information",
    desc: "Verify dosages, side effects and details",
  },
  {
    icon: "location-outline",
    title: "Local services",
    desc: "Locate clinics and specialists near you",
  },
];

// A tick-mark rule — the one recurring motif used across onboarding as a
// divider and, elsewhere, as the analysis-loading trace. Kept as a static
// pattern here rather than an animated pulse.
function VitalsRule() {
  const heights = [4, 4, 14, 4, 20, 8, 4, 4, 16, 4, 4];
  return (
    <View style={styles.vitalsRule}>
      {heights.map((h, i) => (
        <View key={i} style={[styles.vitalsTick, { height: h }]} />
      ))}
    </View>
  );
}

export function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const listAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        60,
        listAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, []);

  const handleStart = async () => {
    router.push("/(onboarding)/health-check" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PAPER} />

      <Animated.View
        style={[
          styles.heroSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <VitalsRule />

        <Text style={styles.appName}>
          {STRINGS.appName1}
          <Text style={{ color: ACCENT }}>{STRINGS.appName2}</Text>
        </Text>
        <Text style={styles.tagline}>
          {STRINGS.taglineText}
          <Text style={styles.taglineAccent}>{STRINGS.taglineAccent}</Text>
        </Text>
      </Animated.View>

      <View style={styles.featureList}>
        {FEATURES.map((f, i) => (
          <Animated.View
            key={i}
            style={[
              styles.featureRow,
              {
                opacity: listAnims[i],
                transform: [
                  {
                    translateY: listAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.featureRule} />
            <Ionicons name={f.icon as any} size={18} color={INK} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.trustStrip, { opacity: fadeAnim }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color={INK_FAINT} />
        <Text style={styles.trustNumber}>{STRINGS.trusted}</Text>
        <Text style={styles.trustDivider}>·</Text>
        <Text style={styles.trustNumber}>{STRINGS.trustedSub}</Text>
        <Text style={styles.trustDivider}>·</Text>
        <Text style={styles.trustText}>{STRINGS.secure}</Text>
      </Animated.View>

      {!!STRINGS.networkNote && (
        <Animated.Text style={[styles.networkNote, { opacity: fadeAnim }]}>
          {STRINGS.networkNote}
        </Animated.Text>
      )}

      <Animated.View
        style={[
          styles.ctaSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnText}>{STRINGS.ctaText}</Text>
          <Ionicons name="arrow-forward" size={18} color={PAPER} />
        </TouchableOpacity>
        <Text style={styles.ctaNote}>{STRINGS.disclaimer}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAPER,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  vitalsRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 20,
    marginBottom: 24,
  },
  vitalsTick: {
    width: 2,
    backgroundColor: ACCENT,
    borderRadius: 1,
  },
  heroSection: { marginBottom: 32 },
  appName: {
    color: INK,
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  tagline: {
    color: INK_MUTED,
    fontSize: 16,
    lineHeight: 24,
  },
  taglineAccent: { color: INK, fontWeight: "600" },
  featureList: {
    marginBottom: 28,
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  featureRule: {
    width: 2,
    alignSelf: "stretch",
    backgroundColor: RULE_STRONG,
    marginRight: 12,
    borderRadius: 0,
  },
  featureIcon: {
    marginRight: 12,
    marginTop: 1,
  },
  featureContent: { flex: 1 },
  featureTitle: {
    color: INK,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDesc: {
    color: INK_MUTED,
    fontSize: 12,
    lineHeight: 17,
  },
  trustStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  trustNumber: {
    color: INK,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  trustText: { color: INK_FAINT, fontSize: 12 },
  trustDivider: { color: RULE_STRONG, fontSize: 12 },
  networkNote: {
    color: INK_FAINT,
    fontSize: 11,
    marginBottom: 24,
  },
  ctaSection: { width: "100%", gap: 10 },
  ctaBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: INK,
    borderRadius: 24,
    paddingVertical: 15,
  },
  ctaBtnText: { color: PAPER, fontSize: 15, fontWeight: "600" },
  ctaNote: {
    color: INK_FAINT,
    fontSize: 11,
    textAlign: "center",
  },
});
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StatusBar, StyleSheet, Text, View } from "react-native";

const INK = "#17104F";
const PURPLE = "#5B2FD6";
const LIME = "#C8F24A";
const BG = "#F7F7FB";

export default function AnalysisLoadingScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(0.85)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      router.replace("/(onboarding)/locked-results" as any);
    }, 3300);

    return () => clearTimeout(timer);
  }, [progress, pulse, router, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["10%", "84%"],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={17} color={LIME} />
        </View>
        <View>
          <Text style={styles.name}>AfyaSmart AI</Text>
          <Text style={styles.status}>Online</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Animated.View
          style={[
            styles.analysisOrb,
            { transform: [{ scale: pulse }, { rotate }] },
          ]}
        >
          <View style={styles.orbCore}>
            <Ionicons name="medical" size={40} color="#fff" />
          </View>
          <View style={[styles.dot, styles.dotOne]} />
          <View style={[styles.dot, styles.dotTwo]} />
          <View style={[styles.dot, styles.dotThree]} />
        </Animated.View>

        <Text style={styles.title}>I&apos;m analyzing your symptoms...</Text>
        <Text style={styles.sub}>This may take a few seconds</Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.caption}>Analyzing...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 58,
    paddingHorizontal: 22,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECF4",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: INK, fontSize: 14, fontWeight: "900" },
  status: { color: "#22C55E", fontSize: 11, fontWeight: "700", marginTop: 2 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  analysisOrb: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(91,47,214,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 44,
  },
  orbCore: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PURPLE,
  },
  dotOne: { top: 18, right: 28 },
  dotTwo: { left: 20, bottom: 34, opacity: 0.5 },
  dotThree: { right: 12, bottom: 44, opacity: 0.35 },
  title: {
    color: INK,
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  sub: { color: "#5E5A78", fontSize: 13, textAlign: "center", marginBottom: 28 },
  progressTrack: {
    width: "88%",
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E1E1EA",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: PURPLE,
  },
  caption: { color: "#5E5A78", fontSize: 12, marginTop: 12 },
});

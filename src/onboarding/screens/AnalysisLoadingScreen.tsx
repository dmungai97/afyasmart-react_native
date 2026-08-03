import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDiagnosisStore } from "@/src/store/diagnosisStore";
import { requestSymptomsAnalysis } from "@/src/services/symptoms.service";

const INK = "#17104F";
const PURPLE = "#5B2FD6";
const LIME = "#C8F24A";
const BG = "#F7F7FB";
const RED = "#DC2626";

export function AnalysisLoadingScreen() {
  const router = useRouter();
  const pendingAnalysisRequest = useDiagnosisStore((s) => s.pendingAnalysisRequest);
  const setPendingDiagnosis = useDiagnosisStore((s) => s.setPendingDiagnosis);
  const clearPendingAnalysisRequest = useDiagnosisStore((s) => s.clearPendingAnalysisRequest);

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const pulse = useRef(new Animated.Value(0.85)).current;
  const progress = useRef(new Animated.Value(0.08)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const crawlRef = useRef<Animated.CompositeAnimation | null>(null);

  const startMotion = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 700, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2200, useNativeDriver: true }),
    ).start();

    // Progress has no way to know real completion percentage, so it creeps
    // toward — but never reaches — "done" until the request actually resolves.
    progress.setValue(0.08);
    const crawl = Animated.sequence([
      Animated.timing(progress, { toValue: 0.35, duration: 500, useNativeDriver: false }),
      Animated.timing(progress, { toValue: 0.6, duration: 1200, useNativeDriver: false }),
      Animated.timing(progress, { toValue: 0.8, duration: 2200, useNativeDriver: false }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, { toValue: 0.86, duration: 900, useNativeDriver: false }),
          Animated.timing(progress, { toValue: 0.8, duration: 900, useNativeDriver: false }),
        ]),
      ),
    ]);
    crawlRef.current = crawl;
    crawl.start();
  }, [pulse, progress, spin]);

  const stopMotion = useCallback(() => {
    pulse.stopAnimation();
    spin.stopAnimation();
    crawlRef.current?.stop();
  }, [pulse, spin]);

  const runAnalysis = useCallback(async () => {
    if (!pendingAnalysisRequest) {
      router.replace("/(onboarding)/symptom-chat" as any);
      return;
    }

    setStatus("loading");
    startMotion();

    try {
      const data = await requestSymptomsAnalysis(pendingAnalysisRequest);

      const formattedDiagnosis = {
        symptoms: pendingAnalysisRequest.symptoms.join(", "),
        summary: data.urgency_desc,
        urgency: data.urgency,
        conditions: data.conditions.map((c) => ({
          name: c.name,
          probability: c.percent,
          level: c.likelihood,
          color: c.color,
        })),
        medications: data.medications.map((m) => ({
          name: m.name,
          note: m.desc,
        })),
        preparedAt: new Date().toISOString(),
      };

      setPendingDiagnosis(formattedDiagnosis);
      clearPendingAnalysisRequest();

      stopMotion();
      Animated.timing(progress, { toValue: 1, duration: 350, useNativeDriver: false }).start(() => {
        setTimeout(() => {
          router.replace("/(onboarding)/locked-results" as any);
        }, 350);
      });
    } catch (err: any) {
      stopMotion();
      setStatus("error");
      setErrorMessage(err?.message ?? "Something went wrong while analyzing your symptoms.");
    }
  }, [pendingAnalysisRequest, router, setPendingDiagnosis, clearPendingAnalysisRequest, startMotion, stopMotion, progress]);

  useEffect(() => {
    runAnalysis();
    return () => stopMotion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
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
        {status === "loading" ? (
          <>
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
          </>
        ) : (
          <>
            <View style={[styles.analysisOrb, styles.errorOrb]}>
              <View style={[styles.orbCore, styles.errorOrbCore]}>
                <Ionicons name="alert" size={40} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>We couldn&apos;t finish your analysis</Text>
            <Text style={styles.sub}>{errorMessage}</Text>

            <TouchableOpacity style={styles.retryBtn} onPress={runAnalysis} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backLink}>Go back</Text>
            </TouchableOpacity>
          </>
        )}
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
  errorOrb: { backgroundColor: "rgba(220,38,38,0.1)" },
  orbCore: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  errorOrbCore: { backgroundColor: RED },
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
  retryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
  },
  retryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  backLink: { color: "#5E5A78", fontSize: 13, fontWeight: "600", marginTop: 16 },
});

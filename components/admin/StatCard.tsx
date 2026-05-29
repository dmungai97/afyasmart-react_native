import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const BORDER = "#E2E8F0";
const TEXT_DARK = "#1E293B";
const TEXT_MUTED = "#64748B";
const TREND_GREEN = "#16A34A";

type IconName = keyof typeof Ionicons.glyphMap;

export interface MetricCardData {
  label: string;
  value: string;
  change?: string;
  sub?: string;
  icon: IconName;
  color: string;
}

interface StatCardProps {
  item: MetricCardData;
}

export default function StatCard({ item }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value}</Text>
        <Text style={[styles.subText, item.change ? styles.trend : null]}>
          {item.change ? `+${item.change}` : item.sub}
        </Text>
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={20} color="#475569" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  value: {
    color: TEXT_DARK,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  subText: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  trend: {
    color: TREND_GREEN,
    fontWeight: "600",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
});

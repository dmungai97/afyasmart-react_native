import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const BORDER = "#F1F5F9";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#64748B";
const TREND_GREEN = "#10B981";

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
      <View style={[styles.iconWrap, { backgroundColor: `${item.color}10` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  value: {
    color: TEXT_DARK,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subText: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
  trend: {
    color: TREND_GREEN,
    fontWeight: "700",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

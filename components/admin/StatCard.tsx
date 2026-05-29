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
    <View style={[styles.card, { borderLeftColor: item.color, shadowColor: item.color }]}>
      <View style={styles.content}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value}</Text>
        <Text style={[styles.subText, item.change ? styles.trend : null]}>
          {item.change ? `+${item.change}` : item.sub}
        </Text>
      </View>
      <View style={[styles.iconWrap, { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
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
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: {
    color: TEXT_DARK,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -0.8,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});

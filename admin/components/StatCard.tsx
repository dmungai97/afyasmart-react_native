import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

const BORDER = "#C7CFC2";
const TEXT_DARK = "#16302B";
const TEXT_MUTED = "#4B5C50";
const TREND_GREEN = "#3F7A5C";

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
  style?: any;
}

export default function StatCard({ item, style }: StatCardProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[styles.card, { borderLeftColor: item.color }, isMobile && styles.cardMobile, style]}>
      <View style={styles.content}>
        <Text style={[styles.label, isMobile && styles.labelMobile]}>{item.label}</Text>
        <Text style={[styles.value, isMobile && styles.valueMobile]}>{item.value}</Text>
        <Text style={[styles.subText, item.change ? styles.trend : null, isMobile && styles.subTextMobile]}>
          {item.change ? `+${item.change}` : item.sub}
        </Text>
      </View>
      <View style={[styles.iconWrap, isMobile && styles.iconWrapMobile]}>
        <Ionicons name={item.icon} size={isMobile ? 16 : 20} color={item.color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: "#FBFCF9",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
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
    backgroundColor: "#EEF1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  cardMobile: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 0,
    padding: 12,
  },
  labelMobile: {
    fontSize: 10,
  },
  valueMobile: {
    fontSize: 17,
    marginTop: 2,
     },
  subTextMobile: {
    fontSize: 9,
    marginTop: 2,
  },
  iconWrapMobile: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

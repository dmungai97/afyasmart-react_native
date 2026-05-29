import { StyleSheet, Text, View } from "react-native";

const GREEN = "#10B981";
const BLUE = "#3B82F6";
const BORDER = "#F1F5F9";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#64748B";

interface IncomeOverviewProps {
  totalRevenue: number;
  subscriptions: number;
  totalUsers: number;
  drugs: number;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-KE").format(value);

const formatMoney = (value: number) => `Ksh ${formatNumber(value)}`;

const STRINGS = {
  incomeOverview: "Income Overview",
  thisWeek: "This Week",
  totalRevenue: "Total Revenue",
  subscribers: "Subscribers",
  totalUsers: "Total Users",
  drugRecords: "Drug Records",
};

export default function IncomeOverview({
  totalRevenue,
  subscriptions,
  totalUsers,
  drugs,
}: IncomeOverviewProps) {
  return (
    <View style={[styles.panel, styles.incomePanel]}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{STRINGS.incomeOverview}</Text>
        <Text style={styles.linkText}>{STRINGS.thisWeek}</Text>
      </View>
      <View style={styles.chart}>
        {[28, 72, 58, 64, 124, 76, 104].map((height, index) => (
          <View key={index} style={styles.barGroup}>
            <View style={[styles.bar, { height, backgroundColor: GREEN }]} />
            <View
              style={[
                styles.bar,
                { height: Math.max(18, height * 0.58), backgroundColor: BLUE },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.chartFooter}>
        <View style={styles.metricBlock}>
          <Text style={styles.footerValue}>{formatMoney(totalRevenue)}</Text>
          <Text style={styles.footerLabel}>{STRINGS.totalRevenue}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.footerValue}>{formatNumber(subscriptions)}</Text>
          <Text style={styles.footerLabel}>{STRINGS.subscribers}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.footerValue}>{formatNumber(totalUsers)}</Text>
          <Text style={styles.footerLabel}>{STRINGS.totalUsers}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.footerValue}>{formatNumber(drugs)}</Text>
          <Text style={styles.footerLabel}>{STRINGS.drugRecords}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 320,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  incomePanel: { flexBasis: 520, flexGrow: 2 },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  linkText: { color: BLUE, fontSize: 12, fontWeight: "700" },
  chart: {
    height: 166,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingBottom: 4,
  },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  bar: { width: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 20,
  },
  metricBlock: {
    flex: 1,
    minWidth: 110,
  },
  footerValue: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: "800",
  },
  footerLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});

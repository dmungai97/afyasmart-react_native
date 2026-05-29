import { StyleSheet, Text, View } from "react-native";

const GREEN = "#10B981";
const BLUE = "#3B82F6";
const PURPLE = "#8B5CF6";
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function IncomeOverview({
  totalRevenue,
  subscriptions,
  totalUsers,
  drugs,
}: IncomeOverviewProps) {
  return (
    <View style={[styles.panel, styles.incomePanel]}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>{STRINGS.incomeOverview}</Text>
          <Text style={styles.panelSub}>Weekly performance details</Text>
        </View>
        <Text style={styles.linkText}>{STRINGS.thisWeek}</Text>
      </View>
      <View style={styles.chart}>
        {[28, 72, 58, 64, 110, 76, 94].map((height, index) => (
          <View key={index} style={styles.chartColumn}>
            <View style={styles.barTrack}>
              <View style={styles.barGroup}>
                <View style={[styles.bar, { height, backgroundColor: GREEN }]} />
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(12, height * 0.58), backgroundColor: BLUE },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.dayLabel}>{DAYS[index]}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartFooter}>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
            <Text style={styles.footerLabel}>{STRINGS.totalRevenue}</Text>
          </View>
          <Text style={styles.footerValue}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: BLUE }]} />
            <Text style={styles.footerLabel}>{STRINGS.subscribers}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(subscriptions)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: PURPLE }]} />
            <Text style={styles.footerLabel}>{STRINGS.totalUsers}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(totalUsers)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
            <Text style={styles.footerLabel}>{STRINGS.drugRecords}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(drugs)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 320,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  incomePanel: { flexBasis: 520, flexGrow: 2 },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  panelSub: { color: TEXT_MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },
  linkText: { color: BLUE, fontSize: 12, fontWeight: "700" },
  chart: {
    height: 180,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 8,
  },
  chartColumn: {
    alignItems: "center",
  },
  barTrack: {
    height: 130,
    width: 28,
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  bar: { width: 7, borderRadius: 3 },
  dayLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginTop: 6,
    fontWeight: "700",
  },
  chartFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
  },
  metricBlock: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#FAFBFD",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metricTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerValue: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: "900",
  },
  footerLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: "700",
  },
});

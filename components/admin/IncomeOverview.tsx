import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SLATE_DARK = "#1E293B";
const SLATE_MID = "#475569";
const SLATE_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";
const ACCENT_BLUE = "#3B82F6";

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
  const [activeTab, setActiveTab] = useState<"earnings" | "reports">("reports");

  return (
    <View style={[styles.panel, styles.incomePanel]}>
      {/* iOS Style Segmented Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "earnings" && styles.tabActive]}
          onPress={() => setActiveTab("earnings")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "earnings" && styles.tabTextActive]}>My earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reports" && styles.tabActive]}
          onPress={() => setActiveTab("reports")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "reports" && styles.tabTextActive]}>My reports</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.periodText}>Your report during this period</Text>

      {/* Chart container with absolute dotted background gridlines */}
      <View style={styles.chartContainer}>
        <View style={styles.gridLinesContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.chart}>
          {[28, 72, 58, 64, 110, 76, 94].map((height, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barTrack}>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, { height, backgroundColor: SLATE_DARK }]} />
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max(12, height * 0.58), backgroundColor: SLATE_LIGHT },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.dayLabel}>{DAYS[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartFooter}>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: SLATE_DARK }]} />
            <Text style={styles.footerLabel}>{STRINGS.totalRevenue}</Text>
          </View>
          <Text style={styles.footerValue}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: SLATE_MID }]} />
            <Text style={styles.footerLabel}>{STRINGS.subscribers}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(subscriptions)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: SLATE_LIGHT }]} />
            <Text style={styles.footerLabel}>{STRINGS.totalUsers}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(totalUsers)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: "#CBD5E1" }]} />
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
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  incomePanel: { flexBasis: 520, flexGrow: 2 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: SLATE_DARK,
  },
  tabText: {
    color: SLATE_LIGHT,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: SLATE_DARK,
    fontWeight: "700",
  },
  periodText: {
    color: SLATE_MID,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    position: "relative",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  gridLinesContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: "space-between",
    zIndex: 1,
  },
  gridLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    borderStyle: "dashed",
    width: "100%",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    zIndex: 2,
  },
  chartColumn: {
    alignItems: "center",
  },
  barTrack: {
    height: 130,
    width: 24,
    backgroundColor: "transparent",
    borderRadius: 4,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 6, borderRadius: 2 },
  dayLabel: {
    color: SLATE_LIGHT,
    fontSize: 10,
    marginTop: 6,
    fontWeight: "600",
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
    padding: 12,
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
    color: SLATE_DARK,
    fontSize: 14,
    fontWeight: "700",
  },
  footerLabel: {
    color: SLATE_MID,
    fontSize: 10,
    fontWeight: "600",
  },
});

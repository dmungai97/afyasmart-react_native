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
  weeklyRevenue?: number[];
  weeklySubscribers?: number[];
  isMobile?: boolean;
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
  weeklyRevenue = [0, 0, 0, 0, 0, 0, 0],
  weeklySubscribers = [0, 0, 0, 0, 0, 0, 0],
  isMobile = false,
}: IncomeOverviewProps) {
  const [activeTab, setActiveTab] = useState<"earnings" | "reports">("reports");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Find max values to scale the bar heights dynamically
  const maxRevenue = Math.max(...weeklyRevenue, 0);
  const maxSubscribers = Math.max(...weeklySubscribers, 0);

  const getBarHeights = (index: number) => {
    const rev = weeklyRevenue[index] ?? 0;
    const sub = weeklySubscribers[index] ?? 0;

    // Max height in chart track is 110px
    const revHeight = maxRevenue > 0 ? (rev / maxRevenue) * 110 : 0;
    const subHeight = maxSubscribers > 0 ? (sub / maxSubscribers) * 110 : 0;

    // Return a minimum height of 4px for zero values to make it look clean
    return {
      revHeight: Math.max(revHeight, rev > 0 ? 12 : 4),
      subHeight: Math.max(subHeight, sub > 0 ? 12 : 4),
    };
  };

  const periodText = selectedDayIndex !== null
    ? `${DAYS[selectedDayIndex]}: ${formatMoney(weeklyRevenue[selectedDayIndex] ?? 0)} • ${formatNumber(weeklySubscribers[selectedDayIndex] ?? 0)} Subscribers`
    : isMobile
      ? "Tap bars for details"
      : "Your report during this period (tap bars for details)";

  return (
    <View style={[styles.panel, styles.incomePanel, isMobile && styles.mobilePanel]}>
      {/* iOS Style Segmented Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "earnings" && styles.tabActive]}
          onPress={() => setActiveTab("earnings")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, isMobile && styles.mobileTabText, activeTab === "earnings" && styles.tabTextActive]}>My earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reports" && styles.tabActive]}
          onPress={() => setActiveTab("reports")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, isMobile && styles.mobileTabText, activeTab === "reports" && styles.tabTextActive]}>My reports</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.periodText, isMobile && styles.mobilePeriodText]} numberOfLines={2}>{periodText}</Text>

      {/* Chart container with absolute dotted background gridlines */}
      <View style={styles.chartContainer}>
        <View style={styles.gridLinesContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        <View style={styles.chart}>
          {DAYS.map((day, index) => {
            const { revHeight, subHeight } = getBarHeights(index);
            const isSelected = selectedDayIndex === index;
            return (
              <TouchableOpacity
                key={day}
                style={styles.chartColumn}
                activeOpacity={0.8}
                onPress={() => setSelectedDayIndex(isSelected ? null : index)}
              >
                <View style={[styles.barTrack, isSelected && styles.barTrackSelected, isMobile && styles.mobileBarTrack]}>
                  <View style={[styles.barGroup, isMobile && styles.mobileBarGroup]}>
                    <View style={[styles.bar, isMobile && styles.mobileBar, { height: revHeight, backgroundColor: isSelected ? "#2563EB" : ACCENT_BLUE }]} />
                    <View style={[styles.bar, isMobile && styles.mobileBar, { height: subHeight, backgroundColor: isSelected ? "#059669" : "#10B981" }]} />
                  </View>
                </View>
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.chartFooter, isMobile && { gap: 8 }]}>
        <View style={[styles.metricBlock, isMobile && styles.mobileMetricBlock]}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: ACCENT_BLUE }]} />
            <Text style={styles.footerLabel}>{STRINGS.totalRevenue}</Text>
          </View>
          <Text style={styles.footerValue}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={[styles.metricBlock, isMobile && styles.mobileMetricBlock]}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.footerLabel}>{STRINGS.subscribers}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(subscriptions)}</Text>
        </View>
        <View style={[styles.metricBlock, isMobile && styles.mobileMetricBlock]}>
          <View style={styles.metricTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: SLATE_LIGHT }]} />
            <Text style={styles.footerLabel}>{STRINGS.totalUsers}</Text>
          </View>
          <Text style={styles.footerValue}>{formatNumber(totalUsers)}</Text>
        </View>
        <View style={[styles.metricBlock, isMobile && styles.mobileMetricBlock]}>
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
    width: 28,
    backgroundColor: "transparent",
    borderRadius: 6,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: 2,
  },
  barTrackSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  barGroup: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  bar: { width: 6, borderRadius: 3 },
  dayLabel: {
    color: SLATE_LIGHT,
    fontSize: 10,
    marginTop: 6,
    fontWeight: "600",
  },
  dayLabelSelected: {
    color: "#1E293B",
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
  mobilePanel: {
    flexBasis: "100%",
    flexGrow: 0,
    width: "100%",
    padding: 12,
  },
  mobileMetricBlock: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 0,
    padding: 8,
  },
  mobileBarTrack: {
    width: 22,
  },
  mobileBarGroup: {
    gap: 1.5,
  },
  mobileBar: {
    width: 5,
  },
  mobileTabText: {
    fontSize: 12,
  },
  mobilePeriodText: {
    fontSize: 11,
    marginBottom: 10,
  },
});

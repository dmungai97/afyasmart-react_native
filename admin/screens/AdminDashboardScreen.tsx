import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Sidebar from "../components/Sidebar";
import StatCard, { MetricCardData } from "../components/StatCard";
import IncomeOverview from "../components/IncomeOverview";
import FacilitiesOverview from "../components/FacilitiesOverview";
import QuickActions from "../components/QuickActions";
import RecentTables from "../components/RecentTables";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { useAuthStore } from "@/src/store/authStore";

const SLATE_DARK = "#1E293B";
const BLUE = "#3B82F6";
const GREEN = "#10B981";
const PURPLE = "#8B5CF6";
const ORANGE = "#F59E0B";
const RED = "#EF4444";
const CYAN = "#06B6D4";
const BORDER = "#F1F5F9";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-KE").format(value);

const formatMoney = (value: number) => `Ksh ${formatNumber(value)}`;

const STRINGS = {
  admin: "Admin",
  dashboard: "Dashboard",
  overview: "Operational overview for facilities, payouts, and platform activity.",
  syncing: "Syncing",
  liveUpdates: "Live Updates",
  platformSummary: "Platform Summary",
  summarySub: "Your platform is growing. Keep up the great work.",
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { dashboard, loading, error } = useAdminDashboard();

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/(auth)/login" as any);
  };

  const metrics: MetricCardData[] = [
    {
      label: "Total Revenue",
      value: formatMoney(dashboard?.metrics.totalRevenue ?? 0),
      sub: "Paid M-Pesa requests",
      icon: "wallet",
      color: GREEN,
    },
    {
      label: "Active Users",
      value: formatNumber(dashboard?.metrics.activeUsers ?? 0),
      sub: `Daily: ${dashboard?.metrics.planCounts?.daily ?? 0} | Wkly: ${dashboard?.metrics.planCounts?.weekly ?? 0} | Mthly: ${dashboard?.metrics.planCounts?.monthly ?? 0}`,
      icon: "people",
      color: BLUE,
    },
    {
      label: "Conversion Rate",
      value: `${dashboard?.metrics.conversionRate ?? 0}%`,
      sub: "Subscribed of total users",
      icon: "trending-up",
      color: PURPLE,
    },
    {
      label: "Pending Payments",
      value: formatMoney(dashboard?.metrics.pendingPayoutsValue ?? 0),
      sub: `${dashboard?.metrics.pendingPayouts ?? 0} requests pending`,
      icon: "time",
      color: ORANGE,
    },
    {
      label: "Platform Network",
      value: formatNumber(dashboard?.metrics.totalFacilities ?? 0),
      sub: `${dashboard?.metrics.doctors ?? 0} doctors | ${dashboard?.metrics.pharmacies ?? 0} pharmacies`,
      icon: "business",
      color: CYAN,
    },
  ];

  return (
    <View style={styles.root}>
      {/* Responsive Sidebar Menu */}
      <Sidebar
        userName={user?.name ?? STRINGS.admin}
        onSignOut={handleSignOut}
        isMobile={isMobile}
        visible={isMobile ? menuOpen : true}
        onClose={() => setMenuOpen(false)}
      />

      {/* Main Content Area */}
      <ScrollView
        style={styles.main}
        contentContainerStyle={[
          styles.content,
          isMobile && {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingHorizontal: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 20,
            gap: 14,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Block */}
        <View style={[styles.topbar, isMobile && styles.topbarMobile]}>
          <View style={styles.titleRow}>
            {isMobile && (
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => setMenuOpen(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="menu-outline" size={24} color="#0B0F19" />
              </TouchableOpacity>
            )}
            {!isMobile && (
              <View style={styles.iconContainer}>
                <Ionicons name="apps" size={20} color="#3B82F6" />
              </View>
            )}
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerTitleRow}>
                <Text style={[styles.title, isMobile && styles.titleMobile]} numberOfLines={1}>{STRINGS.dashboard}</Text>
                <View style={styles.liveContainer}>
                  <View style={styles.liveDotOuter}>
                    <View style={styles.liveDotInner} />
                  </View>
                  <Text style={styles.liveText}>Live Sync</Text>
                </View>
              </View>
              {!isMobile && (
                <Text style={styles.subtitle}>
                  {STRINGS.overview}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.topActions, isMobile && styles.topActionsMobile]}>
            {loading ? (
              <View style={[styles.loadingPill, isMobile && { paddingHorizontal: 10 }]}>
                <ActivityIndicator size="small" color={BLUE} />
                {!isMobile && <Text style={styles.loadingText}>{STRINGS.syncing}</Text>}
              </View>
            ) : null}
            <TouchableOpacity style={[styles.datePill, isMobile && { paddingHorizontal: 10 }]} activeOpacity={0.8}>
              {!isMobile && <Text style={styles.dateText}>{STRINGS.liveUpdates}</Text>}
              <Ionicons name="flash" size={14} color="#F59E0B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bell} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={18} color="#0B0F19" />
              <View style={styles.dot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Notification banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={RED} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Cards Row */}
        <View style={[styles.metricsGrid, isMobile && styles.metricsGridMobile]}>
          {metrics.map((item, index) => {
            const isFullWidthMobile = isMobile && index === metrics.length - 1;
            return (
              <StatCard
                key={item.label}
                item={item}
                style={isFullWidthMobile ? { flexBasis: "100%", width: "100%" } : null}
              />
            );
          })}
        </View>

        {/* Overviews Row */}
        <View style={[styles.overviewGrid, isMobile && styles.overviewGridMobile]}>
          <IncomeOverview
            totalRevenue={dashboard?.metrics.totalRevenue ?? 0}
            subscriptions={dashboard?.metrics.subscriptions ?? 0}
            totalUsers={dashboard?.metrics.totalUsers ?? 0}
            drugs={dashboard?.metrics.drugs ?? 0}
            weeklyRevenue={dashboard?.weeklyRevenue}
            weeklySubscribers={dashboard?.weeklySubscribers}
            isMobile={isMobile}
          />
          <FacilitiesOverview
            totalFacilities={dashboard?.metrics.totalFacilities ?? 0}
            pharmacies={dashboard?.metrics.pharmacies ?? 0}
            doctors={dashboard?.metrics.doctors ?? 0}
            totalUsers={dashboard?.metrics.totalUsers ?? 0}
            drugs={dashboard?.metrics.drugs ?? 0}
            subscriptions={dashboard?.metrics.subscriptions ?? 0}
            isMobile={isMobile}
          />
        </View>

        {/* Workflows block */}
        <QuickActions />

        {/* Dynamic Activity Log Tables */}
        <RecentTables
          recentUsers={dashboard?.recentUsers ?? []}
          transactions={dashboard?.recentTransactions ?? []}
          totalUsers={dashboard?.metrics.totalUsers ?? 0}
          doctors={dashboard?.metrics.doctors ?? 0}
          pharmacies={dashboard?.metrics.pharmacies ?? 0}
          drugs={dashboard?.metrics.drugs ?? 0}
          activeUsers={dashboard?.metrics.activeUsers ?? 0}
          loading={loading}
          isMobile={isMobile}
        />

        {/* Platform summary block */}
        <View style={[styles.summary, isMobile && styles.summaryMobile]}>
          <View style={[styles.summaryIntro, isMobile && styles.summaryIntroMobile]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="stats-chart" size={20} color={SLATE_DARK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>{STRINGS.platformSummary}</Text>
              <Text style={styles.summarySub} numberOfLines={2}>
                {STRINGS.summarySub}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryMetricGrid, isMobile && styles.summaryMetricGridMobile]}>
            {[
              ["Total Users", formatNumber(dashboard?.metrics.totalUsers ?? 0)],
              ["Active Users", formatNumber(dashboard?.metrics.activeUsers ?? 0)],
              ["Subscriptions", formatNumber(dashboard?.metrics.subscriptions ?? 0)],
              ["Revenue", formatMoney(dashboard?.metrics.totalRevenue ?? 0)],
            ].map(([label, value]) => (
              <View key={label} style={[styles.summaryMetric, isMobile && styles.summaryMetricMobile]}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  main: { flex: 1 },
  content: { padding: 24, gap: 24 },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  topbarMobile: {
    alignItems: "flex-start",
    gap: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -4,
  },
  headerTitleWrap: {
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    flexWrap: "wrap",
  },
  title: { color: "#1E293B", fontSize: 24, fontWeight: "700" },
  titleMobile: { fontSize: 21 },
  liveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  liveDotOuter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(22, 163, 74, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16A34A",
  },
  liveText: { color: "#16A34A", fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  subtitle: { color: "#64748B", fontSize: 13, marginTop: 4, fontWeight: "500" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  topActionsMobile: { gap: 8 },
  loadingPill: {
    height: 38,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  datePill: {
    height: 38,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: { color: "#1E293B", fontSize: 12, fontWeight: "600" },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  dot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, width: "100%" },
  metricsGridMobile: { gap: 8 },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { color: "#991B1B", fontSize: 12, fontWeight: "600", flex: 1 },
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, width: "100%" },
  overviewGridMobile: { gap: 12 },
  summary: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 24,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexGrow: 1,
    flexBasis: 300,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { color: "#1E293B", fontSize: 16, fontWeight: "700" },
  summarySub: { color: "#64748B", fontSize: 11, marginTop: 4, fontWeight: "500" },
  summaryMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    flexGrow: 2,
    flexBasis: 400,
  },
  summaryMetric: {
    flex: 1,
    minWidth: 110,
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
    paddingLeft: 16,
    paddingVertical: 4,
  },
  summaryLabel: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  summaryValue: { color: "#1E293B", fontSize: 20, fontWeight: "700", marginTop: 4, letterSpacing: -0.5 },
  summaryMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: 14,
    gap: 16,
  },
  summaryIntroMobile: {
    flexBasis: "auto",
  },
  summaryMetricGridMobile: {
    flexBasis: "auto",
    gap: 8,
  },
  summaryMetricMobile: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
    flexBasis: "48%",
    flexGrow: 1,
    borderLeftWidth: 0,
    minWidth: 0,
    paddingLeft: 10,
  },
});

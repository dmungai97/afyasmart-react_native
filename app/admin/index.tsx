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
import Sidebar from "../../components/admin/Sidebar";
import StatCard, { MetricCardData } from "../../components/admin/StatCard";
import IncomeOverview from "../../components/admin/IncomeOverview";
import FacilitiesOverview from "../../components/admin/FacilitiesOverview";
import QuickActions from "../../components/admin/QuickActions";
import RecentTables from "../../components/admin/RecentTables";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import { useAuthStore } from "../../src/store/authStore";

const NAVY = "#111827";
const SLATE_DARK = "#1E293B";
const BLUE = "#3B82F6";
const GREEN = "#10B981";
const PURPLE = "#8B5CF6";
const ORANGE = "#F59E0B";
const RED = "#EF4444";
const CYAN = "#06B6D4";
const BORDER = "#F1F5F9";
const MUTED = "#64748B";

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

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
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
      sub: "Currently subscribed",
      icon: "people",
      color: BLUE,
    },
    {
      label: "Doctors",
      value: formatNumber(dashboard?.metrics.doctors ?? 0),
      sub: "Listed specialists",
      icon: "medkit",
      color: PURPLE,
    },
    {
      label: "Pharmacies",
      value: formatNumber(dashboard?.metrics.pharmacies ?? 0),
      sub: "Listed providers",
      icon: "business",
      color: CYAN,
    },
    {
      label: "Pending Payments",
      value: formatNumber(dashboard?.metrics.pendingPayouts ?? 0),
      sub: "Payment requests",
      icon: "time",
      color: ORANGE,
    },
  ];

  return (
    <View style={styles.root}>
      {/* Responsive Sidebar Menu */}
      {isMobile ? (
        menuOpen && (
          <>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setMenuOpen(false)}
            />
            <Sidebar
              userName={user?.name ?? STRINGS.admin}
              onSignOut={handleSignOut}
              isMobile={true}
              onClose={() => setMenuOpen(false)}
            />
          </>
        )
      ) : (
        <Sidebar userName={user?.name ?? STRINGS.admin} onSignOut={handleSignOut} />
      )}

      {/* Main Content Area */}
      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        {/* Top Header Block */}
        <View style={styles.topbar}>
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
            <View style={styles.iconContainer}>
              <Ionicons name="apps" size={20} color="#3B82F6" />
            </View>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.title}>{STRINGS.dashboard}</Text>
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
          <View style={styles.topActions}>
            {loading ? (
              <View style={styles.loadingPill}>
                <ActivityIndicator size="small" color={BLUE} />
                <Text style={styles.loadingText}>{STRINGS.syncing}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.datePill} activeOpacity={0.8}>
              <Text style={styles.dateText}>{STRINGS.liveUpdates}</Text>
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
        <View style={styles.metricsGrid}>
          {metrics.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </View>

        {/* Overviews Row */}
        <View style={styles.overviewGrid}>
          <IncomeOverview
            totalRevenue={dashboard?.metrics.totalRevenue ?? 0}
            subscriptions={dashboard?.metrics.subscriptions ?? 0}
            totalUsers={dashboard?.metrics.totalUsers ?? 0}
            drugs={dashboard?.metrics.drugs ?? 0}
          />
          <FacilitiesOverview
            totalFacilities={dashboard?.metrics.totalFacilities ?? 0}
            pharmacies={dashboard?.metrics.pharmacies ?? 0}
            doctors={dashboard?.metrics.doctors ?? 0}
            totalUsers={dashboard?.metrics.totalUsers ?? 0}
            drugs={dashboard?.metrics.drugs ?? 0}
            subscriptions={dashboard?.metrics.subscriptions ?? 0}
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
        />

        {/* Platform summary block */}
        <View style={styles.summary}>
          <View style={styles.summaryIntro}>
            <View style={styles.summaryIcon}>
              <Ionicons name="stats-chart" size={20} color={SLATE_DARK} />
            </View>
            <View>
              <Text style={styles.summaryTitle}>{STRINGS.platformSummary}</Text>
              <Text style={styles.summarySub}>
                {STRINGS.summarySub}
              </Text>
            </View>
          </View>
          <View style={styles.summaryMetricGrid}>
            {[
              ["Total Users", formatNumber(dashboard?.metrics.totalUsers ?? 0)],
              ["Active Users", formatNumber(dashboard?.metrics.activeUsers ?? 0)],
              ["Subscriptions", formatNumber(dashboard?.metrics.subscriptions ?? 0)],
              ["Revenue", formatMoney(dashboard?.metrics.totalRevenue ?? 0)],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryMetric}>
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
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(11, 15, 25, 0.4)",
    zIndex: 998,
  },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
    padding: 6,
    marginRight: -4,
  },
  headerTitleWrap: {
    flexDirection: "column",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { color: "#1E293B", fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
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
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
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
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
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
});

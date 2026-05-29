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
                <Ionicons name="menu-outline" size={24} color="#34315A" />
              </TouchableOpacity>
            )}
            <Ionicons name="apps-outline" size={isMobile ? 22 : 28} color="#34315A" />
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>{STRINGS.dashboard}</Text>
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
              <Ionicons name="flash-outline" size={16} color="#34315A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bell} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={20} color="#34315A" />
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
              <Ionicons name="people" size={24} color={NAVY} />
            </View>
            <View>
              <Text style={styles.summaryTitle}>{STRINGS.platformSummary}</Text>
              <Text style={styles.summarySub}>
                {STRINGS.summarySub}
              </Text>
            </View>
          </View>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  main: { flex: 1 },
  content: { padding: 24, gap: 20 },
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
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: {
    padding: 6,
    marginRight: -4,
  },
  headerTitleWrap: {
    flexDirection: "column",
  },
  title: { color: "#0F172A", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 4, fontWeight: "500" },
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
  loadingText: { color: MUTED, fontSize: 11, fontWeight: "700" },
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
  dateText: { color: "#0F172A", fontSize: 12, fontWeight: "700" },
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
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
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
  errorText: { color: "#991B1B", fontSize: 12, fontWeight: "700", flex: 1 },
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  summary: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 24,
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
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  summarySub: { color: "#CBD5E1", fontSize: 11, marginTop: 4, fontWeight: "500" },
  summaryMetric: { minWidth: 120 },
  summaryLabel: { color: "#94A3B8", fontSize: 11, fontWeight: "700" },
  summaryValue: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 4, letterSpacing: -0.5 },
});

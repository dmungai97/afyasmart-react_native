import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { AdminRecentUser, AdminTransaction } from "../../src/services/admin.service";

const BLUE = "#3B82F6";
const GREEN = "#10B981";
const PURPLE = "#8B5CF6";
const BORDER = "#F1F5F9";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#64748B";

interface RecentTablesProps {
  recentUsers: AdminRecentUser[];
  transactions: AdminTransaction[];
  totalUsers: number;
  doctors: number;
  pharmacies: number;
  drugs: number;
  activeUsers: number;
  loading: boolean;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-KE").format(value);

const formatMoney = (value: number) => `Ksh ${formatNumber(value)}`;

const getAvatarColor = (name: string) => {
  const colors = [
    { bg: "#EFF6FF", text: "#3B82F6" }, // Blue
    { bg: "#ECFDF5", text: "#10B981" }, // Green
    { bg: "#F5F3FF", text: "#8B5CF6" }, // Purple
    { bg: "#FFFBEB", text: "#F59E0B" }, // Orange
    { bg: "#FEF2F2", text: "#EF4444" }, // Red
    { bg: "#ECFEFF", text: "#06B6D4" }, // Cyan
  ];
  const charSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(charSum) % colors.length;
  return colors[index];
};

export default function RecentTables({
  recentUsers,
  transactions,
  totalUsers,
  doctors,
  pharmacies,
  drugs,
  activeUsers,
  loading,
}: RecentTablesProps) {
  return (
    <View style={styles.tablesGrid}>
      {/* Recent Users Table */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent Users</Text>
            <Text style={styles.panelSub}>Latest signups on platform</Text>
          </View>
          <Text style={styles.linkText}>{formatNumber(totalUsers)} total</Text>
        </View>
        <View style={styles.rowsContainer}>
          {(recentUsers.length > 0 ? recentUsers : []).map((item, index) => {
            const colors = getAvatarColor(item.name);
            return (
              <View key={item.id} style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
                <View style={[styles.rowAvatar, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>
                    {(item.name[0] ?? "U").toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.email || "No email saved"}</Text>
                </View>
                <View style={item.subscribed ? styles.badgeActive : styles.badgeFree}>
                  <Text
                    style={item.subscribed ? styles.badgeTextActive : styles.badgeTextFree}
                  >
                    {item.subscribed ? "Active" : "Free"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        {!loading && recentUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users found yet.</Text>
        ) : null}
      </View>

      {/* Recent Transactions Table */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent Payments</Text>
            <Text style={styles.panelSub}>M-Pesa request history</Text>
          </View>
          <Text style={styles.linkText}>View All</Text>
        </View>
        <View style={styles.rowsContainer}>
          {transactions.map((item, index) => (
            <View key={item.id} style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
              <View style={[styles.rowIconWrap, { backgroundColor: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)" }]}>
                <Ionicons name="receipt" size={16} color={GREEN} />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.type}</Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
                <Text style={styles.rowSub}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
        {!loading && transactions.length === 0 ? (
          <Text style={styles.emptyText}>
            No paid payment requests found yet.
          </Text>
        ) : null}
      </View>

      {/* Top Performing Facilities Table */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Platform Summary</Text>
            <Text style={styles.panelSub}>Consolidated network count</Text>
          </View>
          <Text style={styles.linkText}>Overview</Text>
        </View>
        <View style={styles.rowsContainer}>
          {[
            ["Doctors", formatNumber(doctors), "Care network"],
            ["Pharmacies", formatNumber(pharmacies), "Medicine access"],
            ["Drug Records", formatNumber(drugs), "Reference data"],
            ["Active Users", formatNumber(activeUsers), "Subscribers"],
            ["Total Users", formatNumber(totalUsers), "Accounts"],
          ].map(([name, count, label], index) => {
            const isGold = index === 0;
            const isSilver = index === 1;
            const isBronze = index === 2;
            const badgeBg = isGold ? "#FEF3C7" : isSilver ? "#E2E8F0" : isBronze ? "#FFEDD5" : "#F1F5F9";
            const badgeTextColor = isGold ? "#D97706" : isSilver ? "#475569" : isBronze ? "#D97706" : "#475569";
            return (
              <View key={name} style={[styles.rankRow, index % 2 === 1 && styles.rowAlt]}>
                <View style={[styles.rankBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.rankText, { color: badgeTextColor }]}>{index + 1}</Text>
                </View>
                <View style={styles.rankNameCol}>
                  <Text style={styles.rankName}>{name}</Text>
                  <Text style={styles.rowSub}>{label}</Text>
                </View>
                <View style={styles.rankCountBadge}>
                  <Text style={styles.amount}>{count}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 292,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  panelSub: { color: TEXT_MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },
  linkText: { color: BLUE, fontSize: 12, fontWeight: "700" },
  rowsContainer: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rowAlt: {
    backgroundColor: "#FAFBFD",
    borderColor: "#F1F5F9",
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    fontSize: 14,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowMain: { flex: 1, minWidth: 100 },
  rowTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: "700" },
  rowSub: { color: TEXT_MUTED, fontSize: 11, marginTop: 2, fontWeight: "500" },
  badgeActive: {
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeTextActive: { color: GREEN, fontSize: 10, fontWeight: "800" },
  badgeFree: {
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeTextFree: { color: TEXT_MUTED, fontSize: 10, fontWeight: "800" },
  amountCol: { alignItems: "flex-end" },
  amount: { color: TEXT_DARK, fontSize: 13, fontWeight: "800" },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 16,
    textAlign: "center",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontWeight: "800",
    fontSize: 12,
  },
  rankNameCol: { flex: 1 },
  rankName: { color: TEXT_DARK, fontSize: 13, fontWeight: "700" },
  rankCountBadge: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});

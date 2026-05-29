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
          <Text style={styles.panelTitle}>Recent Users</Text>
          <Text style={styles.linkText}>{formatNumber(totalUsers)} total</Text>
        </View>
        <View style={styles.rowsContainer}>
          {(recentUsers.length > 0 ? recentUsers : []).map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="person-outline" size={16} color={BLUE} />
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
          ))}
        </View>
        {!loading && recentUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users found yet.</Text>
        ) : null}
      </View>

      {/* Recent Transactions Table */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Recent Payments</Text>
          <Text style={styles.linkText}>View All</Text>
        </View>
        <View style={styles.rowsContainer}>
          {transactions.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={[styles.rowIconWrap, { backgroundColor: "rgba(16,185,129,0.08)" }]}>
                <Ionicons name="receipt-outline" size={16} color={GREEN} />
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
          <Text style={styles.panelTitle}>Platform Summary</Text>
          <Text style={styles.linkText}>Overview</Text>
        </View>
        <View style={styles.rowsContainer}>
          {[
            ["Doctors", formatNumber(doctors), "Care network"],
            ["Pharmacies", formatNumber(pharmacies), "Medicine access"],
            ["Drug Records", formatNumber(drugs), "Reference data"],
            ["Active Users", formatNumber(activeUsers), "Subscribers"],
            ["Total Users", formatNumber(totalUsers), "Accounts"],
          ].map(([name, count, label], index) => (
            <View key={name} style={styles.rankRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.rankNameCol}>
                <Text style={styles.rankName}>{name}</Text>
                <Text style={styles.rowSub}>{label}</Text>
              </View>
              <Text style={styles.amount}>{count}</Text>
            </View>
          ))}
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
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 292,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  linkText: { color: BLUE, fontSize: 12, fontWeight: "700" },
  rowsContainer: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(59,130,246,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowMain: { flex: 1, minWidth: 110 },
  rowTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: "700" },
  rowSub: { color: TEXT_MUTED, fontSize: 11, marginTop: 2, fontWeight: "500" },
  badgeActive: {
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeTextActive: { color: GREEN, fontSize: 10, fontWeight: "700" },
  badgeFree: {
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeTextFree: { color: TEXT_MUTED, fontSize: 10, fontWeight: "700" },
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
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 11,
  },
  rankNameCol: { flex: 1 },
  rankName: { color: TEXT_DARK, fontSize: 13, fontWeight: "700" },
});

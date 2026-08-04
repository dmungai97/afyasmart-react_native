import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { AdminRecentUser, AdminTransaction } from "@admin/services/admin.service";

const SLATE_DARK = "#16302B";
const SLATE_MID = "#4B5C50";
const SLATE_LIGHT = "#6B7A70";
const BORDER = "#C7CFC2";

interface RecentTablesProps {
  recentUsers: AdminRecentUser[];
  transactions: AdminTransaction[];
  totalUsers: number;
  doctors: number;
  pharmacies: number;
  drugs: number;
  activeUsers: number;
  loading: boolean;
  isMobile?: boolean;
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
  isMobile = false,
}: RecentTablesProps) {
  return (
    <View style={[styles.tablesGrid, isMobile && styles.tablesGridMobile]}>
      {/* Recent Users Table */}
      <View style={[styles.panel, isMobile && styles.panelMobile]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent Users</Text>
            <Text style={styles.panelSub}>Latest signups on platform</Text>
          </View>
          <Text style={styles.linkText}>{formatNumber(totalUsers)} total</Text>
        </View>
        <View style={styles.rowsContainer}>
          {(recentUsers.length > 0 ? recentUsers : []).map((item, index) => {
            return (
              <View key={item.id} style={[styles.row, isMobile && styles.rowMobile, index === (recentUsers.length - 1) && { borderBottomWidth: 0 }]}>
                <View style={styles.rowAvatar}>
                  <Text style={styles.avatarText}>
                    {(item.name[0] ?? "U").toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{item.email || "No email saved"}</Text>
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
      <View style={[styles.panel, isMobile && styles.panelMobile]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent Payments</Text>
            <Text style={styles.panelSub}>M-Pesa request history</Text>
          </View>
          <Text style={styles.linkText}>View All</Text>
        </View>
        <View style={styles.rowsContainer}>
          {transactions.map((item, index) => (
            <View key={item.id} style={[styles.row, isMobile && styles.rowMobile, index === (transactions.length - 1) && { borderBottomWidth: 0 }]}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="receipt-outline" size={16} color={SLATE_MID} />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{item.type}</Text>
              </View>
              <View style={[styles.amountCol, isMobile && styles.amountColMobile]}>
                <Text style={styles.amount} numberOfLines={1}>{formatMoney(item.amount)}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{item.time}</Text>
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

      {/* Platform Summary Table */}
      <View style={[styles.panel, isMobile && styles.panelMobile]}>
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
            return (
              <View key={name} style={[styles.rankRow, index === 4 && { borderBottomWidth: 0 }]}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.rankNameCol}>
                  <Text style={styles.rankName}>{name}</Text>
                  <Text style={styles.rowSub}>{label}</Text>
                </View>
                <Text style={styles.amount}>{count}</Text>
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
    backgroundColor: "#FBFCF9",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 292
  },
  panelMobile: {
    flexBasis: "100%",
    flexGrow: 0,
    width: "100%",
    padding: 12,
  },
  tablesGridMobile: {
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  panelTitle: { color: SLATE_DARK, fontSize: 16, fontWeight: "700" },
  panelSub: { color: SLATE_LIGHT, fontSize: 11, fontWeight: "500", marginTop: 2 },
  linkText: { color: "#16302B", fontSize: 12, fontWeight: "600" },
  rowsContainer: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1EA",
    paddingVertical: 10,
  },
  rowMobile: {
    gap: 8,
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
    fontSize: 14,
    color: SLATE_DARK,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { color: SLATE_DARK, fontSize: 13, fontWeight: "600" },
  rowSub: { color: SLATE_LIGHT, fontSize: 11, marginTop: 2, fontWeight: "500" },
  badgeActive: {
    borderRadius: 20,
    backgroundColor: "#EEF1EA",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTextActive: { color: SLATE_DARK, fontSize: 10, fontWeight: "600" },
  badgeFree: {
    borderRadius: 20,
    backgroundColor: "#EEF1EA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badgeTextFree: { color: SLATE_LIGHT, fontSize: 10, fontWeight: "600" },
  amountCol: { alignItems: "flex-end" },
  amountColMobile: { maxWidth: 96 },
  amount: { color: SLATE_DARK, fontSize: 13, fontWeight: "700" },
  emptyText: {
    color: SLATE_LIGHT,
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 16,
    textAlign: "center",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1EA",
    paddingVertical: 10,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#EEF1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: SLATE_MID,
    fontWeight: "700",
    fontSize: 11,
  },
  rankNameCol: { flex: 1 },
  rankName: { color: SLATE_DARK, fontSize: 13, fontWeight: "600" },
});

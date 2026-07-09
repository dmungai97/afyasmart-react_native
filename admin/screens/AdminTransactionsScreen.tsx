import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Sidebar from "../components/Sidebar";
import {
  AdminPayment,
  fetchAllPayments,
  reconcilePayment,
  rejectPayment,
} from "@admin/services/admin.service";
import { useAuthStore } from "@/src/store/authStore";

const BLUE = "#3B82F6";
const GREEN = "#10B981";
const RED = "#EF4444";
const ORANGE = "#F59E0B";
const BORDER = "#E2E8F0";
const NAVY = "#1E293B";
const MUTED = "#64748B";

const STRINGS = {
  title: "Transactions",
  subtitle: "All M-Pesa payment requests on the platform",
  search: "Search by phone or plan...",
  all: "All",
  paid: "Paid",
  pending: "Pending",
  failed: "Other",
  noTransactions: "No transactions found",
  phone: "Phone / User",
  plan: "Plan",
  amount: "Amount",
  status: "Status",
  date: "Date",
  paidAt: "Paid At",
  totalRevenue: "Total Revenue",
  totalPaid: "Paid Transactions",
  totalPending: "Pending",
  admin: "Admin",
};

const formatMoney = (v: number) =>
  `Ksh ${new Intl.NumberFormat("en-KE").format(v)}`;

export default function AdminTransactionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [filtered, setFiltered] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "paid" | "pending" | "other">("all");
  const [reconciling, setReconciling] = useState<string | null>(null);

  const handleReconcile = (p: AdminPayment) => {
    Alert.alert(
      "Reconcile Transaction",
      `Are you sure you want to mark this request from ${p.phone} as PAID?\n\nThis will manually activate their ${p.plan} plan in the database.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setReconciling(p.id);
            try {
              await reconcilePayment(p.id, p.uid, p.plan);
              await load();
            } catch (err) {
              console.error("Reconcile payment error:", err);
              Alert.alert("Error", "Failed to reconcile payment request.");
            } finally {
              setReconciling(null);
            }
          },
        },
      ],
    );
  };

  const [rejecting, setRejecting] = useState<string | null>(null);

  const handleReject = (p: AdminPayment) => {
    Alert.alert(
      "Cancel Transaction",
      `Are you sure you want to cancel this request from ${p.phone}?\n\nThis will mark it as failed and remove it from the pending list.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: async () => {
            setRejecting(p.id);
            try {
              await rejectPayment(p.id);
              await load();
            } catch (err) {
              console.error("Cancel payment request error:", err);
              Alert.alert("Error", "Failed to cancel request.");
            } finally {
              setRejecting(null);
            }
          },
        },
      ],
    );
  };

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/(auth)/login" as any);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPayments();
      setPayments(data);
      setFiltered(data);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = payments;
    if (activeFilter === "paid") result = result.filter((p) => p.paid);
    if (activeFilter === "pending") result = result.filter((p) => p.status === "pending");
    if (activeFilter === "other") result = result.filter((p) => !p.paid && p.status !== "pending");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.phone.toLowerCase().includes(q) ||
          p.plan.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, activeFilter, payments]);

  const totalRevenue = payments.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter((p) => p.paid).length;
  const totalPending = payments.filter((p) => p.status === "pending").length;

  const statusColor = (p: AdminPayment) => {
    if (p.paid) return GREEN;
    if (p.status === "pending") return ORANGE;
    return RED;
  };

  const statusBg = (p: AdminPayment) => {
    if (p.paid) return "#ECFDF5";
    if (p.status === "pending") return "#FFFBEB";
    return "#FEF2F2";
  };

  const statusLabel = (p: AdminPayment) => {
    if (p.paid) return "Paid";
    if (p.status === "pending") return "Pending";
    return p.status;
  };

  const filters = [
    { key: "all" as const, label: STRINGS.all },
    { key: "paid" as const, label: STRINGS.paid },
    { key: "pending" as const, label: STRINGS.pending },
    { key: "other" as const, label: STRINGS.failed },
  ];

  return (
    <View style={styles.root}>
      <Sidebar
        userName={user?.name ?? STRINGS.admin}
        onSignOut={handleSignOut}
        isMobile={isMobile}
        visible={isMobile ? menuOpen : true}
        onClose={() => setMenuOpen(false)}
      />

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
        {/* Header */}
        <View style={[styles.topbar, isMobile && styles.topbarMobile]}>
          <View style={styles.titleRow}>
            {isMobile && (
              <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
                <Ionicons name="menu-outline" size={24} color="#1E293B" />
              </TouchableOpacity>
            )}
            <View style={styles.backBtnWrap}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/admin");
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <View style={styles.titleTextWrap}>
              <Text style={[styles.title, isMobile && styles.titleMobile]} numberOfLines={1}>{STRINGS.title}</Text>
              {!isMobile && <Text style={styles.subtitle}>{STRINGS.subtitle}</Text>}
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={load} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* KPI Summary */}
        <View style={[styles.kpiRow, isMobile && styles.kpiRowMobile]}>
          <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>{STRINGS.totalRevenue}</Text>
              <Text style={styles.kpiValue}>{formatMoney(totalRevenue)}</Text>
            </View>
            <View style={styles.kpiIcon}>
              <Ionicons name="wallet" size={20} color="#475569" />
            </View>
          </View>
          <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>{STRINGS.totalPaid}</Text>
              <Text style={styles.kpiValue}>{totalPaid}</Text>
            </View>
            <View style={styles.kpiIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#475569" />
            </View>
          </View>
          <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>{STRINGS.totalPending}</Text>
              <Text style={styles.kpiValue}>{totalPending}</Text>
            </View>
            <View style={styles.kpiIcon}>
              <Ionicons name="time" size={20} color="#475569" />
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={MUTED} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={STRINGS.search}
            placeholderTextColor={MUTED}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.countText}>{filtered.length} shown</Text>
        </View>

        {/* Table */}
        {loading ? (
          <ActivityIndicator size="large" color="#1E293B" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={MUTED} />
            <Text style={styles.emptyText}>{STRINGS.noTransactions}</Text>
          </View>
        ) : isMobile ? (
          <View style={styles.mobileList}>
            {filtered.map((p) => (
              <View key={p.id} style={styles.mobileCard}>
                <View style={styles.mobileCardHeader}>
                  <Text style={styles.mobilePhone} numberOfLines={1}>{p.phone}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg(p), borderColor: statusColor(p) + "30" }]}>
                    <Text style={[styles.statusText, { color: statusColor(p) }]}>{statusLabel(p)}</Text>
                  </View>
                </View>
                <View style={styles.mobileCardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mobilePlanText}>{p.plan}</Text>
                    <Text style={styles.mobileDateText}>{p.createdAt}</Text>
                  </View>
                  <Text style={styles.mobileAmountText}>{formatMoney(p.amount)}</Text>
                </View>
                {!p.paid && p.status === "pending" && (
                  <View style={styles.mobileActionsRow}>
                    <TouchableOpacity
                      style={[styles.mobileReconcileBtn, { flex: 1 }]}
                      onPress={() => handleReconcile(p)}
                      activeOpacity={0.7}
                      disabled={reconciling === p.id || rejecting === p.id}
                    >
                      {reconciling === p.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
                          <Text style={styles.reconcileBtnText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.mobileRejectBtn, { flex: 1 }]}
                      onPress={() => handleReject(p)}
                      activeOpacity={0.7}
                      disabled={reconciling === p.id || rejecting === p.id}
                    >
                      {rejecting === p.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={14} color="#fff" />
                          <Text style={styles.reconcileBtnText}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 2 }]}>{STRINGS.phone}</Text>
              <Text style={styles.thCell}>{STRINGS.plan}</Text>
              <Text style={styles.thCell}>{STRINGS.amount}</Text>
              <Text style={styles.thCell}>{STRINGS.status}</Text>
              <Text style={[styles.thCell, { textAlign: "right", paddingRight: 8 }]}>Action</Text>
            </View>
            {filtered.map((p, i) => (
              <View key={p.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cellPrimary}>{p.phone}</Text>
                  <Text style={styles.cellSub}>{p.createdAt}</Text>
                </View>
                <Text style={[styles.tdCell, { textTransform: "capitalize" }]}>{p.plan}</Text>
                <Text style={[styles.tdCell, { color: "#1E293B", fontWeight: "600" }]}>{formatMoney(p.amount)}</Text>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg(p), borderColor: statusColor(p) + "30" }]}>
                    <Text style={[styles.statusText, { color: statusColor(p) }]}>{statusLabel(p)}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end", paddingRight: 8 }}>
                  {!p.paid && p.status === "pending" ? (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={styles.reconcileTableBtn}
                        onPress={() => handleReconcile(p)}
                        activeOpacity={0.7}
                        disabled={reconciling === p.id || rejecting === p.id}
                      >
                        {reconciling === p.id ? (
                          <ActivityIndicator size="small" color={GREEN} />
                        ) : (
                          <Ionicons name="checkmark-circle-outline" size={18} color={GREEN} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectTableBtn}
                        onPress={() => handleReject(p)}
                        activeOpacity={0.7}
                        disabled={reconciling === p.id || rejecting === p.id}
                      >
                        {rejecting === p.id ? (
                          <ActivityIndicator size="small" color={RED} />
                        ) : (
                          <Ionicons name="close-circle-outline" size={18} color={RED} />
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  main: { flex: 1 },
  content: { padding: 24, gap: 16 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topbarMobile: { alignItems: "flex-start", gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  titleTextWrap: { flex: 1, minWidth: 0 },
  backBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  backBtn: {
    padding: 6,
  },
  menuBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  title: { color: "#1E293B", fontSize: 24, fontWeight: "700" },
  titleMobile: { fontSize: 20 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 4, fontWeight: "500" },
  refreshBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  kpiRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  kpiRowMobile: { gap: 8 },
  kpiCard: { flex: 1, minWidth: 140, backgroundColor: "#fff", borderRadius: 12, padding: 18, borderWidth: 1, borderColor: BORDER, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  kpiCardMobile: { flexBasis: "100%", minWidth: 0, padding: 12 },
  kpiContent: { flex: 1, paddingRight: 10 },
  kpiLabel: { color: MUTED, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  kpiValue: { color: "#1E293B", fontSize: 22, fontWeight: "700", marginTop: 6, letterSpacing: -0.5 },
  kpiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: BORDER, height: 44, gap: 8 },
  searchInput: { flex: 1, color: "#1E293B", fontSize: 13, fontWeight: "500", paddingRight: 12 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER },
  filterChipActive: { backgroundColor: "#1E293B", borderColor: "#1E293B" },
  filterChipText: { color: MUTED, fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  countText: { color: MUTED, fontSize: 11, fontWeight: "600", marginLeft: "auto" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: MUTED, fontSize: 15, fontWeight: "600" },
  table: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: BORDER },
  thCell: { flex: 1, color: MUTED, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  tableRowAlt: { backgroundColor: "#FAFBFD" },
  cellPrimary: { color: "#1E293B", fontSize: 13, fontWeight: "600" },
  cellSub: { color: "#94A3B8", fontSize: 10, fontWeight: "500", marginTop: 2 },
  tdCell: { flex: 1, color: MUTED, fontSize: 12, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  statusText: { fontSize: 10, fontWeight: "600" },
  mobileList: { gap: 10 },
  mobileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mobileCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  mobilePhone: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  mobilePlanText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  mobileDateText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  mobileAmountText: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "700",
  },
  mobileReconcileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  reconcileBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  reconcileTableBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  mobileActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  mobileRejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RED,
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  rejectTableBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
});

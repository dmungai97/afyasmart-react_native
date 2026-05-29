import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Sidebar from "../../components/admin/Sidebar";
import {
  AdminPayment,
  fetchAllPayments,
} from "../../src/services/admin.service";
import { useAuthStore } from "../../src/store/authStore";

const BLUE = "#3B82F6";
const GREEN = "#10B981";
const RED = "#EF4444";
const ORANGE = "#F59E0B";
const BORDER = "#F1F5F9";
const NAVY = "#0F172A";
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

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [filtered, setFiltered] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "paid" | "pending" | "other">("all");

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
      {isMobile ? (
        menuOpen && (
          <>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
            <Sidebar userName={user?.name ?? STRINGS.admin} onSignOut={handleSignOut} isMobile onClose={() => setMenuOpen(false)} />
          </>
        )
      ) : (
        <Sidebar userName={user?.name ?? STRINGS.admin} onSignOut={handleSignOut} />
      )}

      <ScrollView style={styles.main} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.topbar}>
          <View style={styles.titleRow}>
            {isMobile && (
              <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
                <Ionicons name="menu-outline" size={24} color="#34315A" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.title}>{STRINGS.title}</Text>
              <Text style={styles.subtitle}>{STRINGS.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={load} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={18} color={BLUE} />
          </TouchableOpacity>
        </View>

        {/* KPI Summary */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderLeftColor: GREEN }]}>
            <Text style={styles.kpiLabel}>{STRINGS.totalRevenue}</Text>
            <Text style={[styles.kpiValue, { color: GREEN }]}>{formatMoney(totalRevenue)}</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: BLUE }]}>
            <Text style={styles.kpiLabel}>{STRINGS.totalPaid}</Text>
            <Text style={[styles.kpiValue, { color: BLUE }]}>{totalPaid}</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: ORANGE }]}>
            <Text style={styles.kpiLabel}>{STRINGS.totalPending}</Text>
            <Text style={[styles.kpiValue, { color: ORANGE }]}>{totalPending}</Text>
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
          <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={MUTED} />
            <Text style={styles.emptyText}>{STRINGS.noTransactions}</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { flex: 2 }]}>{STRINGS.phone}</Text>
              <Text style={styles.thCell}>{STRINGS.plan}</Text>
              <Text style={styles.thCell}>{STRINGS.amount}</Text>
              <Text style={styles.thCell}>{STRINGS.status}</Text>
            </View>
            {filtered.map((p, i) => (
              <View key={p.id} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cellPrimary}>{p.phone}</Text>
                  <Text style={styles.cellSub}>{p.createdAt}</Text>
                </View>
                <Text style={[styles.tdCell, { textTransform: "capitalize" }]}>{p.plan}</Text>
                <Text style={[styles.tdCell, { color: GREEN, fontWeight: "800" }]}>{formatMoney(p.amount)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBg(p) }]}>
                  <Text style={[styles.statusText, { color: statusColor(p) }]}>{statusLabel(p)}</Text>
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
  backdrop: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,15,25,0.4)", zIndex: 998 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { padding: 6 },
  title: { color: NAVY, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 4, fontWeight: "500" },
  refreshBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  kpiRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  kpiCard: { flex: 1, minWidth: 160, backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4 },
  kpiLabel: { color: MUTED, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 22, fontWeight: "900", marginTop: 8, letterSpacing: -0.5 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: BORDER, height: 44, gap: 8 },
  searchInput: { flex: 1, color: NAVY, fontSize: 13, fontWeight: "500", paddingRight: 12 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterChipText: { color: MUTED, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },
  countText: { color: MUTED, fontSize: 11, fontWeight: "600", marginLeft: "auto" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: MUTED, fontSize: 15, fontWeight: "700" },
  table: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: BORDER },
  thCell: { flex: 1, color: MUTED, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableRowAlt: { backgroundColor: "#FAFBFF" },
  cellPrimary: { color: NAVY, fontSize: 13, fontWeight: "700" },
  cellSub: { color: MUTED, fontSize: 10, fontWeight: "500", marginTop: 2 },
  tdCell: { flex: 1, color: MUTED, fontSize: 12, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: "800" },
});

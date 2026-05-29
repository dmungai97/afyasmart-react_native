import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  AdminUser,
  fetchAllUsers,
  updateAdminUser,
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
  title: "All Users",
  subtitle: "Manage platform users, subscriptions & roles",
  search: "Search by name, email or phone...",
  filter: "Filter",
  all: "All",
  subscribed: "Subscribed",
  free: "Free",
  admins: "Admins",
  editUser: "Edit User",
  name: "Name",
  email: "Email",
  phone: "Phone",
  role: "Role",
  plan: "Subscription Plan",
  subscriptionStatus: "Subscription Status",
  active: "Active",
  inactive: "Inactive",
  save: "Save Changes",
  cancel: "Cancel",
  saving: "Saving...",
  noUsers: "No users found",
  free2: "Free",
  joined: "Joined",
  admin: "Admin",
};

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

export default function AdminUsersPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "subscribed" | "free" | "admin">("all");

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editSubscribed, setEditSubscribed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/(auth)/login" as any);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
      setFiltered(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = users;
    if (activeFilter === "subscribed") result = result.filter((u) => u.isSubscribed);
    if (activeFilter === "free") result = result.filter((u) => !u.isSubscribed);
    if (activeFilter === "admin") result = result.filter((u) => u.role === "admin" || u.role === "super_admin");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [search, activeFilter, users]);

  const openEdit = (u: AdminUser) => {
    setEditTarget(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPlan(u.subscriptionPlan);
    setEditSubscribed(u.isSubscribed);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateAdminUser(editTarget.id, {
        name: editName.trim(),
        role: editRole,
        is_subscribed: editSubscribed,
        subscription_plan: editPlan,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? { ...u, name: editName.trim(), role: editRole, isSubscribed: editSubscribed, subscriptionPlan: editPlan }
            : u,
        ),
      );
      setEditTarget(null);
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filters: { key: typeof activeFilter; label: string }[] = [
    { key: "all", label: STRINGS.all },
    { key: "subscribed", label: STRINGS.subscribed },
    { key: "free", label: STRINGS.free },
    { key: "admin", label: STRINGS.admins },
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
                <Ionicons name="menu-outline" size={24} color="#0B0F19" />
              </TouchableOpacity>
            )}
            <View style={styles.backBtnWrap}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/admin")} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color="#0B0F19" />
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.title}>{STRINGS.title}</Text>
              <Text style={styles.subtitle}>{STRINGS.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={load} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={18} color={BLUE} />
          </TouchableOpacity>
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

        {/* Filter Chips */}
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
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statsCardMini}>
            <Text style={styles.statsLabelMini}>Filtered Users</Text>
            <Text style={styles.statsValMini}>
              {filtered.length} <Text style={{ color: MUTED, fontSize: 11, fontWeight: "500" }}>of {users.length}</Text>
            </Text>
          </View>
          <View style={styles.statsCardMini}>
            <Text style={styles.statsLabelMini}>Active Subscribers</Text>
            <Text style={[styles.statsValMini, { color: GREEN }]}>
              {users.filter((u) => u.isSubscribed).length}
            </Text>
          </View>
        </View>

        {/* Users list */}
        {loading ? (
          <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={MUTED} />
            <Text style={styles.emptyText}>{STRINGS.noUsers}</Text>
          </View>
        ) : (
          <View style={styles.table}>
            {filtered.map((u, index) => {
              const avatarColors = getAvatarColor(u.name);
              return (
                <View key={u.id} style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
                  {/* Avatar + Info */}
                  <View style={[styles.rowAvatar, { backgroundColor: avatarColors.bg }]}>
                    <Text style={[styles.avatarText, { color: avatarColors.text }]}>{(u.name[0] ?? "U").toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{u.name}</Text>
                    <Text style={styles.rowEmail}>{u.email}</Text>
                    {u.phone ? <Text style={styles.rowPhone}>{u.phone}</Text> : null}
                    <Text style={styles.rowDate}>{STRINGS.joined}: {u.createdAt}</Text>
                  </View>

                  {/* Badges */}
                  <View style={styles.rowBadges}>
                    <View style={[styles.badge, u.isSubscribed ? styles.badgeGreen : styles.badgeGray]}>
                      <Text style={[styles.badgeText, u.isSubscribed ? styles.badgeTextGreen : styles.badgeTextGray]}>
                        {u.isSubscribed ? STRINGS.active : STRINGS.free2}
                      </Text>
                    </View>
                    {(u.role === "admin" || u.role === "super_admin") ? (
                      <View style={[styles.badge, styles.badgeBlue]}>
                        <Text style={[styles.badgeText, styles.badgeTextBlue]}>{STRINGS.admin}</Text>
                      </View>
                    ) : null}
                    {u.subscriptionPlan !== "free" ? (
                      <View style={[styles.badge, styles.badgeOrange]}>
                        <Text style={[styles.badgeText, styles.badgeTextOrange]}>{u.subscriptionPlan}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Edit button */}
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)} activeOpacity={0.7}>
                    <Ionicons name="create" size={16} color={BLUE} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{STRINGS.editUser}</Text>
                <Text style={styles.modalSub}>Update credential & access controls</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditTarget(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{STRINGS.name}</Text>
              <TextInput style={styles.field} value={editName} onChangeText={setEditName} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{STRINGS.role}</Text>
              <View style={styles.roleRow}>
                {["user", "admin", "super_admin"].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, editRole === r && styles.roleChipActive]}
                    onPress={() => setEditRole(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleChipText, editRole === r && styles.roleChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{STRINGS.plan}</Text>
              <View style={styles.roleRow}>
                {["free", "daily", "weekly", "monthly"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.roleChip, editPlan === p && styles.roleChipActive]}
                    onPress={() => setEditPlan(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleChipText, editPlan === p && styles.roleChipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{STRINGS.subscriptionStatus}</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleChip, editSubscribed && styles.roleChipActive]}
                  onPress={() => setEditSubscribed(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleChipText, editSubscribed && styles.roleChipTextActive]}>{STRINGS.active}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleChip, !editSubscribed && styles.roleChipRed]}
                  onPress={() => setEditSubscribed(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleChipText, !editSubscribed && styles.roleChipTextRed]}>{STRINGS.inactive}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditTarget(null)} activeOpacity={0.7}>
                <Text style={styles.cancelText}>{STRINGS.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} activeOpacity={0.8} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>{STRINGS.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F4F6FA" },
  main: { flex: 1 },
  content: { padding: 24, gap: 20 },
  backdrop: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,15,25,0.4)", zIndex: 998 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  menuBtn: { padding: 6 },
  title: { color: "#0B0F19", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 4, fontWeight: "500" },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: BORDER, height: 44, gap: 8, shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
  searchInput: { flex: 1, color: "#0B0F19", fontSize: 13, fontWeight: "500", paddingRight: 12 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER },
  filterChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  filterChipText: { color: MUTED, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },
  statsBar: { flexDirection: "row", gap: 12 },
  statsCardMini: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statsLabelMini: { color: MUTED, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  statsValMini: { color: "#0B0F19", fontSize: 16, fontWeight: "900", marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: MUTED, fontSize: 15, fontWeight: "700" },
  table: { gap: 10 },
  row: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
  rowAlt: { backgroundColor: "#FAFBFD" },
  rowAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", fontSize: 16 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { color: "#0B0F19", fontSize: 14, fontWeight: "800" },
  rowEmail: { color: MUTED, fontSize: 12, fontWeight: "500" },
  rowPhone: { color: MUTED, fontSize: 11, fontWeight: "500" },
  rowDate: { color: MUTED, fontSize: 10, fontWeight: "500", marginTop: 2 },
  rowBadges: { gap: 4, alignItems: "flex-end" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  badgeGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  badgeTextGreen: { color: GREEN },
  badgeGray: { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" },
  badgeTextGray: { color: MUTED },
  badgeBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  badgeTextBlue: { color: BLUE },
  badgeOrange: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  badgeTextOrange: { color: ORANGE },
  editBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(11, 15, 25, 0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 14 },
  modalTitle: { color: "#0B0F19", fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  modalSub: { color: MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: MUTED, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  field: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 14, color: "#0B0F19", fontSize: 13, fontWeight: "600", backgroundColor: "#FAFBFD" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#FAFBFD", borderWidth: 1, borderColor: "#E2E8F0" },
  roleChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  roleChipText: { color: MUTED, fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  roleChipTextActive: { color: "#fff" },
  roleChipRed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  roleChipTextRed: { color: RED },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center" },
  cancelText: { color: MUTED, fontWeight: "800", fontSize: 13 },
  saveBtn: { flex: 2, height: 46, borderRadius: 12, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

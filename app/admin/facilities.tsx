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
  AdminFacility,
  addFacility,
  deleteFacility,
  fetchAllFacilities,
  updateFacility,
} from "../../src/services/admin.service";
import { useAuthStore } from "../../src/store/authStore";

const BLUE = "#3B82F6";
const GREEN = "#10B981";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";
const BORDER = "#F1F5F9";
const NAVY = "#0F172A";
const MUTED = "#64748B";

const STRINGS = {
  title: "Facilities",
  subtitle: "Manage doctors and pharmacies listed on the platform",
  all: "All",
  doctors: "Doctors",
  pharmacies: "Pharmacies",
  search: "Search by name or location...",
  addFacility: "Add Facility",
  editFacility: "Edit Facility",
  deleteFacility: "Remove Facility",
  confirmDelete: "Are you sure you want to remove this facility?",
  confirm: "Confirm",
  cancel: "Cancel",
  save: "Save Changes",
  add: "Add",
  saving: "Saving...",
  noFacilities: "No facilities found",
  name: "Name",
  location: "Location",
  phone: "Phone",
  email: "Email",
  specialization: "Specialization",
  hospital: "Hospital",
  experienceYears: "Experience (years)",
  address: "Address",
  openingHours: "Opening Hours",
  type: "Type",
  doctor: "Doctor",
  pharmacy: "Pharmacy",
  available: "Available",
  yes: "Yes",
  no: "No",
  open24: "Open 24hrs",
  admin: "Admin",
};

const emptyDoctor = {
  type: "doctor" as const,
  name: "",
  location: "",
  phone: "",
  email: "",
  specialization: "",
  hospital: "",
  experienceYears: 0,
  available: true,
};

const emptyPharmacy = {
  type: "pharmacy" as const,
  name: "",
  location: "",
  phone: "",
  email: "",
  address: "",
  openingHours: "",
  open24hrs: false,
  open: true,
};

export default function AdminFacilitiesPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [facilities, setFacilities] = useState<AdminFacility[]>([]);
  const [filtered, setFiltered] = useState<AdminFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "doctor" | "pharmacy">("all");

  const [editTarget, setEditTarget] = useState<AdminFacility | null>(null);
  const [addType, setAddType] = useState<"doctor" | "pharmacy">("doctor");
  const [form, setForm] = useState<Record<string, any>>(emptyDoctor);
  const [showModal, setShowModal] = useState<"none" | "edit" | "add">("none");
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/(auth)/login" as any);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllFacilities();
      setFacilities(data);
      setFiltered(data);
    } catch {
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = facilities;
    if (activeFilter !== "all") result = result.filter((f) => f.type === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          (f.specialization?.toLowerCase().includes(q) ?? false),
      );
    }
    setFiltered(result);
  }, [search, activeFilter, facilities]);

  const openEdit = (f: AdminFacility) => {
    setEditTarget(f);
    setForm({ ...f });
    setShowModal("edit");
  };

  const openAdd = (t: "doctor" | "pharmacy") => {
    setAddType(t);
    setForm(t === "doctor" ? { ...emptyDoctor } : { ...emptyPharmacy });
    setShowModal("add");
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const { id, type, ...data } = form;
      await updateFacility(editTarget.type, editTarget.id, data);
      setFacilities((prev) =>
        prev.map((f) => (f.id === editTarget.id ? ({ ...f, ...data }) : f)),
      );
      setShowModal("none");
    } catch {
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      const { type, ...data } = form;
      await addFacility(addType, data);
      await load();
      setShowModal("none");
    } catch {
      Alert.alert("Error", "Failed to add facility.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (f: AdminFacility) => {
    Alert.alert(STRINGS.deleteFacility, `${STRINGS.confirmDelete}\n\n"${f.name}"`, [
      { text: STRINGS.cancel, style: "cancel" },
      {
        text: STRINGS.confirm,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFacility(f.type, f.id);
            setFacilities((prev) => prev.filter((x) => x.id !== f.id));
          } catch {
            Alert.alert("Error", "Failed to remove facility.");
          }
        },
      },
    ]);
  };

  const filters = [
    { key: "all" as const, label: STRINGS.all },
    { key: "doctor" as const, label: STRINGS.doctors },
    { key: "pharmacy" as const, label: STRINGS.pharmacies },
  ];

  const isEdit = showModal === "edit";

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
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addBtn} onPress={() => openAdd("doctor")} activeOpacity={0.8}>
              <Ionicons name="medkit-outline" size={16} color="#fff" />
              <Text style={styles.addBtnText}>+ Doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: PURPLE }]} onPress={() => openAdd("pharmacy")} activeOpacity={0.8}>
              <Ionicons name="business-outline" size={16} color="#fff" />
              <Text style={styles.addBtnText}>+ Pharmacy</Text>
            </TouchableOpacity>
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

        {/* Facility list */}
        {loading ? (
          <ActivityIndicator size="large" color={BLUE} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={MUTED} />
            <Text style={styles.emptyText}>{STRINGS.noFacilities}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((f) => (
              <View key={f.id} style={styles.card}>
                <View style={[styles.cardAccent, { backgroundColor: f.type === "doctor" ? BLUE : PURPLE }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.cardIcon, { backgroundColor: f.type === "doctor" ? "#EFF6FF" : "#F5F3FF" }]}>
                      <Ionicons
                        name={f.type === "doctor" ? "medkit" : "business"}
                        size={20}
                        color={f.type === "doctor" ? BLUE : PURPLE}
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{f.name}</Text>
                      {f.specialization ? <Text style={styles.cardSpec}>{f.specialization}</Text> : null}
                      {f.hospital ? <Text style={styles.cardSub}>{f.hospital}</Text> : null}
                      <Text style={styles.cardSub}>{f.location}</Text>
                      <Text style={styles.cardPhone}>{f.phone}</Text>
                    </View>
                    <View style={styles.cardBadge}>
                      <View style={[styles.typeBadge, { backgroundColor: f.type === "doctor" ? "#EFF6FF" : "#F5F3FF" }]}>
                        <Text style={[styles.typeBadgeText, { color: f.type === "doctor" ? BLUE : PURPLE }]}>
                          {f.type === "doctor" ? STRINGS.doctor : STRINGS.pharmacy}
                        </Text>
                      </View>
                      {f.type === "doctor" && (
                        <View style={[styles.availBadge, f.available ? styles.availGreen : styles.availRed]}>
                          <Text style={[styles.availText, { color: f.available ? GREEN : RED }]}>
                            {f.available ? STRINGS.yes : STRINGS.no}
                          </Text>
                        </View>
                      )}
                      {f.type === "pharmacy" && f.open24hrs && (
                        <View style={styles.open24Badge}>
                          <Text style={styles.open24Text}>24h</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editAction} onPress={() => openEdit(f)} activeOpacity={0.7}>
                      <Ionicons name="create-outline" size={14} color={BLUE} />
                      <Text style={styles.editActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(f)} activeOpacity={0.7}>
                      <Ionicons name="trash-outline" size={14} color={RED} />
                      <Text style={styles.deleteActionText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit / Add Modal */}
      <Modal
        visible={showModal !== "none"}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal("none")}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEdit ? STRINGS.editFacility : STRINGS.addFacility}</Text>
                <TouchableOpacity onPress={() => setShowModal("none")} activeOpacity={0.7}>
                  <Ionicons name="close-outline" size={24} color={MUTED} />
                </TouchableOpacity>
              </View>

              {!isEdit && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{STRINGS.type}</Text>
                  <View style={styles.roleRow}>
                    {(["doctor", "pharmacy"] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.roleChip, addType === t && styles.roleChipActive]}
                        onPress={() => {
                          setAddType(t);
                          setForm(t === "doctor" ? { ...emptyDoctor } : { ...emptyPharmacy });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.roleChipText, addType === t && styles.roleChipTextActive]}>
                          {t === "doctor" ? STRINGS.doctor : STRINGS.pharmacy}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Common fields */}
              {[
                { key: "name", label: STRINGS.name },
                { key: "location", label: STRINGS.location },
                { key: "phone", label: STRINGS.phone },
                { key: "email", label: STRINGS.email },
              ].map(({ key, label }) => (
                <View key={key} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.field}
                    value={String(form[key] ?? "")}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
                    keyboardType={key === "phone" ? "phone-pad" : "default"}
                  />
                </View>
              ))}

              {/* Doctor-only fields */}
              {(isEdit ? editTarget?.type === "doctor" : addType === "doctor") && (
                <>
                  {[
                    { key: "specialization", label: STRINGS.specialization },
                    { key: "hospital", label: STRINGS.hospital },
                    { key: "experienceYears", label: STRINGS.experienceYears },
                  ].map(({ key, label }) => (
                    <View key={key} style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>{label}</Text>
                      <TextInput
                        style={styles.field}
                        value={String(form[key] ?? "")}
                        onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: key === "experienceYears" ? Number(v) || 0 : v }))}
                        keyboardType={key === "experienceYears" ? "numeric" : "default"}
                      />
                    </View>
                  ))}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{STRINGS.available}</Text>
                    <View style={styles.roleRow}>
                      <TouchableOpacity style={[styles.roleChip, form.available && styles.roleChipActive]} onPress={() => setForm((prev) => ({ ...prev, available: true }))} activeOpacity={0.7}>
                        <Text style={[styles.roleChipText, form.available && styles.roleChipTextActive]}>{STRINGS.yes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.roleChip, !form.available && { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]} onPress={() => setForm((prev) => ({ ...prev, available: false }))} activeOpacity={0.7}>
                        <Text style={[styles.roleChipText, !form.available && { color: RED }]}>{STRINGS.no}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Pharmacy-only fields */}
              {(isEdit ? editTarget?.type === "pharmacy" : addType === "pharmacy") && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{STRINGS.address}</Text>
                    <TextInput
                      style={styles.field}
                      value={String(form.address ?? "")}
                      onChangeText={(v) => setForm((prev) => ({ ...prev, address: v }))}
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{STRINGS.openingHours}</Text>
                    <TextInput
                      style={styles.field}
                      value={String(form.openingHours ?? "")}
                      onChangeText={(v) => setForm((prev) => ({ ...prev, openingHours: v }))}
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{STRINGS.open24}</Text>
                    <View style={styles.roleRow}>
                      <TouchableOpacity style={[styles.roleChip, form.open24hrs && styles.roleChipActive]} onPress={() => setForm((prev) => ({ ...prev, open24hrs: true }))} activeOpacity={0.7}>
                        <Text style={[styles.roleChipText, form.open24hrs && styles.roleChipTextActive]}>{STRINGS.yes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.roleChip, !form.open24hrs && { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]} onPress={() => setForm((prev) => ({ ...prev, open24hrs: false }))} activeOpacity={0.7}>
                        <Text style={[styles.roleChipText, !form.open24hrs && { color: RED }]}>{STRINGS.no}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal("none")} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>{STRINGS.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={isEdit ? saveEdit : saveAdd}
                  activeOpacity={0.8}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>{isEdit ? STRINGS.save : STRINGS.add}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  main: { flex: 1 },
  content: { padding: 24, gap: 16 },
  backdrop: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,15,25,0.4)", zIndex: 998 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  menuBtn: { padding: 6 },
  title: { color: NAVY, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: MUTED, fontSize: 13, marginTop: 4, fontWeight: "500" },
  headerActions: { flexDirection: "row", gap: 8 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
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
  grid: { gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: BORDER, flexDirection: "row", overflow: "hidden" },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardBadge: { alignItems: "flex-end", gap: 4 },
  cardName: { color: NAVY, fontSize: 15, fontWeight: "800" },
  cardSpec: { color: BLUE, fontSize: 12, fontWeight: "700", marginTop: 2 },
  cardSub: { color: MUTED, fontSize: 11, fontWeight: "500", marginTop: 1 },
  cardPhone: { color: MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  availBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  availGreen: { backgroundColor: "#ECFDF5" },
  availRed: { backgroundColor: "#FEF2F2" },
  availText: { fontSize: 10, fontWeight: "700" },
  open24Badge: { backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  open24Text: { color: "#D97706", fontSize: 10, fontWeight: "700" },
  cardActions: { flexDirection: "row", gap: 12, marginTop: 14, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  editAction: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editActionText: { color: BLUE, fontSize: 12, fontWeight: "700" },
  deleteAction: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  deleteActionText: { color: RED, fontSize: 12, fontWeight: "700" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalScroll: { flexGrow: 1, justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { color: NAVY, fontSize: 18, fontWeight: "900" },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: MUTED, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  field: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, color: NAVY, fontSize: 14, fontWeight: "600" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: BORDER },
  roleChipActive: { backgroundColor: BLUE, borderColor: BLUE },
  roleChipText: { color: MUTED, fontSize: 12, fontWeight: "700" },
  roleChipTextActive: { color: "#fff" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
  cancelText: { color: MUTED, fontWeight: "700" },
  saveBtn: { flex: 2, height: 46, borderRadius: 12, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

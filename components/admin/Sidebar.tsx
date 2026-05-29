import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DARK_BG = "#0B0F19";
const BRAND_GREEN = "#10B981";
const ACCENT_BLUE = "#3B82F6";

type IconName = keyof typeof Ionicons.glyphMap;

interface SidebarProps {
  userName: string | null;
  onSignOut: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

function SidebarItem({
  icon,
  label,
  active,
  badge,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sideItem, active && styles.sideItemActive]}
      onPress={onPress || (() => {})}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={18} color={active ? "#fff" : "#94A3B8"} />
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </TouchableOpacity>
  );
}

export default function Sidebar({ userName, onSignOut, isMobile, onClose }: SidebarProps) {
  return (
    <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
      {/* Brand row with optional Close button on mobile */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={styles.logo}>
            <Ionicons name="heart" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.brand}>AfyaSmart</Text>
            <Text style={styles.brandSub}>Admin Console</Text>
          </View>
        </View>
        {isMobile && onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.navGroup}>
        <SidebarItem icon="grid" label="Dashboard" active onPress={isMobile ? onClose : undefined} />
        <Text style={styles.navHeader}>Facility Management</Text>
        <SidebarItem icon="shield-checkmark-outline" label="Facility Approvals" badge="0" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="business-outline" label="All Facilities" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="add-circle-outline" label="Add Facility" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="trash-outline" label="Remove Facility" onPress={isMobile ? onClose : undefined} />
        <Text style={styles.navHeader}>Financial Management</Text>
        <SidebarItem icon="analytics-outline" label="Revenue & Income" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="card-outline" label="Payouts" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="cash-outline" label="Commissions" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="receipt-outline" label="Transactions" onPress={isMobile ? onClose : undefined} />
        <Text style={styles.navHeader}>System</Text>
        <SidebarItem icon="notifications-outline" label="Notifications" badge="8" onPress={isMobile ? onClose : undefined} />
        <SidebarItem icon="settings-outline" label="System Settings" onPress={isMobile ? onClose : undefined} />
      </View>

      <TouchableOpacity style={styles.adminProfile} onPress={onSignOut} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(userName?.[0] ?? "A").toUpperCase()}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{userName ?? "Admin"}</Text>
          <Text style={styles.profileRole}>Super Administrator</Text>
        </View>
        <Ionicons name="log-out-outline" size={16} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 264,
    backgroundColor: DARK_BG,
    padding: 20,
    gap: 6,
    height: "100%",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.05)",
  },
  sidebarMobile: {
    width: 280,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BRAND_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brand: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 0.5 },
  brandSub: { color: "#64748B", fontSize: 11, marginTop: 1, fontWeight: "600" },
  closeBtn: {
    padding: 4,
  },
  navGroup: {
    flex: 1,
  },
  navHeader: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 22,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sideItem: {
    height: 40,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  sideItemActive: {
    backgroundColor: ACCENT_BLUE,
    shadowColor: ACCENT_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sideLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  sideLabelActive: { color: "#fff", fontWeight: "700" },
  badge: {
    color: "#fff",
    backgroundColor: BRAND_GREEN,
    overflow: "hidden",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    fontSize: 9,
    fontWeight: "900",
    marginLeft: "auto",
  },
  adminProfile: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  profileText: { flex: 1 },
  profileName: { color: "#fff", fontWeight: "700", fontSize: 13 },
  profileRole: { color: "#64748B", fontSize: 10, marginTop: 1, fontWeight: "500" },
});

import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
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

const STRINGS = {
  brand: "AfyaSmart",
  brandSub: "Admin Console",
  dashboard: "Dashboard",
  facilityMgmt: "Facility Management",
  facilityApprovals: "Facility Approvals",
  allFacilities: "All Facilities",
  addFacility: "Add Facility",
  removeFacility: "Remove Facility",
  financialMgmt: "Financial Management",
  revenueIncome: "Revenue & Income",
  payouts: "Payouts",
  commissions: "Commissions",
  transactions: "Transactions",
  userMgmt: "User Management",
  allUsers: "All Users",
  system: "System",
  notifications: "Notifications",
  settings: "System Settings",
  superAdmin: "Super Administrator",
};

type NavItem = {
  icon: IconName;
  label: string;
  route: string;
  badge?: string;
};

type NavSection = {
  header: string;
  items: NavItem[];
};

const NAV: NavSection[] = [
  {
    header: "",
    items: [
      { icon: "grid", label: STRINGS.dashboard, route: "/admin" },
    ],
  },
  {
    header: STRINGS.facilityMgmt,
    items: [
      { icon: "business-outline", label: STRINGS.allFacilities, route: "/admin/facilities" },
      { icon: "add-circle-outline", label: STRINGS.addFacility, route: "/admin/facilities?action=add" },
    ],
  },
  {
    header: STRINGS.userMgmt,
    items: [
      { icon: "people-outline", label: STRINGS.allUsers, route: "/admin/users" },
    ],
  },
  {
    header: STRINGS.financialMgmt,
    items: [
      { icon: "analytics-outline", label: STRINGS.revenueIncome, route: "/admin/transactions" },
      { icon: "receipt-outline", label: STRINGS.transactions, route: "/admin/transactions" },
    ],
  },
];

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
      onPress={onPress ?? (() => {})}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={18} color={active ? "#fff" : "#94A3B8"} />
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </TouchableOpacity>
  );
}

export default function Sidebar({ userName, onSignOut, isMobile, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (route: string) => {
    if (onClose) onClose();
    if (route.includes("?action=add")) {
      router.push("/admin/facilities" as any);
    } else {
      router.push(route as any);
    }
  };

  const isActive = (route: string) => {
    const base = route.split("?")[0];
    if (base === "/admin") return pathname === "/admin";
    return pathname.startsWith(base);
  };

  return (
    <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
      {/* Brand row */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={styles.logo}>
            <Ionicons name="heart" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.brand}>{STRINGS.brand}</Text>
            <Text style={styles.brandSub}>{STRINGS.brandSub}</Text>
          </View>
        </View>
        {isMobile && onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Nav Sections */}
      <View style={styles.navGroup}>
        {NAV.map((section) => (
          <View key={section.header || "top"}>
            {section.header ? (
              <Text style={styles.navHeader}>{section.header}</Text>
            ) : null}
            {section.items.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                active={isActive(item.route)}
                onPress={() => navigate(item.route)}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Profile / Sign out */}
      <TouchableOpacity style={styles.adminProfile} onPress={onSignOut} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(userName?.[0] ?? "A").toUpperCase()}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{userName ?? "Admin"}</Text>
          <Text style={styles.profileRole}>{STRINGS.superAdmin}</Text>
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
  brandLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  closeBtn: { padding: 4 },
  navGroup: { flex: 1 },
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
  sideLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "600", flex: 1 },
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

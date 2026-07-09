import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DARK_BG = "#1E293B";
const BRAND_GREEN = "#10B981";

type IconName = keyof typeof Ionicons.glyphMap;

interface SidebarProps {
  userName: string | null;
  onSignOut: () => void;
  isMobile?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

const STRINGS = {
  brand: "AfyaSmart",
  brandSub: "Admin Console",
  dashboard: "Dashboard",
  facilityMgmt: "Facility Management",
  allFacilities: "All Facilities",
  addFacility: "Add Facility",
  financialMgmt: "Financial Management",
  revenueIncome: "Revenue & Income",
  transactions: "Transactions",
  userMgmt: "User Management",
  allUsers: "All Users",
  superAdmin: "Super Administrator",
  logout: "Logout",
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
      { icon: "grid-outline", label: STRINGS.dashboard, route: "/admin" },
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
      <Ionicons name={icon} size={18} color="#fff" style={styles.iconStyle} />
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </TouchableOpacity>
  );
}

export default function Sidebar({
  userName,
  onSignOut,
  isMobile,
  visible = true,
  onClose,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const animVal = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (!isMobile) return;

    if (visible) {
      setShouldRender(true);
      Animated.timing(animVal, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animVal, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, isMobile, animVal]);

  const navigate = (route: string) => {
    if (onClose) onClose();
    if (route.includes("?action=add")) {
      router.replace("/admin/facilities" as any);
    } else {
      router.replace(route as any);
    }
  };

  const isActive = (route: string) => {
    const base = route.split("?")[0];
    if (base === "/admin") return pathname === "/admin";
    return pathname.startsWith(base);
  };

  const backdropOpacity = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const drawerTranslateX = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [-Math.min(300, width * 0.86), 0],
  });

  const renderSidebarContent = () => (
    <>
      {/* Mobile Close Button Row */}
      {isMobile && onClose && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="arrow-back-outline" size={22} color="#fff" />
            <Text style={styles.closeText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Centered Profile Section (iOS style) */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(userName?.[0] ?? "A").toUpperCase()}</Text>
            </View>
            <Text style={styles.profileName}>{userName ?? "Admin"}</Text>
            <Text style={styles.profileRole}>{STRINGS.superAdmin}</Text>
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
        </View>

        {/* Logout button at the bottom */}
        <TouchableOpacity style={styles.logoutButton} onPress={onSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#fff" style={styles.iconStyle} />
          <Text style={styles.logoutText}>{STRINGS.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );

  if (!isMobile) {
    return (
      <View style={styles.sidebar}>
        {renderSidebarContent()}
      </View>
    );
  }

  if (!shouldRender) return null;

  return (
    <>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sidebar,
          styles.sidebarMobile,
          {
            transform: [{ translateX: drawerTranslateX }],
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
            width: Math.min(300, width * 0.86),
          },
        ]}
      >
        {renderSidebarContent()}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 264,
    backgroundColor: DARK_BG,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
    elevation: 10,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(11, 15, 25, 0.4)",
    zIndex: 998,
    elevation: 9,
  },
  backdropPressable: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 24 },
  profileName: { color: "#fff", fontWeight: "600", fontSize: 16, marginTop: 12 },
  profileRole: { color: "#94A3B8", fontSize: 11, marginTop: 2, fontWeight: "500" },
  navGroup: { flex: 1 },
  navHeader: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1.0,
  },
  sideItem: {
    minHeight: 40,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 2,
  },
  sideItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  sideLabel: { color: "#E2E8F0", fontSize: 13, fontWeight: "500", flex: 1 },
  sideLabelActive: { color: "#fff", fontWeight: "600" },
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
  iconStyle: {
    marginRight: 10,
  },
  logoutButton: {
    minHeight: 40,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BLUE = "#3B82F6";
const GREEN = "#10B981";
const RED = "#EF4444";
const ORANGE = "#F59E0B";
const PURPLE = "#8B5CF6";
const CYAN = "#06B6D4";
const BORDER = "#F1F5F9";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#64748B";

const STRINGS = {
  quickActions: "Quick Actions",
  meta: "Common administrative workflows",
  addFacility: "Add New Facility",
  addFacilitySub: "Pharmacy, Doctor or Hospital",
  approveFacilities: "Approve Facilities",
  approveFacilitiesSub: "Review pending requests",
  removeFacility: "Remove Facility",
  removeFacilitySub: "Delete inactive facilities",
  viewPayouts: "View Payouts",
  viewPayoutsSub: "Check pending payouts",
  viewUsers: "Manage Users",
  viewUsersSub: "View subscriptions & roles",
  viewTransactions: "View Transactions",
  viewTransactionsSub: "Detailed payment log",
};

type IconName = keyof typeof Ionicons.glyphMap;

export default function QuickActions() {
  const router = useRouter();

  const actionsList: [IconName, string, string, string, string][] = [
    ["add-circle", STRINGS.addFacility, STRINGS.addFacilitySub, BLUE, "/admin/facilities"],
    ["business-outline", STRINGS.approveFacilities, STRINGS.approveFacilitiesSub, GREEN, "/admin/facilities"],
    ["trash", STRINGS.removeFacility, STRINGS.removeFacilitySub, RED, "/admin/facilities"],
    ["card-outline", STRINGS.viewPayouts, STRINGS.viewPayoutsSub, ORANGE, "/admin/transactions"],
    ["people-outline", STRINGS.viewUsers, STRINGS.viewUsersSub, PURPLE, "/admin/users"],
    ["receipt-outline", STRINGS.viewTransactions, STRINGS.viewTransactionsSub, CYAN, "/admin/transactions"],
  ];

  return (
    <View style={styles.quickActions}>
      <View style={styles.quickHeader}>
        <View>
          <Text style={styles.panelTitle}>{STRINGS.quickActions}</Text>
          <Text style={styles.panelSub}>{STRINGS.meta}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {actionsList.map(([icon, title, sub, color, route]) => (
          <TouchableOpacity
            key={title}
            style={[styles.actionCard, { borderLeftColor: color }]}
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSub}>{sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    gap: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    width: "100%",
  },
  quickHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  panelSub: { color: TEXT_MUTED, fontSize: 11, fontWeight: "500", marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 240,
    minHeight: 68,
    borderRadius: 12,
    backgroundColor: "#FAFBFD",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderLeftWidth: 4,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textContainer: { flex: 1 },
  actionTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: "800" },
  actionSub: { color: TEXT_MUTED, fontSize: 11, marginTop: 3, fontWeight: "500" },
});

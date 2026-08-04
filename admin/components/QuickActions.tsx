import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

const SLATE_DARK = "#16302B";
const SLATE_MID = "#4B5C50";
const SLATE_LIGHT = "#6B7A70";
const BORDER = "#C7CFC2";

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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const actionsList: [IconName, string, string, string][] = [
    ["add-circle-outline", STRINGS.addFacility, STRINGS.addFacilitySub, "/admin/facilities"],
    ["business-outline", STRINGS.approveFacilities, STRINGS.approveFacilitiesSub, "/admin/facilities"],
    ["trash-outline", STRINGS.removeFacility, STRINGS.removeFacilitySub, "/admin/facilities"],
    ["card-outline", STRINGS.viewPayouts, STRINGS.viewPayoutsSub, "/admin/transactions"],
    ["people-outline", STRINGS.viewUsers, STRINGS.viewUsersSub, "/admin/users"],
    ["receipt-outline", STRINGS.viewTransactions, STRINGS.viewTransactionsSub, "/admin/transactions"],
  ];

  return (
    <View style={[styles.quickActions, isMobile && styles.quickActionsMobile]}>
      <View style={styles.quickHeader}>
        <View>
          <Text style={styles.panelTitle}>{STRINGS.quickActions}</Text>
          <Text style={styles.panelSub}>{STRINGS.meta}</Text>
        </View>
      </View>
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {actionsList.map(([icon, title, sub, route]) => (
          <TouchableOpacity
            key={title}
            style={[styles.actionCard, isMobile && styles.actionCardMobile]}
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, isMobile && styles.actionIconMobile]}>
              <Ionicons name={icon} size={isMobile ? 15 : 18} color={SLATE_MID} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.actionTitle, isMobile && styles.actionTitleMobile]}>{title}</Text>
              <Text style={[styles.actionSub, isMobile && styles.actionSubMobile]} numberOfLines={1}>{sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={SLATE_LIGHT} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    backgroundColor: "#FBFCF9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    gap: 16,
    width: "100%",
  },
  quickHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  panelTitle: { color: SLATE_DARK, fontSize: 16, fontWeight: "700" },
  panelSub: { color: SLATE_LIGHT, fontSize: 11, fontWeight: "500", marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 240,
    minHeight: 64,
    borderRadius: 10,
    backgroundColor: "#EEF1EA",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF1EA",
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: { flex: 1 },
  actionTitle: { color: SLATE_DARK, fontSize: 13, fontWeight: "600" },
  actionSub: { color: SLATE_LIGHT, fontSize: 11, marginTop: 2, fontWeight: "500" },
  quickActionsMobile: {
    padding: 14,
    gap: 12,
  },
  gridMobile: {
    gap: 8,
  },
  actionCardMobile: {
    flexBasis: "100%",
    flexGrow: 0,
    width: "100%",
    minHeight: 56,
    padding: 10,
    gap: 8,
  },
  actionIconMobile: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  actionTitleMobile: {
    fontSize: 11,
  },
  actionSubMobile: {
    fontSize: 9,
    marginTop: 1,
  },
});

import { Ionicons } from "@expo/vector-icons";
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

type IconName = keyof typeof Ionicons.glyphMap;

export default function QuickActions() {
  const actionsList = [
    ["add-circle", "Add New Facility", "Pharmacy, Doctor or Hospital", BLUE],
    ["checkmark-circle", "Approve Facilities", "Review pending requests", GREEN],
    ["trash", "Remove Facility", "Delete inactive facilities", RED],
    ["time", "View Payouts", "Check pending payouts", ORANGE],
    ["document-text", "Generate Report", "Financial and facility reports", PURPLE],
    ["bar-chart", "View Analytics", "Detailed platform insights", CYAN],
  ];

  return (
    <View style={styles.quickActions}>
      <View style={styles.quickHeader}>
        <Text style={styles.panelTitle}>Quick Actions</Text>
        <Text style={styles.sectionMeta}>Common administrative workflows</Text>
      </View>
      <View style={styles.grid}>
        {actionsList.map(([icon, title, sub, color]) => (
          <TouchableOpacity
            key={title}
            style={styles.actionCard}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${color}10` }]}>
              <Ionicons
                name={icon as IconName}
                size={18}
                color={color as string}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSub}>{sub}</Text>
            </View>
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
    padding: 20,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    width: "100%",
  },
  quickHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  sectionMeta: { color: TEXT_MUTED, fontSize: 12, fontWeight: "600" },
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
    borderRadius: 12,
    backgroundColor: "#FAFBFD",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: { flex: 1 },
  actionTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: "800" },
  actionSub: { color: TEXT_MUTED, fontSize: 11, marginTop: 3, fontWeight: "500" },
});

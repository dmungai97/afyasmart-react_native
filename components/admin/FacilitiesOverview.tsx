import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const GREEN = "#10B981";
const BLUE = "#3B82F6";
const PURPLE = "#8B5CF6";
const BORDER = "#F1F5F9";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#64748B";

type IconName = keyof typeof Ionicons.glyphMap;

interface FacilitiesOverviewProps {
  totalFacilities: number;
  pharmacies: number;
  doctors: number;
  totalUsers: number;
  drugs: number;
  subscriptions: number;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-KE").format(value);

export default function FacilitiesOverview({
  totalFacilities,
  pharmacies,
  doctors,
  totalUsers,
  drugs,
  subscriptions,
}: FacilitiesOverviewProps) {
  return (
    <>
      {/* Facilities Donut Chart panel */}
      <View style={[styles.panel, styles.facilitiesPanel]}>
        <Text style={styles.panelTitle}>Facilities Distribution</Text>
        <Text style={styles.panelSub}>Provider networks registered</Text>
        <View style={styles.donutWrap}>
          <View style={styles.donutContainer}>
            <View style={styles.donut}>
              <Text style={styles.donutValue}>{formatNumber(totalFacilities)}</Text>
              <Text style={styles.donutLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: BLUE }]} />
              <View>
                <Text style={styles.legendLabel}>Pharmacies</Text>
                <Text style={styles.legendValue}>{formatNumber(pharmacies)}</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: PURPLE }]} />
              <View>
                <Text style={styles.legendLabel}>Doctors</Text>
                <Text style={styles.legendValue}>{formatNumber(doctors)}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.viewButtonText}>View All Facilities</Text>
          <Ionicons name="arrow-forward" size={14} color={BLUE} />
        </TouchableOpacity>
      </View>

      {/* Facility Status list panel */}
      <View style={[styles.panel, styles.statusPanel]}>
        <Text style={styles.panelTitle}>Platform Status</Text>
        <Text style={styles.panelSub}>Active system telemetry</Text>
        <View style={styles.statusList}>
          {[
            [
              "Total Facilities",
              formatNumber(totalFacilities),
              BLUE,
              "shield-checkmark-outline",
            ],
            ["Total Users", formatNumber(totalUsers), GREEN, "people-outline"],
            ["Drug Records", formatNumber(drugs), PURPLE, "medical-outline"],
            ["Subscriptions", formatNumber(subscriptions), "#F59E0B", "card-outline"],
          ].map(([label, value, color, icon]) => (
            <View key={label} style={styles.statusRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${color}10`, borderColor: `${color}25` }]}>
                <Ionicons
                  name={icon as IconName}
                  size={16}
                  color={color as string}
                />
              </View>
              <Text style={styles.statusLabel}>{label}</Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusValue, { color: color as string }]}>{value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 320,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  facilitiesPanel: { flexBasis: 360 },
  statusPanel: { flexBasis: 300 },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800" },
  panelSub: { color: TEXT_MUTED, fontSize: 11, fontWeight: "500", marginTop: 2, marginBottom: 12 },
  donutWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    gap: 16,
  },
  donutContainer: {
    padding: 8,
    borderRadius: 72,
    backgroundColor: "#FAFBFD",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  donut: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 14,
    borderColor: BLUE,
    borderLeftColor: PURPLE,
    borderTopColor: PURPLE,
    borderBottomColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  donutValue: { color: TEXT_DARK, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  donutLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginTop: 1 },
  legend: { gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: "600" },
  legendValue: { color: TEXT_DARK, fontSize: 15, fontWeight: "900", marginTop: 1 },
  viewButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.15)",
    marginTop: 14,
  },
  viewButtonText: { color: BLUE, fontSize: 12, fontWeight: "800" },
  statusList: { gap: 8 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FAFBFD",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusLabel: { color: "#334155", fontSize: 12, fontWeight: "700", flex: 1 },
  statusBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusValue: { fontSize: 12, fontWeight: "800" },
});

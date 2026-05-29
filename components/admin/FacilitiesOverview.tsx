import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SLATE_DARK = "#1E293B";
const SLATE_MID = "#475569";
const SLATE_LIGHT = "#94A3B8";
const BORDER = "#E2E8F0";

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
              <View style={[styles.dot, { backgroundColor: SLATE_DARK }]} />
              <View>
                <Text style={styles.legendLabel}>Pharmacies</Text>
                <Text style={styles.legendValue}>{formatNumber(pharmacies)}</Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: SLATE_LIGHT }]} />
              <View>
                <Text style={styles.legendLabel}>Doctors</Text>
                <Text style={styles.legendValue}>{formatNumber(doctors)}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.viewButtonText}>View All Facilities</Text>
          <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
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
              "shield-checkmark-outline",
            ],
            ["Total Users", formatNumber(totalUsers), "people-outline"],
            ["Drug Records", formatNumber(drugs), "medical-outline"],
            ["Subscriptions", formatNumber(subscriptions), "card-outline"],
          ].map(([label, value, icon], index) => (
            <View key={label} style={[styles.statusRow, index === 3 && { borderBottomWidth: 0 }]}>
              <Ionicons
                name={icon as IconName}
                size={16}
                color={SLATE_MID}
                style={styles.statusIcon}
              />
              <Text style={styles.statusLabel}>{label}</Text>
              <Text style={styles.statusValue}>{value}</Text>
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
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  facilitiesPanel: { flexBasis: 360 },
  statusPanel: { flexBasis: 300 },
  panelTitle: { color: SLATE_DARK, fontSize: 16, fontWeight: "700" },
  panelSub: { color: SLATE_LIGHT, fontSize: 11, fontWeight: "500", marginTop: 2, marginBottom: 12 },
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
    borderColor: BORDER,
  },
  donut: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: SLATE_DARK,
    borderLeftColor: SLATE_LIGHT,
    borderTopColor: SLATE_LIGHT,
    borderBottomColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  donutValue: { color: SLATE_DARK, fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  donutLabel: { color: SLATE_LIGHT, fontSize: 10, fontWeight: "600", textTransform: "uppercase", marginTop: 1 },
  legend: { gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: SLATE_MID, fontSize: 11, fontWeight: "500" },
  legendValue: { color: SLATE_DARK, fontSize: 15, fontWeight: "700", marginTop: 1 },
  viewButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 14,
    paddingVertical: 8,
  },
  viewButtonText: { color: "#3B82F6", fontSize: 13, fontWeight: "600" },
  statusList: {},
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 12,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusLabel: { color: SLATE_DARK, fontSize: 13, fontWeight: "500", flex: 1 },
  statusValue: { color: SLATE_MID, fontSize: 13, fontWeight: "600" },
});

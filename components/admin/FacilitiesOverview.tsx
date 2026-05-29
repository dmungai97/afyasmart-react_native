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
        <View style={styles.donutWrap}>
          <View style={styles.donut}>
            <Text style={styles.donutValue}>{formatNumber(totalFacilities)}</Text>
            <Text style={styles.donutLabel}>Total</Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: BLUE }]} />
              <Text style={styles.legendText}>
                Pharmacies: {formatNumber(pharmacies)}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: PURPLE }]} />
              <Text style={styles.legendText}>
                Doctors: {formatNumber(doctors)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.viewButtonText}>View All Facilities</Text>
          <Ionicons name="arrow-forward" size={16} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>

      {/* Facility Status list panel */}
      <View style={[styles.panel, styles.statusPanel]}>
        <Text style={styles.panelTitle}>Platform Status</Text>
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
            ["Subscriptions", formatNumber(subscriptions), GREEN, "card-outline"],
          ].map(([label, value, color, icon]) => (
            <View key={label} style={styles.statusRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${color}10` }]}>
                <Ionicons
                  name={icon as IconName}
                  size={18}
                  color={color as string}
                />
              </View>
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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    flexGrow: 1,
    flexBasis: 320,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  facilitiesPanel: { flexBasis: 360 },
  statusPanel: { flexBasis: 300 },
  panelTitle: { color: TEXT_DARK, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  donutWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 14,
  },
  donut: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 16,
    borderColor: GREEN,
    borderLeftColor: BLUE,
    borderTopColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  donutValue: { color: TEXT_DARK, fontSize: 22, fontWeight: "900" },
  donutLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: "600", marginTop: 2 },
  legend: { gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: "#334155", fontSize: 13, fontWeight: "700" },
  viewButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
  },
  viewButtonText: { color: TEXT_DARK, fontSize: 12, fontWeight: "700" },
  statusList: { marginTop: 10 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusLabel: { color: "#334155", fontSize: 13, fontWeight: "700", flex: 1 },
  statusValue: { color: TEXT_DARK, fontSize: 14, fontWeight: "800" },
});

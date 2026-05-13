import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { buildDiagnosisFromSymptoms, useDiagnosisStore } from '../../src/store/diagnosisStore';

const TEAL = '#0B6E6E';
const GREEN = '#16A34A';
const RED = '#DC2626';
const ORANGE = '#D97706';

export default function DiagnosisResultsScreen() {
  const router = useRouter();
  const storedDiagnosis = useDiagnosisStore((s) => s.pendingDiagnosis);
  const diagnosis = storedDiagnosis ?? buildDiagnosisFromSymptoms('fever, headache, body weakness');
  const urgencyColor = diagnosis.urgency === 'High' ? RED : diagnosis.urgency === 'Medium' ? ORANGE : GREEN;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="checkmark-circle" size={34} color="#4ADE80" />
        </View>
        <Text style={styles.headerTitle}>Your Diagnosis Is Ready</Text>
        <Text style={styles.headerSub}>Unlocked from your prepared symptom analysis</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Symptoms analysed</Text>
          <Text style={styles.symptomsText}>{diagnosis.symptoms}</Text>
          <Text style={styles.summaryText}>{diagnosis.summary}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Possible Conditions</Text>
            <Text style={styles.cardLabel}>Probability</Text>
          </View>

          {diagnosis.conditions.map((condition) => (
            <View key={condition.name} style={styles.conditionRow}>
              <View style={[styles.conditionDot, { backgroundColor: condition.color }]} />
              <View style={styles.conditionInfo}>
                <Text style={styles.conditionName}>{condition.name}</Text>
                <Text style={styles.conditionLevel}>{condition.level} match</Text>
                <View style={styles.probTrack}>
                  <View style={[styles.probFill, { width: `${condition.probability}%`, backgroundColor: condition.color }]} />
                </View>
              </View>
              <Text style={[styles.conditionPercent, { color: condition.color }]}>
                {condition.probability}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.urgencyCard}>
          <View style={[styles.urgencyIcon, { backgroundColor: `${urgencyColor}18` }]}>
            <Ionicons name="alert-circle" size={24} color={urgencyColor} />
          </View>
          <View style={styles.urgencyInfo}>
            <Text style={styles.urgencyTitle}>Urgency Level: {diagnosis.urgency}</Text>
            <Text style={styles.urgencyText}>
              {diagnosis.urgency === 'High'
                ? 'Seek medical attention as soon as possible, especially if symptoms are worsening.'
                : 'Monitor symptoms closely and get care if they persist or become severe.'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommended Next Steps</Text>
          {diagnosis.medications.map((med) => (
            <View key={med.name} style={styles.medRow}>
              <View style={styles.medIcon}>
                <Ionicons name="medical" size={18} color={TEAL} />
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medNote}>{med.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionsCard}>
          <Text style={[styles.cardTitle, styles.actionsCardTitle]}>Get Care Nearby</Text>
          <Text style={styles.actionSub}>Find hospitals, clinics, pharmacies, and doctors near you.</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/map' as any)}>
              <Ionicons name="location" size={17} color="#fff" />
              <Text style={styles.actionBtnText}>See nearby services</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/chat' as any)}>
              <Ionicons name="chatbubble-ellipses" size={17} color={TEAL} />
              <Text style={styles.secondaryBtnText}>Continue AI chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          AfyaSmart provides health guidance, not a final diagnosis. For emergencies, visit the nearest hospital immediately.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: TEAL,
    paddingTop: 56,
    paddingBottom: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 118, gap: 14 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, color: '#1a1a1a', fontWeight: '800', marginBottom: 10 },
  cardLabel: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase' },
  symptomsText: { fontSize: 16, color: '#1a1a1a', fontWeight: '800', marginTop: 6, marginBottom: 8 },
  summaryText: { fontSize: 13, color: '#666', lineHeight: 20 },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#F3F4F6' },
  conditionDot: { width: 10, height: 10, borderRadius: 5 },
  conditionInfo: { flex: 1 },
  conditionName: { fontSize: 14, color: '#1a1a1a', fontWeight: '800' },
  conditionLevel: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 7 },
  conditionPercent: { fontSize: 17, fontWeight: '900' },
  probTrack: { height: 6, borderRadius: 3, backgroundColor: '#EEF2F2', overflow: 'hidden' },
  probFill: { height: 6, borderRadius: 3 },
  urgencyCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    gap: 12,
  },
  urgencyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  urgencyInfo: { flex: 1 },
  urgencyTitle: { fontSize: 15, color: '#1a1a1a', fontWeight: '900', marginBottom: 4 },
  urgencyText: { fontSize: 13, color: '#6B4E16', lineHeight: 19 },
  medRow: { flexDirection: 'row', gap: 12, paddingVertical: 11, borderTopWidth: 0.5, borderTopColor: '#F3F4F6' },
  medIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E6F4F4', alignItems: 'center', justifyContent: 'center' },
  medInfo: { flex: 1 },
  medName: { fontSize: 14, color: '#1a1a1a', fontWeight: '800' },
  medNote: { fontSize: 12, color: '#777', lineHeight: 18, marginTop: 2 },
  actionsCard: { backgroundColor: TEAL, borderRadius: 16, padding: 16, gap: 4 },
  actionsCardTitle: { color: '#fff' },
  actionSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  actionGrid: { gap: 10 },
  actionBtn: { backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  secondaryBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryBtnText: { color: TEAL, fontWeight: '900', fontSize: 14 },
  disclaimer: { fontSize: 11, color: '#888', lineHeight: 17, textAlign: 'center', paddingHorizontal: 8 },
});

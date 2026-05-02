import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { searchDrugs } from '../../src/services/drug.service';

const TEAL   = '#0B6E6E';
const PURPLE = '#4F3FB5';

type Drug = {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  uses: string;
  dosage: string;
  side_effects: string;
  pregnancy_safe: boolean;
  alcohol_safe: boolean;
  lactation_safe: boolean;
  prescription_required: string;
};

const CATEGORIES = ['All', 'Pain Relief', 'Antibiotics', 'Vitamins', 'Antihistamine', 'Other'];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Pain Relief':   'fitness-outline',
  'Antibiotics':   'bug-outline',
  'Vitamins':      'leaf-outline',
  'Antihistamine': 'water-outline',
  'Other':         'medical-outline',
};

// Drug form type badge color
const FORM_COLOR: Record<string, { bg: string; text: string }> = {
  Tablet:  { bg: '#E8F4FE', text: '#1565C0' },
  Capsule: { bg: '#F3E8FF', text: '#6A1B9A' },
  Syrup:   { bg: '#E8F5E9', text: '#2E7D32' },
  Injection:{ bg: '#FFF3E0', text: '#E65100' },
};

function getFormType(drug: Drug): string {
  const text = (drug.dosage + drug.uses).toLowerCase();
  if (text.includes('capsule')) return 'Capsule';
  if (text.includes('syrup'))   return 'Syrup';
  if (text.includes('inject'))  return 'Injection';
  return 'Tablet';
}

function getRating(drug: Drug): string {
  // Deterministic pseudo-rating based on id
  const base = 4.0 + (drug.id % 10) * 0.09;
  return base.toFixed(1);
}

export default function DrugsScreen() {
  const token = useAuthStore((s) => s.token);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<Drug[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Drug | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchDrugs(q.trim(), token!);
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === 'All'
    ? results
    : results.filter(d =>
        d.category?.toLowerCase().includes(activeTab.toLowerCase())
      );

  const SafetyBadge = ({ label, safe }: { label: string; safe: boolean }) => (
    <View style={[styles.safetyBadge, safe ? styles.safetyBadgeSafe : styles.safetyBadgeUnsafe]}>
      <Text style={[styles.safetyBadgeText, safe ? styles.safetyTextSafe : styles.safetyTextUnsafe]}>
        {safe ? '✓' : '✗'} {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Drugs Database</Text>
            <Text style={styles.headerSub}>Search medicines & info</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="medical" size={22} color="#fff" />
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category Chips ── */}
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeTab === cat && styles.chipActive]}
              onPress={() => setActiveTab(cat)}
            >
              <Text style={[styles.chipText, activeTab === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Searching medicines...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{filtered.length} medicines found</Text>
                {activeTab !== 'All' && (
                  <Text style={styles.resultsFilter}>in {activeTab}</Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              {searched ? (
                <>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="search-outline" size={36} color="#ccc" />
                  </View>
                  <Text style={styles.emptyTitle}>No medicines found</Text>
                  <Text style={styles.emptySub}>Try &quot;{query}&quot; with a different spelling</Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="medical-outline" size={36} color="#ccc" />
                  </View>
                  <Text style={styles.emptyTitle}>Search for a medicine</Text>
                  <Text style={styles.emptySub}>Enter a drug name above to get started</Text>
                  {/* Popular suggestions */}
                  <Text style={styles.suggestLabel}>Popular searches</Text>
                  <View style={styles.suggestions}>
                    {['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine'].map(s => (
                      <TouchableOpacity
                        key={s}
                        style={styles.suggestion}
                        onPress={() => { setQuery(s); handleSearch(s); }}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const form   = getFormType(item);
            const rating = getRating(item);
            const formStyle = FORM_COLOR[form] ?? FORM_COLOR.Tablet;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelected(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  {/* Drug icon */}
                  <View style={styles.drugIconWrap}>
                    <Ionicons name="medical" size={28} color={TEAL} />
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.drugName}>{item.name}</Text>
                    <View style={[styles.formBadge, { backgroundColor: formStyle.bg }]}>
                      <Text style={[styles.formBadgeText, { color: formStyle.text }]}>{form}</Text>
                    </View>
                  </View>
                  <Text style={styles.drugGeneric}>{item.generic_name}</Text>
                  <Text style={styles.drugUses} numberOfLines={1}>{item.uses}</Text>
                  <View style={styles.cardFooterRow}>
                    <View style={styles.ratingWrap}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                    <Text style={styles.rxLabel}>
                      {item.prescription_required === 'Yes' ? '📋 Rx' : '🟢 OTC'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" style={styles.cardArrow} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Detail Modal ── */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Drug Hero */}
              <View style={styles.drugHero}>
                <View style={styles.drugHeroIcon}>
                  <Ionicons name="medical" size={40} color={TEAL} />
                </View>
                <View style={styles.drugHeroInfo}>
                  <Text style={styles.modalName}>{selected.name}</Text>
                  <Text style={styles.modalGeneric}>{selected.generic_name}</Text>
                  <View style={styles.modalBadgeRow}>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{selected.category}</Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingPillText}>{getRating(selected)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Info Cards */}
              {[
                { title: 'Uses', icon: 'information-circle-outline' as const, text: selected.uses },
                { title: 'Dosage',  icon: 'time-outline' as const, text: selected.dosage },
                { title: 'Side Effects', icon: 'warning-outline' as const, text: selected.side_effects },
              ].map(sec => (
                <View key={sec.title} style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name={sec.icon} size={16} color={TEAL} />
                    <Text style={styles.infoCardTitle}>{sec.title}</Text>
                  </View>
                  <Text style={styles.infoCardText}>{sec.text}</Text>
                </View>
              ))}

              {/* Safety */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={TEAL} />
                  <Text style={styles.infoCardTitle}>Safety Information</Text>
                </View>
                <View style={styles.safetyRow}>
                  <SafetyBadge label="Pregnancy" safe={selected.pregnancy_safe} />
                  <SafetyBadge label="Alcohol"   safe={selected.alcohol_safe} />
                  <SafetyBadge label="Lactation" safe={selected.lactation_safe} />
                </View>
              </View>

              {/* Prescription */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="document-text-outline" size={16} color={TEAL} />
                  <Text style={styles.infoCardTitle}>Prescription</Text>
                </View>
                <Text style={styles.infoCardText}>
                  {selected.prescription_required === 'Yes'
                    ? '📋 Prescription required from a licensed doctor'
                    : '🟢 Available over the counter (OTC)'}
                </Text>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimer}>
                <Ionicons name="warning-outline" size={14} color="#92400E" />
                <Text style={styles.disclaimerText}>
                  This information is for reference only. Always consult a licensed pharmacist or doctor before taking any medication.
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header
  header: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon:  { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },

  // Chips
  chipsWrap: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  chips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: TEAL, borderColor: TEAL },
  chipText:   { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  // List
  list: { padding: 16, paddingBottom: 32, gap: 10 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  resultsCount: { fontSize: 13, color: '#888', fontWeight: '500' },
  resultsFilter: { fontSize: 13, color: TEAL, fontWeight: '600' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  suggestLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 24, marginBottom: 10 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  suggestion: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  suggestionText: { fontSize: 13, color: TEAL, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  cardLeft: { marginRight: 12 },
  drugIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(11,110,110,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  drugName:   { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
  formBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  formBadgeText: { fontSize: 11, fontWeight: '600' },
  drugGeneric: { fontSize: 11, color: '#888', marginBottom: 3 },
  drugUses:    { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 6 },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  rxLabel:    { fontSize: 12, color: '#666' },
  cardArrow:  { marginLeft: 4 },

  // Loading
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 14 },

  // Modal
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalContent: { padding: 20, paddingBottom: 40 },

  drugHero: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  drugHeroIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(11,110,110,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  drugHeroInfo: { flex: 1 },
  modalName:    { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  modalGeneric: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 8 },
  modalBadgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  categoryPill: {
    backgroundColor: 'rgba(11,110,110,0.1)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  categoryPillText: { fontSize: 11, color: TEAL, fontWeight: '600' },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
  },
  ratingPillText: { fontSize: 11, fontWeight: '700', color: '#D97706' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  infoCardTitle:  { fontSize: 13, fontWeight: '700', color: TEAL, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCardText:   { fontSize: 14, color: '#444', lineHeight: 22 },

  safetyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  safetyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  safetyBadgeSafe:   { backgroundColor: '#E8F5E9' },
  safetyBadgeUnsafe: { backgroundColor: '#FFEBEE' },
  safetyBadgeText:   { fontSize: 12, fontWeight: '600' },
  safetyTextSafe:    { color: '#2E7D32' },
  safetyTextUnsafe:  { color: '#C62828' },

  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#FFE082',
    alignItems: 'flex-start',
  },
  disclaimerText: { fontSize: 12, color: '#795548', lineHeight: 18, flex: 1 },
});
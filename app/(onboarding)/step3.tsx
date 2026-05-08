import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const TEAL = '#0B6E6E';

const CONCERNS = [
  { label: 'Frequent illness', value: 'frequent_illness' },
  { label: 'Chronic conditions', value: 'chronic_conditions' },
  { label: 'Weight issues', value: 'weight_issues' },
  { label: 'Stress & anxiety', value: 'stress_anxiety' },
  { label: 'Something else', value: 'something_else' },
];

export default function Step3Screen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [selected, setSelected] = useState<string[]>([
    'frequent_illness',
    'weight_issues',
    'stress_anxiety',
  ]);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Back + Progress */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.progressRow}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      {/* Heading */}
      <Text style={styles.heading}>What worries you most{'\n'}about your health?</Text>
      <Text style={styles.subtext}>You can choose more than one</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {CONCERNS.map((item) => {
          const isSelected = selected.includes(item.value);
          return (
            <TouchableOpacity
              key={item.value}
              style={styles.optionRow}
              onPress={() => toggle(item.value)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                )}
              </View>
              <Text style={styles.optionLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Finish Button */}
      <TouchableOpacity
        style={[styles.finishButton, selected.length === 0 && styles.finishButtonDisabled]}
        onPress={async () => {
        if (selected.length > 0) {
            await completeOnboarding();
            router.replace('/(tabs)' as any);
        }
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.finishText}>Finish</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backBtn: {
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 22,
    color: '#333',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  dotActive: {
    backgroundColor: TEAL,
    width: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#777',
    marginBottom: 28,
  },
  optionsContainer: {
    flex: 1,
    gap: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  optionLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  finishButton: {
    backgroundColor: TEAL,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  finishButtonDisabled: {
    backgroundColor: '#b0cece',
  },
  finishText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
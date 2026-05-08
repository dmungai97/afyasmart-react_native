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

const TEAL = '#0B6E6E';

const MOODS = [
  { label: 'Good', emoji: '😊', value: 'good' },
  { label: 'Okay', emoji: '😐', value: 'okay' },
  { label: 'Not well', emoji: '😟', value: 'not_well' },
  { label: 'Bad', emoji: '😣', value: 'bad' },
];

export default function Step2Screen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Back + Progress */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.progressRow}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      {/* Heading */}
      <Text style={styles.heading}>How are you{'\n'}feeling today?</Text>

      {/* Mood Grid */}
      <View style={styles.grid}>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            style={[
              styles.moodCard,
              selected === mood.value && styles.moodCardSelected,
            ]}
            onPress={() => setSelected(mood.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                selected === mood.value && styles.moodLabelSelected,
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, !selected && styles.nextButtonDisabled]}
        onPress={() => selected && router.push('/(onboarding)/step3')}
        activeOpacity={0.85}
      >
        <Text style={styles.nextText}>Next</Text>
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
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 34,
    marginBottom: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
    flex: 1,
  },
  moodCard: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  moodCardSelected: {
    borderColor: TEAL,
    backgroundColor: '#e8f4f4',
  },
  emoji: {
    fontSize: 36,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  moodLabelSelected: {
    color: TEAL,
  },
  nextButton: {
    backgroundColor: TEAL,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  nextButtonDisabled: {
    backgroundColor: '#b0cece',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
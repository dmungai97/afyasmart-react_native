import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosisStore } from '@/src/store/diagnosisStore';

const TEAL      = '#0B6E6E';
const TEAL_DARK = '#063D3D';
const BG        = '#F0F7F7';

const STEPS = [
  {
    id:       'age',
    question: 'What is your age group?',
    emoji:    '🎂',
    options:  ['Under 18', '18 – 30', '31 – 45', '46 – 60', 'Over 60'],
  },
  {
    id:       'feeling',
    question: 'How are you feeling today?',
    emoji:    '💭',
    options:  ['Very unwell', 'Unwell', 'Okay', 'Good', 'Great'],
  },
  {
    id:       'concern',
    question: 'What worries you most about your health?',
    emoji:    '❤️',
    options:  [
      'Recent symptoms',
      'Chronic condition',
      'Mental health',
      'General check-up',
      'Medication advice',
    ],
  },
];

export function HealthCheckScreen() {
  const router             = useRouter();
  const setHealthCheckAnswers = useDiagnosisStore((s) => s.setHealthCheckAnswers);

  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const slideAnim             = useRef(new Animated.Value(0)).current;

  const current  = STEPS[step];
  const progress = (step + 1) / STEPS.length;

  const animateNext = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,   duration: 0,   useNativeDriver: true }),
    ]).start(callback);
  };

  const handleSelect = (option: string) => {
    const updated = { ...answers, [current.id]: option };
    setAnswers(updated);

    if (step < STEPS.length - 1) {
      animateNext(() => {
        Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }).start(() =>
          Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start()
        );
        setStep(step + 1);
      });
    } else {
      handleFinish(updated);
    }
  };

  const handleFinish = async (finalAnswers: Record<string, string>) => {
    setHealthCheckAnswers({
      age: finalAnswers.age,
      feeling: finalAnswers.feeling,
      concern: finalAnswers.concern,
    });
    router.push('/(onboarding)/symptom-chat' as any);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={TEAL_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Health Check</Text>
        <Text style={styles.stepLabel}>{step + 1}/{STEPS.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Question */}
        <Animated.View style={[styles.questionSection, { transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.question}>{current.question}</Text>
          <Text style={styles.questionHint}>Select one to continue</Text>
        </Animated.View>

        {/* Options */}
        <Animated.View style={[styles.optionsGrid, { transform: [{ translateX: slideAnim }] }]}>
          {current.options.map((option) => {
            const selected = answers[current.id] === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.75}
              >
                {selected && (
                  <Ionicons name="checkmark-circle" size={18} color={TEAL} style={styles.optionCheck} />
                )}
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Personalisation note */}
        <View style={styles.personalNote}>
          <Ionicons name="sparkles" size={14} color={TEAL} />
          <Text style={styles.personalNoteText}>
            Your answers help us personalise your health analysis
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn:     { padding: 8 },
  headerTitle: { color: TEAL_DARK, fontSize: 16, fontWeight: '700' },
  stepLabel:   { color: TEAL, fontSize: 14, fontWeight: '600' },
  progressTrack: {
    height: 4, backgroundColor: '#D1E8E8',
    marginHorizontal: 20, borderRadius: 2, marginBottom: 8,
  },
  progressFill: {
    height: '100%', backgroundColor: TEAL, borderRadius: 2,
  },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  questionSection: { alignItems: 'center', marginBottom: 32 },
  emoji:           { fontSize: 48, marginBottom: 16 },
  question: {
    color: TEAL_DARK, fontSize: 22, fontWeight: '800',
    textAlign: 'center', lineHeight: 30, marginBottom: 8,
  },
  questionHint: { color: '#999', fontSize: 13 },
  optionsGrid: { gap: 12, marginBottom: 32 },
  optionCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 18, paddingHorizontal: 20,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    flexDirection: 'row', alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: TEAL, backgroundColor: '#E8F4F4',
  },
  optionCheck:         { marginRight: 10 },
  optionText:          { color: '#444', fontSize: 15, fontWeight: '500', flex: 1 },
  optionTextSelected:  { color: TEAL_DARK, fontWeight: '700' },
  personalNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E0F0F0', borderRadius: 10,
    padding: 12,
  },
  personalNoteText: { color: TEAL, fontSize: 12, flex: 1, lineHeight: 18 },
});

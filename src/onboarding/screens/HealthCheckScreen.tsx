import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiagnosisStore } from '@/src/store/diagnosisStore';
import { PAPER, INK, INK_MUTED, INK_FAINT, ACCENT, RULE, RULE_STRONG } from '../theme';

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
      <StatusBar barStyle="dark-content" backgroundColor={PAPER} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={INK} />
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
        <Animated.View style={[styles.optionsList, { transform: [{ translateX: slideAnim }] }]}>
          {current.options.map((option) => {
            const selected = answers[current.id] === option;
            return (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                onPress={() => handleSelect(option)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionRule, selected && styles.optionRuleSelected]} />
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {selected && (
                  <Ionicons name="checkmark" size={18} color={ACCENT} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Personalisation note */}
        <View style={styles.personalNote}>
          <Ionicons name="sparkles-outline" size={14} color={INK_FAINT} />
          <Text style={styles.personalNoteText}>
            Your answers help us personalise your health analysis
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backBtn:     { padding: 8, marginLeft: -8 },
  headerTitle: { color: INK, fontSize: 16, fontWeight: '600' },
  stepLabel:   { color: INK_FAINT, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  progressTrack: {
    height: 2, backgroundColor: RULE,
    marginHorizontal: 20, marginBottom: 8,
  },
  progressFill: {
    height: '100%', backgroundColor: INK,
  },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  questionSection: { alignItems: 'center', marginBottom: 32 },
  emoji:           { fontSize: 44, marginBottom: 16 },
  question: {
    color: INK, fontSize: 21, fontWeight: '600',
    textAlign: 'center', lineHeight: 28, marginBottom: 8,
  },
  questionHint: { color: INK_FAINT, fontSize: 13 },
  optionsList: {
    marginBottom: 32,
    borderTopWidth: 1,
    borderTopColor: RULE,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: RULE,
  },
  optionRule: {
    width: 2, height: 18,
    backgroundColor: RULE_STRONG,
    marginRight: 14,
  },
  optionRuleSelected: { backgroundColor: ACCENT },
  optionText:          { color: INK_MUTED, fontSize: 15, flex: 1 },
  optionTextSelected:  { color: INK, fontWeight: '600' },
  personalNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 16,
    borderTopWidth: 1, borderTopColor: RULE,
  },
  personalNoteText: { color: INK_FAINT, fontSize: 12, flex: 1, lineHeight: 18 },
});

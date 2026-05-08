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

const AGE_GROUPS = ['Under 18', '18 - 30', '31 - 45', '46 - 60', '60+'];

export default function Step1Screen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('18 - 30');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Progress dots */}
      <View style={styles.progressRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Heading */}
      <Text style={styles.heading}>{"Let's get to know"}{'\n'}{"you better 👋"}</Text>
      <Text style={styles.subtext}>This helps us give you accurate health insights</Text>

      {/* Question */}
      <Text style={styles.question}>What&apos;s your age group?</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {AGE_GROUPS.map((age) => (
          <TouchableOpacity
            key={age}
            style={[
              styles.option,
              selected === age && styles.optionSelected,
            ]}
            onPress={() => setSelected(age)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.optionText,
                selected === age && styles.optionTextSelected,
              ]}
            >
              {age}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('/(onboarding)/step2')}
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
    paddingTop: 20,
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
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#777',
    marginBottom: 28,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 14,
  },
  optionsContainer: {
    gap: 10,
    flex: 1,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  optionSelected: {
    backgroundColor: TEAL,
    borderColor: TEAL,
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: TEAL,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
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


const TEAL_DARK = '#084F4F';
const GREEN = '#4CAF50';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Logo + Brand */}
      <View style={styles.brandRow}>
        <Ionicons name="heart" size={22} color={GREEN} />
        <Text style={styles.brandText}>AfyaSmart</Text>
      </View>

      {/* Robot Illustration Placeholder */}
      <View style={styles.illustrationContainer}>
        <View style={styles.robotCircle}>
          <Ionicons name="hardware-chip-outline" size={80} color="#ffffff" />
        </View>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>Your AI{'\n'}Health Assistant</Text>
      <Text style={styles.subtext}>
        Find out what your symptoms{'\n'}mean in 60 seconds
      </Text>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => router.push('/(auth)/login' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>Start Free Health Check</Text>
      </TouchableOpacity>
      {/* Register link */}
    <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
    <Text style={styles.registerText}>
        New here? <Text style={{ fontWeight: '700', color: '#fff' }}>Create account</Text>
    </Text>
    </TouchableOpacity>

      {/* Trust badge */}
      <View style={styles.trustRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#a0c4c4" />
        <Text style={styles.trustText}>Trusted. Private. Secure.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TEAL_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  illustrationContainer: {
    marginBottom: 36,
  },
  robotCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 14,
  },
  subtext: {
    fontSize: 15,
    color: '#a0c4c4',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  ctaButton: {
    backgroundColor: GREEN,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: '#a0c4c4',
  },
  registerText: {
  fontSize: 14,
  color: '#a0c4c4',
  marginBottom: 20,
},
});
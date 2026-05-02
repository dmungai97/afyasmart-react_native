import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loginUser } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/authStore';

const TEAL      = '#0B6E6E';
const TEAL_DARK = '#063D3D';
const TEAL_MID  = '#0D8A8A';
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router    = useRouter();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);
  const isSubmitting = useRef(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      await setAuth(data.token, data.user);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    // FIX 1: behavior is 'padding' for iOS only, undefined for Android
    // Using 'height' on Android causes the keyboard to flash and dismiss
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* ── Decorative Background ── */}
      <View style={styles.background}>
        <View style={styles.bgBase} />

        {/* Decorative circles */}
        <View style={[styles.circle, { width: 320, height: 320, top: -80, right: -80, opacity: 0.12 }]} />
        <View style={[styles.circle, { width: 200, height: 200, top: 60, left: -60, opacity: 0.08 }]} />
        <View style={[styles.circle, { width: 150, height: 150, top: 180, right: 20, opacity: 0.06 }]} />

        {/* Medical cross pattern */}
        <View style={styles.crossPatternWrap}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.crossPattern, {
              top: 40 + i * 60,
              left: 20 + (i % 2) * 80,
              opacity: 0.04 + i * 0.01,
            }]}>
              <View style={styles.crossPatternV} />
              <View style={styles.crossPatternH} />
            </View>
          ))}
        </View>

        {/* Heartbeat line */}
        <View style={styles.heartbeatLine} />
      </View>

      {/* FIX 2: keyboardDismissMode="none" prevents scroll from dismissing keyboard
               keyboardShouldPersistTaps="handled" ensures taps on buttons work while keyboard is open */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Brand Section ── */}
        <View style={styles.top}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoRing2}>
              <View style={styles.logoRing1}>
                <View style={styles.logoCore}>
                  <View style={styles.crossV} />
                  <View style={styles.crossH} />
                </View>
              </View>
            </View>
            {/* Pulse dot */}
            <View style={styles.pulseDot} />
          </View>

          <Text style={styles.appName}>AfyaSmart</Text>
          <Text style={styles.tagline}>Your Personal Health Companion</Text>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          {/* Card top accent */}
          <View style={styles.cardAccent} />

          <Text style={styles.cardTitle}>Welcome back 👋</Text>
          <Text style={styles.cardSub}>Sign in to access your health dashboard</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email address</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
              <View style={[styles.inputIconWrap, emailFocused && styles.inputIconWrapFocused]}>
                <Ionicons name="mail-outline" size={16} color={emailFocused ? '#fff' : '#aaa'} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#bbb"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                // FIX 4: Wrap onBlur in requestAnimationFrame to prevent
                // state update from immediately re-rendering and dismissing keyboard
                onBlur={() => requestAnimationFrame(() => setEmailFocused(false))}
              />
              {email.length > 0 && (
                <Ionicons name="checkmark-circle" size={18} color={TEAL} />
              )}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputWrap, pwFocused && styles.inputWrapFocused]}>
              <View style={[styles.inputIconWrap, pwFocused && styles.inputIconWrapFocused]}>
                <Ionicons name="lock-closed-outline" size={16} color={pwFocused ? '#fff' : '#aaa'} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#bbb"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwFocused(true)}
                // FIX 4: Same requestAnimationFrame fix for password field
                onBlur={() => requestAnimationFrame(() => setPwFocused(false))}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#bbb"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign in */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.signInBtnInner}>
              {loading ? (
                <>
                  <Ionicons name="reload-outline" size={18} color="#fff" />
                  <Text style={styles.signInBtnText}>Signing in...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </View>
            {/* Button shine effect */}
            <View style={styles.btnShine} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={20} color="#000" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Register */}
          <TouchableOpacity
            style={styles.registerRow}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <Text style={styles.registerLink}>Create one →</Text>
          </TouchableOpacity>

          {/* Trust badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={12} color={TEAL} />
              <Text style={styles.trustText}>Secure</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={12} color={TEAL} />
              <Text style={styles.trustText}>Private</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="people" size={12} color={TEAL} />
              <Text style={styles.trustText}>Kenya-based</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          By signing in, you agree to our Terms &amp; Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Background
  background: { ...StyleSheet.absoluteFillObject },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TEAL_DARK,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  crossPatternWrap: { ...StyleSheet.absoluteFillObject },
  crossPattern: { position: 'absolute', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  crossPatternV: { position: 'absolute', width: 2, height: 14, backgroundColor: '#fff', borderRadius: 1 },
  crossPatternH: { position: 'absolute', width: 14, height: 2, backgroundColor: '#fff', borderRadius: 1 },
  heartbeatLine: {
    position: 'absolute',
    bottom: '35%',
    left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  scroll: { flexGrow: 1 },

  // Top
  top: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },

  logoWrap: { marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  logoRing2: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoRing1: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoCore: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  crossV: { position: 'absolute', width: 5, height: 28, backgroundColor: '#fff', borderRadius: 3 },
  crossH: { position: 'absolute', width: 28, height: 5, backgroundColor: '#fff', borderRadius: 3 },
  pulseDot: {
    position: 'absolute',
    bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 2, borderColor: TEAL_DARK,
  },

  appName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginBottom: 24,
    letterSpacing: 0.3,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 0,
    position: 'relative',
  },
  statItem: { flex: 1, alignItems: 'center', position: 'relative' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' },
  statDivider: {
    position: 'absolute',
    right: 0, top: 4, bottom: 4,
    width: 1, backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 16,
    flex: 1,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
    backgroundColor: TEAL,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4, marginTop: 8 },
  cardSub:   { fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 20 },

  // Input
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingRight: 14,
    height: 54,
    gap: 10,
  },
  inputWrapFocused: {
    borderColor: TEAL,
    backgroundColor: '#fff',
    shadowColor: TEAL,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inputIconWrap: {
    width: 54, height: 54,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: '#F0F0F0',
  },
  inputIconWrapFocused: {
    backgroundColor: TEAL,
    borderRightColor: TEAL,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  input: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  eyeBtn: { padding: 4 },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { fontSize: 13, color: TEAL, fontWeight: '600' },

  // Sign in button
  signInBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: TEAL,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  signInBtnDisabled: { opacity: 0.6 },
  signInBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 2 },
  signInBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  btnShine: {
    position: 'absolute',
    top: 0, left: '-30%',
    width: '40%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#aaa', fontWeight: '500' },

  // Social
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, height: 48,
    backgroundColor: '#FAFAFA',
  },
  socialBtnText: { fontSize: 14, color: '#333', fontWeight: '600' },

  // Register
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  registerText: { fontSize: 14, color: '#888' },
  registerLink: { fontSize: 14, color: TEAL, fontWeight: '800' },

  // Trust
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 11, color: '#888', fontWeight: '500' },
  trustDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#ddd' },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    backgroundColor: TEAL_DARK,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
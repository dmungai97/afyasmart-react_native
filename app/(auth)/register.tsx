import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { registerUser } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/authStore';

const TEAL = '#0B6E6E';

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirm) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      const data = await registerUser(name, email, phone, password, confirm);
      await setAuth(data.token, data.user);
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Registration failed. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const Field = ({
    icon, placeholder, value, onChangeText, keyboardType, secureTextEntry,
    autoCapitalize, fieldKey, rightElement,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    keyboardType?: any;
    secureTextEntry?: boolean;
    autoCapitalize?: any;
    fieldKey: string;
    rightElement?: React.ReactNode;
  }) => (
    <View style={[styles.inputWrap, focused === fieldKey && styles.inputWrapFocused]}>
      <Ionicons
        name={icon}
        size={18}
        color={focused === fieldKey ? TEAL : '#aaa'}
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'none'}
        onFocus={() => setFocused(fieldKey)}
        onBlur={() => setFocused(null)}
      />
      {rightElement}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top */}
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <View style={styles.crossV} />
                <View style={styles.crossH} />
                <View style={styles.ring1} />
                <View style={styles.ring2} />
              </View>
            </View>
          </View>
          <Text style={styles.appName}>AfyaSmart</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get started</Text>
          <Text style={styles.cardSub}>Fill in your details to register</Text>

          <Field
            fieldKey="name"
            icon="person-outline"
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Field
            fieldKey="email"
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Field
            fieldKey="phone"
            icon="call-outline"
            placeholder="Phone number e.g 07XXXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field
            fieldKey="password"
            icon="lock-closed-outline"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#aaa" />
              </TouchableOpacity>
            }
          />
          <Field
            fieldKey="confirm"
            icon="lock-closed-outline"
            placeholder="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
            rightElement={
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#aaa" />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.btnContent}>
              {loading ? (
                <>
                  <Ionicons name="reload-outline" size={18} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Creating account...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Create account</Text>
                  <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => router.back()}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By registering, you agree to our Terms & Privacy Policy
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEAL },
  scroll: { flexGrow: 1 },
  top: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoWrap: { marginBottom: 16 },
  logoOuter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  crossV: { position: 'absolute', width: 5, height: 26, backgroundColor: '#fff', borderRadius: 3 },
  crossH: { position: 'absolute', width: 26, height: 5, backgroundColor: '#fff', borderRadius: 3 },
  ring1: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  ring2: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  appName: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 8,
    flex: 1,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#888', marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9f9',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 52,
  },
  inputWrapFocused: { borderColor: TEAL, backgroundColor: '#fff' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  eyeBtn: { padding: 4 },
  btnPrimary: {
    backgroundColor: TEAL,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { alignItems: 'center', marginBottom: 16 },
  loginText: { fontSize: 14, color: '#888' },
  loginLink: { color: TEAL, fontWeight: '700' },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: TEAL,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
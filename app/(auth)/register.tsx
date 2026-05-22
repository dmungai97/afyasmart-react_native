import React, { memo, useRef, useState } from "react";

import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { registerUser } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/store/authStore";

const TEAL = "#0B6E6E";
const TEAL_DARK = "#063D3D";

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  fieldKey: string;
  focused: string | null;
  setFocused: (field: string | null) => void;

  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  rightElement?: React.ReactNode;
};

const Field = memo(
  ({
    icon,
    placeholder,
    value,
    onChangeText,
    fieldKey,
    focused,
    setFocused,
    keyboardType,
    secureTextEntry,
    autoCapitalize = "none",
    rightElement,
  }: FieldProps) => {
    const isFocused = focused === fieldKey;

    return (
      <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
        <View style={[styles.iconWrap, isFocused && styles.iconWrapFocused]}>
          <Ionicons name={icon} size={18} color={isFocused ? "#fff" : "#aaa"} />
        </View>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="next"
          onFocus={() => setFocused(fieldKey)}
          onBlur={() => setFocused(null)}
        />

        {rightElement}
      </View>
    );
  },
);

Field.displayName = "Field";

export default function RegisterScreen() {
  const router = useRouter();
  const { plan } = useLocalSearchParams<{ plan?: string }>();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [focused, setFocused] = useState<string | null>(null);

  const isSubmitting = useRef(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirm
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (isSubmitting.current) return;

    isSubmitting.current = true;
    setLoading(true);

    try {
      const data = await registerUser(
        name.trim(),
        email.trim(),
        phone.trim(),
        password,
        confirm,
      );

      await setAuth(data.token, data.user, true);

      if (plan) {
        router.replace({
          pathname: "/(tabs)/subscription" as any,
          params: { plan },
        });
      } else if (data.user.is_subscribed) {
        router.replace("/(tabs)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";

      alert(message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Background */}
      <View style={styles.background}>
        <View style={styles.bgBase} />

        <View
          style={[
            styles.circle,
            {
              width: 260,
              height: 260,
              top: -60,
              right: -80,
              opacity: 0.08,
            },
          ]}
        />

        <View
          style={[
            styles.circle,
            {
              width: 180,
              height: 180,
              bottom: 100,
              left: -40,
              opacity: 0.05,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {/* Header */}
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
          <View style={styles.cardAccent} />

          <Text style={styles.cardTitle}>Get started</Text>

          <Text style={styles.cardSub}>Fill in your details to register</Text>

          <Field
            fieldKey="name"
            icon="person-outline"
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            focused={focused}
            setFocused={setFocused}
          />

          <Field
            fieldKey="email"
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            focused={focused}
            setFocused={setFocused}
          />

          <Field
            fieldKey="phone"
            icon="call-outline"
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            focused={focused}
            setFocused={setFocused}
          />

          <Field
            fieldKey="password"
            icon="lock-closed-outline"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            focused={focused}
            setFocused={setFocused}
            rightElement={
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#999"
                />
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
            focused={focused}
            setFocused={setFocused}
            rightElement={
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#999"
                />
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

                  <Ionicons
                    name="arrow-forward-outline"
                    size={18}
                    color="#fff"
                  />
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => {
              if (plan) {
                router.push({
                  pathname: "/(auth)/login" as any,
                  params: { plan },
                });
                return;
              }

              router.back();
            }}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
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
  container: {
    flex: 1,
  },

  background: {
    ...StyleSheet.absoluteFillObject,
  },

  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TEAL_DARK,
  },

  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#fff",
  },

  scroll: {
    flexGrow: 1,
  },

  top: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },

  logoWrap: {
    marginBottom: 18,
  },

  logoOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,

    backgroundColor: "rgba(255,255,255,0.12)",

    alignItems: "center",
    justifyContent: "center",
  },

  logoInner: {
    width: 62,
    height: 62,
    borderRadius: 31,

    backgroundColor: "rgba(255,255,255,0.18)",

    alignItems: "center",
    justifyContent: "center",
  },

  crossV: {
    position: "absolute",
    width: 5,
    height: 26,
    borderRadius: 3,
    backgroundColor: "#fff",
  },

  crossH: {
    position: "absolute",
    width: 26,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff",
  },

  ring1: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,

    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
  },

  ring2: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  appName: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },

  card: {
    flex: 1,

    backgroundColor: "#fff",

    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,

    padding: 28,
    paddingBottom: 10,

    overflow: "hidden",
  },

  cardAccent: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,

    height: 4,

    backgroundColor: TEAL,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",

    marginTop: 8,
    marginBottom: 4,
  },

  cardSub: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",

    height: 56,

    backgroundColor: "#F9FAFB",

    borderWidth: 1.5,
    borderColor: "#E5E7EB",

    borderRadius: 14,

    marginBottom: 14,

    overflow: "hidden",
  },

  // optimized
  inputWrapFocused: {
    borderColor: TEAL,
    backgroundColor: "#fff",
  },

  iconWrap: {
    width: 54,
    height: "100%",

    alignItems: "center",
    justifyContent: "center",

    borderRightWidth: 1,
    borderRightColor: "#F0F0F0",
  },

  iconWrapFocused: {
    backgroundColor: TEAL,
    borderRightColor: TEAL,
  },

  input: {
    flex: 1,

    fontSize: 14,
    color: "#1a1a1a",

    paddingHorizontal: 14,
  },

  eyeBtn: {
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
  },

  btnPrimary: {
    height: 54,

    backgroundColor: TEAL,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 10,
    marginBottom: 22,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  loginRow: {
    alignItems: "center",
    marginBottom: 18,
  },

  loginText: {
    fontSize: 14,
    color: "#888",
  },

  loginLink: {
    color: TEAL,
    fontWeight: "800",
  },

  footer: {
    textAlign: "center",

    fontSize: 11,

    color: "rgba(255,255,255,0.55)",

    backgroundColor: TEAL_DARK,

    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});

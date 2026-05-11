import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { initiateMpesa, pollMpesaStatus } from '../../src/services/mpesa.service';

const TEAL   = '#0B6E6E';
const PURPLE = '#7C3AED';
const GREEN  = '#16A34A';

type Plan = {
  id: string;
  name: string;
  price: number;
  period: string;
  color: string;
  badge?: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    period: 'forever',
    color: '#6B7280',
    features: [
      'Explore the app for 1 day',
      'Limited AI chat',
      'Limited symptoms check',
      'View only subscribed services',
    ],
  },
  {
    id: 'daily',
    name: 'Daily Plan',
    price: 20,
    period: 'day',
    color: TEAL,
    features: [
      'Valid for 24 hours',
      'Full access to all features',
      'Unlimited AI Health Assistant',
      'Full Symptoms Checker',
      'Drugs Database access',
      'Nearby Health Services',
    ],
  },
  {
    id: 'weekly',
    name: 'Weekly Plan',
    price: 100,
    period: 'week',
    color: PURPLE,
    badge: 'Popular',
    features: [
      'Valid for 7 days',
      'Full access to all features',
      'Unlimited AI Health Assistant',
      'Full Symptoms Checker',
      'Drugs Database access',
      'Nearby Health Services',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 200,
    period: 'month',
    color: GREEN,
    badge: 'Best Value',
    features: [
      'Valid for 30 days',
      'Full access to all features',
      'Unlimited AI Health Assistant',
      'Full Symptoms Checker',
      'Drugs Database access',
      'Nearby Health Services',
    ],
  },
];

// ── Payment steps ──────────────────────────────────────────────────────────
type PayStep = 'form' | 'waiting' | 'confirmed' | 'failed';

export default function SubscriptionScreen() {
  const router                                = useRouter();
  const { plan: planParam }                   = useLocalSearchParams<{ plan?: string }>();
  const token                                 = useAuthStore((state) => state.token);
  const user                                  = useAuthStore((state) => state.user);
  const refreshUser                           = useAuthStore((state) => state.refreshUser);

  const [selectedPlan,  setSelectedPlan]      = useState<Plan | null>(null);
  const [showPayment,   setShowPayment]       = useState(false);
  const [showSuccess,   setShowSuccess]       = useState(false);
  const [currentPlan]                         = useState('free');

  // ── Payment state ──
  const [payStep,       setPayStep]           = useState<PayStep>('form');
  const [phone,         setPhone]             = useState(user?.phone ?? '');
  // CORRECT
const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pollCount,     setPollCount]         = useState(0);
  const pollRef = useRef<number | null>(null);

  // Auto-open payment modal when navigated from chat
  useEffect(() => {
    if (planParam) {
      const found = PLANS.find((p) => p.id === planParam);
      if (found && found.id !== 'free') {
        setSelectedPlan(found);
        setShowPayment(true);
      }
    }
  }, [planParam]);

  // ── Cleanup polling on unmount ──
useEffect(() => {
  return () => {
if (pollRef.current !== null) clearInterval(pollRef.current);
  };
}, []);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === 'free') return;
    setSelectedPlan(plan);
    setPayStep('form');
    setPhone(user?.phone ?? '');
    setCheckoutId(null);
    setPollCount(0);
    setShowPayment(true);
  };

  // ── Step 1: Send STK Push ──────────────────────────────────────
  const handleInitiate = async () => {
    if (!selectedPlan || !phone.trim()) {
      Alert.alert('Required', 'Please enter your M-Pesa phone number.');
      return;
    }

    setPayStep('waiting');

    try {
      const data = await initiateMpesa(token, phone.trim(), selectedPlan.id);
      setCheckoutId(data.checkout_request_id);
      startPolling(data.checkout_request_id);
    } catch (err: any) {
      setPayStep('failed');
      Alert.alert(
        'STK Push Failed',
        err?.response?.data?.message ?? 'Could not send M-Pesa prompt. Try again.'
      );
    }
  };

  // ── Step 2: Poll every 3s for up to 90s ───────────────────────
  const startPolling = (id: string) => {
    let count = 0;
    const MAX = 30; // 30 × 3s = 90s timeout

    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);

      try {
        const result = await pollMpesaStatus(token, id);

        if (result.paid) {
          clearInterval(pollRef.current!);
          setPayStep('confirmed');

          // Sync store from server (most accurate)
          if (token) await refreshUser(token);

          setTimeout(() => {
            setShowPayment(false);
            setTimeout(() => setShowSuccess(true), 300);
          }, 1000);
          return;
        }

        if (result.status === 'cancelled') {
          clearInterval(pollRef.current!);
          setPayStep('failed');
          Alert.alert('Payment Cancelled', 'You cancelled the M-Pesa request.');
          return;
        }

      } catch {
        // network blip — keep polling
      }

      // Timeout
      if (count >= MAX) {
        clearInterval(pollRef.current!);
        setPayStep('failed');
        Alert.alert(
          'Payment Timeout',
          'We did not receive payment confirmation. If you paid, please contact support.'
        );
      }
    }, 3000);
  };

  const handleRetry = () => {
    if (pollRef.current !== null) clearInterval(pollRef.current);
    setPayStep('form');
    setCheckoutId(null);
    setPollCount(0);
  };

const handleDone = () => {
  setShowSuccess(false);
  router.replace('/(tabs)' as any);
};

  // ── Payment modal content by step ─────────────────────────────
  const renderPaymentContent = () => {
    if (!selectedPlan) return null;

    // Step: Phone input form
    if (payStep === 'form') {
      return (
        <>
          <Text style={styles.secureLabel}>🔒 Secure M-Pesa Payment</Text>

          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount to pay</Text>
            <Text style={styles.amountValue}>Ksh {selectedPlan.price}</Text>
            <Text style={styles.amountPlan}>{selectedPlan.name}</Text>
          </View>

          <Text style={styles.fieldLabel}>M-Pesa Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefixBox}>
              <Text style={styles.phonePrefix}>🇰🇪 +254</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="07XX XXX XXX"
              placeholderTextColor="#aaa"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>How it works</Text>
            {[
              'Tap Pay — we send a prompt to your phone',
              'Enter your M-Pesa PIN when prompted',
              'You get instant access on confirmation',
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={handleInitiate}>
            <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
            <Text style={styles.payBtnText}>Pay Ksh {selectedPlan.price} via M-Pesa</Text>
          </TouchableOpacity>

          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#888" />
            <Text style={styles.secureText}>Powered by Safaricom Daraja API</Text>
          </View>
        </>
      );
    }

    // Step: Waiting for PIN
    if (payStep === 'waiting') {
      const secondsLeft = Math.max(0, 90 - pollCount * 3);
      return (
        <View style={styles.waitingRoot}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.waitingTitle}>Waiting for M-Pesa PIN</Text>
          <Text style={styles.waitingPhone}>Prompt sent to {phone}</Text>
          <View style={styles.waitingStepsCard}>
            {[
              { done: true,            label: 'STK Push sent to your phone' },
              { done: pollCount > 2,   label: 'Enter your M-Pesa PIN' },
              { done: false,           label: 'Confirming payment...' },
            ].map((s, i) => (
              <View key={i} style={styles.waitingStepRow}>
                <Ionicons
                  name={s.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={s.done ? GREEN : '#ccc'}
                />
                <Text style={[styles.waitingStepText, s.done && { color: GREEN }]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.timeoutText}>
            Expires in {secondsLeft}s
          </Text>
          <TouchableOpacity onPress={handleRetry} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel & try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step: Confirmed
    if (payStep === 'confirmed') {
      return (
        <View style={styles.waitingRoot}>
          <Ionicons name="checkmark-circle" size={64} color={GREEN} />
          <Text style={styles.waitingTitle}>Payment Confirmed!</Text>
          <Text style={styles.waitingPhone}>Activating your subscription...</Text>
          <ActivityIndicator size="small" color={TEAL} style={{ marginTop: 16 }} />
        </View>
      );
    }

    // Step: Failed
    if (payStep === 'failed') {
      return (
        <View style={styles.waitingRoot}>
          <Ionicons name="close-circle" size={64} color="#DC2626" />
          <Text style={[styles.waitingTitle, { color: '#DC2626' }]}>Payment Failed</Text>
          <Text style={styles.waitingPhone}>
            The payment could not be completed.
          </Text>
          <TouchableOpacity style={[styles.payBtn, { marginTop: 24 }]} onPress={handleRetry}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.payBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.crownWrap}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={styles.headerTitle}>Affordable Plans</Text>
          <Text style={styles.headerSub}>Premium Health Access</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;
          const isFree   = plan.id === 'free';

          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, { borderColor: plan.color }, isActive && styles.planCardActive]}
              onPress={() => handleSelectPlan(plan)}
              activeOpacity={isFree ? 1 : 0.8}
            >
              <View style={styles.planTop}>
                <View style={styles.planTitleRow}>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  {isActive && (
                    <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                  {plan.badge && !isActive && (
                    <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                      <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>
                  {plan.price === 0 ? 'Ksh 0' : `Ksh ${plan.price}`}
                </Text>
              </View>

              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {!isFree && !isActive && (
                <View style={[styles.planBtn, { backgroundColor: plan.color }]}>
                  <Text style={styles.planBtnText}>Subscribe · Ksh {plan.price}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#888" />
          <Text style={styles.footerText}>
            Cancel anytime. Secure payments. M-Pesa & Cards accepted.
          </Text>
        </View>
      </ScrollView>

      {/* ── Payment Modal ── */}
      <Modal
        visible={showPayment}
        animationType="slide"
        onRequestClose={() => payStep === 'form' && setShowPayment(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => payStep === 'form' ? setShowPayment(false) : handleRetry()}
              style={styles.modalBack}
            >
              <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {renderPaymentContent()}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} animationType="fade" onRequestClose={handleDone}>
        <View style={styles.successRoot}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={GREEN} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>You now have full access to AfyaSmart.</Text>

          {selectedPlan && (
            <View style={styles.successDetails}>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Plan</Text>
                <Text style={styles.successRowValue}>{selectedPlan.name}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Amount paid</Text>
                <Text style={styles.successRowValue}>Ksh {selectedPlan.price}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Valid until</Text>
                <Text style={styles.successRowValue}>
                  {new Date(
                    Date.now() +
                    (selectedPlan.id === 'daily'  ? 86_400_000  :
                     selectedPlan.id === 'weekly' ? 604_800_000 :
                     2_592_000_000)
                  ).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F5F7FA' },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },

  header: {
    backgroundColor: TEAL, paddingTop: 52, paddingBottom: 24,
    paddingHorizontal: 20, alignItems: 'center',
  },
  backBtn: {
    position: 'absolute', top: 52, left: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  crownWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  crownEmoji:  { fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  planCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  planCardActive:   { shadowOpacity: 0.1, elevation: 4 },
  planTop:          { marginBottom: 14 },
  planTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planName:         { fontSize: 17, fontWeight: '800' },
  currentBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  currentBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  popularBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  popularBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planPrice:        { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
  featureList:      { gap: 8, marginBottom: 16 },
  featureRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText:      { fontSize: 13, color: '#444', flex: 1, lineHeight: 20 },
  planBtn:          { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  planBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },

  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 },
  footerText: { fontSize: 12, color: '#888', textAlign: 'center', flex: 1, lineHeight: 18 },

  modalRoot: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee',
  },
  modalBack:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  modalContent: { padding: 20, gap: 16, paddingBottom: 40 },

  secureLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textAlign: 'center' },
  amountCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  amountLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  amountValue: { fontSize: 36, fontWeight: '900', color: '#1a1a1a', marginBottom: 4 },
  amountPlan:  { fontSize: 13, color: '#888' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  phoneRow:   { flexDirection: 'row', gap: 10, alignItems: 'center' },
  phonePrefixBox: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14,
  },
  phonePrefix: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  phoneInput: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: '#1a1a1a',
  },

  stepsCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    gap: 12, borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  stepsTitle:   { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText:  { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepText:     { fontSize: 13, color: '#555', flex: 1, lineHeight: 20 },

  payBtn: {
    backgroundColor: TEAL, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  payBtnText:   { color: '#fff', fontSize: 15, fontWeight: '800' },
  secureRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText:   { fontSize: 12, color: '#888' },

  // Waiting state
  waitingRoot: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  waitingTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', textAlign: 'center' },
  waitingPhone: { fontSize: 13, color: '#888', textAlign: 'center' },
  waitingStepsCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 14,
    padding: 16, gap: 12, marginTop: 8,
    borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  waitingStepRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  waitingStepText: { fontSize: 13, color: '#aaa', flex: 1 },
  timeoutText:     { fontSize: 12, color: '#aaa', marginTop: 8 },
  cancelLink:      { marginTop: 4 },
  cancelLinkText:  { fontSize: 13, color: '#DC2626', textDecorationLine: 'underline' },

  // Success modal
  successRoot: {
    flex: 1, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  successIcon:      { marginBottom: 20 },
  successTitle:     { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  successSub:       { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successDetails: {
    width: '100%', backgroundColor: '#F9FAFB', borderRadius: 16,
    padding: 16, gap: 12, marginBottom: 28,
    borderWidth: 0.5, borderColor: '#E5E7EB',
  },
  successRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  successRowLabel:  { fontSize: 13, color: '#888' },
  successRowValue:  { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  doneBtn: {
    backgroundColor: TEAL, borderRadius: 14, paddingVertical: 15,
    paddingHorizontal: 40, width: '100%', alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
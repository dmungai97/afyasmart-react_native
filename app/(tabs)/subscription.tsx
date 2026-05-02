import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TEAL   = '#0B6E6E';
const GOLD   = '#D97706';
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

const PAYMENT_METHODS = [
  { id: 'mpesa',  label: 'M-Pesa',      icon: 'phone-portrait-outline' as const, color: '#16A34A' },
  { id: 'card',   label: 'Card Payment', icon: 'card-outline' as const,           color: '#2563EB' },
  { id: 'airtel', label: 'Airtel Money', icon: 'phone-portrait-outline' as const,  color: '#DC2626' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan]   = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [showPayment, setShowPayment]     = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);
  const [currentPlan] = useState('free');

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === 'free') return;
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePay = () => {
    setShowPayment(false);
    setTimeout(() => setShowSuccess(true), 300);
  };

  const handleDone = () => {
    setShowSuccess(false);
    router.back();
  };

  return (
    <View style={styles.root}>

      {/* Header */}
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
        {/* Plans */}
        {PLANS.map((plan) => {
          const isActive  = currentPlan === plan.id;
          const isFree    = plan.id === 'free';

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                { borderColor: plan.color },
                isActive && styles.planCardActive,
              ]}
              onPress={() => handleSelectPlan(plan)}
              activeOpacity={isFree ? 1 : 0.8}
            >
              {/* Plan header */}
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
                  {plan.price === 0
                    ? 'Ksh 0'
                    : `Ksh ${plan.price}`}
                </Text>
              </View>

              {/* Features */}
              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={plan.color}
                    />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              {!isFree && !isActive && (
                <View style={[styles.planBtn, { backgroundColor: plan.color }]}>
                  <Text style={styles.planBtnText}>Subscribe · Ksh {plan.price}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#888" />
          <Text style={styles.footerText}>
            Cancel anytime. Secure payments. M-Pesa & Cards accepted.
          </Text>
        </View>

      </ScrollView>

      {/* ── Payment Modal ── */}
      <Modal visible={showPayment} animationType="slide" onRequestClose={() => setShowPayment(false)}>
        {selectedPlan && (
          <View style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPayment(false)} style={styles.modalBack}>
                <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Payment</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.secureLabel}>🔒 Secure Payment</Text>

              {/* Amount */}
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Amount to pay</Text>
                <Text style={styles.amountValue}>Ksh {selectedPlan.price}</Text>
                <Text style={styles.amountPlan}>{selectedPlan.name}</Text>
              </View>

              {/* Payment methods */}
              <Text style={styles.methodLabel}>Choose payment method</Text>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.methodRow,
                    paymentMethod === m.id && styles.methodRowActive,
                  ]}
                  onPress={() => setPaymentMethod(m.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: m.color + '18' }]}>
                    <Ionicons name={m.icon} size={20} color={m.color} />
                  </View>
                  <Text style={styles.methodLabel2}>{m.label}</Text>
                  <View style={[
                    styles.radio,
                    paymentMethod === m.id && styles.radioActive,
                  ]}>
                    {paymentMethod === m.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Pay button */}
              <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={styles.payBtnText}>Pay Ksh {selectedPlan.price}</Text>
              </TouchableOpacity>

              <View style={styles.secureRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#888" />
                <Text style={styles.secureText}>Secure & Encrypted</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} animationType="fade" onRequestClose={handleDone}>
        <View style={styles.successRoot}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={GREEN} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>
            You now have full access to AfyaSmart.
          </Text>

          {selectedPlan && (
            <View style={styles.successDetails}>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Plan</Text>
                <Text style={styles.successRowValue}>{selectedPlan.name}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Amount</Text>
                <Text style={styles.successRowValue}>Ksh {selectedPlan.price}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Valid until</Text>
                <Text style={styles.successRowValue}>
                  {new Date(
                    Date.now() +
                    (selectedPlan.id === 'daily'   ? 86400000 :
                     selectedPlan.id === 'weekly'  ? 604800000 :
                     2592000000)
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
  root:   { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },

  // Header
  header: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 52, left: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  crownWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  crownEmoji:   { fontSize: 24 },
  headerTitle:  { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  headerSub:    { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  // Plan card
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  planCardActive: {
    shadowOpacity: 0.1,
    elevation: 4,
  },
  planTop: { marginBottom: 14 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  planName: { fontSize: 17, fontWeight: '800' },
  currentBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  currentBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  popularBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  popularBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planPrice: { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },

  featureList: { gap: 8, marginBottom: 16 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: '#444', flex: 1, lineHeight: 20 },

  planBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  planBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerText: { fontSize: 12, color: '#888', textAlign: 'center', flex: 1, lineHeight: 18 },

  // Payment Modal
  modalRoot: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  modalBack:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  modalContent: { padding: 20, gap: 16, paddingBottom: 40 },

  secureLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textAlign: 'center' },

  amountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  amountLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  amountValue: { fontSize: 36, fontWeight: '900', color: '#1a1a1a', marginBottom: 4 },
  amountPlan:  { fontSize: 13, color: '#888' },

  methodLabel:  { fontSize: 13, fontWeight: '600', color: '#555' },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  methodRowActive: { borderColor: TEAL, backgroundColor: '#F0FAFA' },
  methodIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  methodLabel2: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: TEAL },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: TEAL,
  },

  payBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontSize: 12, color: '#888' },

  // Success Modal
  successRoot: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon:  { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  successSub:   { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28 },

  successDetails: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  successRowLabel: { fontSize: 13, color: '#888' },
  successRowValue: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },

  doneBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
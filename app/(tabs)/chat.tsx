import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView,
  Platform, Animated, Modal, Pressable, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../src/store/authStore';
import {
  sendMessage,
  getChatStatus,
  ChatLimitError,
  ChatStatusResponse,
} from '../../src/services/chat.service';

const TEAL       = '#0B6E6E';
const TEAL_LIGHT = '#E6F4F4';

type Message = {
  role: 'user' | 'ai';
  text: string;
  time: string;
};

const QUICK_CHIPS = [
  'Headache & fever',
  'Stomach pain',
  'Cough & cold',
  'Body weakness',
  'Chest pain',
];

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingBubble}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

// ── Subscribe modal ───────────────────────────────────────────────────────────
const PLANS = [
  { key: 'daily',   label: 'Daily Access',   price: 'Ksh 20',  sub: 'Valid for 24 hours',  popular: false },
  { key: 'weekly',  label: 'Weekly Access',  price: 'Ksh 100', sub: 'Valid for 7 days',    popular: true  },
  { key: 'monthly', label: 'Monthly Access', price: 'Ksh 200', sub: 'Valid for 30 days',   popular: false },
];

function SubscribeModal({
  visible,
  remaining,
  onClose,
  onSubscribe,
}: {
  visible: boolean;
  remaining: number;
  onClose: () => void;
  onSubscribe: (plan: string) => void;
}) {
  const [selected, setSelected] = useState('weekly');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalLock}>🔒</Text>
            <Text style={styles.modalTitle}>Unlock Full AI Chat</Text>
            <Text style={styles.modalSub}>
              {remaining === 0
                ? 'You have used all your free chats.'
                : `Only ${remaining} free chat${remaining !== 1 ? 's' : ''} remaining.`}
            </Text>
          </View>

          {/* Feature pills */}
          <View style={styles.featureRow}>
            {['Full Diagnosis', 'Treatment Advice', 'Nearby Services', 'AI Chat Support'].map(f => (
              <View key={f} style={styles.featurePill}>
                <Text style={styles.featurePillText}>{f}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.planLabel}>Choose a plan that works for you</Text>

          {/* Plans */}
          {PLANS.map(plan => (
            <TouchableOpacity
              key={plan.key}
              style={[styles.planRow, selected === plan.key && styles.planRowSelected]}
              onPress={() => setSelected(plan.key)}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, selected === plan.key && styles.planNameSelected]}>
                  {plan.label}
                </Text>
                <Text style={styles.planSub}>{plan.sub}</Text>
              </View>
              <Text style={[styles.planPrice, selected === plan.key && styles.planPriceSelected]}>
                {plan.price}
              </Text>
              <View style={[styles.radio, selected === plan.key && styles.radioSelected]}>
                {selected === plan.key && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* CTA */}
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => onSubscribe(selected)}>
            <Ionicons name="lock-open-outline" size={16} color="#fff" />
            <Text style={styles.subscribeBtnText}>Continue to Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#aaa', fontSize: 13 }}>Maybe later</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const token  = useAuthStore((state) => state.token);
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: "Hi 👋 I'm your AfyaSmart Doctor Assistant.\n\nWhat symptoms are you experiencing?",
      time: getTime(),
    },
  ]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatusResponse | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getChatStatus(token)
      .then(setChatStatus)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardShown(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardShown(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || loading) return;

    if (chatStatus && !chatStatus.is_subscribed && chatStatus.limit_reached) {
      setShowModal(true);
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage, time: getTime() }]);
    setLoading(true);

    try {
      const data = await sendMessage(userMessage, token);
      setMessages((prev) => [...prev, { role: 'ai', text: data.reply, time: getTime() }]);
      setChatStatus((prev) => prev ? {
        ...prev,
        chat_count:    data.chat_count,
        is_subscribed: data.is_subscribed,
        limit_reached: !data.is_subscribed && data.chat_count >= data.limit,
        remaining:     Math.max(0, data.limit - data.chat_count),
      } : prev);
    } catch (err) {
      if (err instanceof ChatLimitError) {
        setChatStatus((prev) => prev ? { ...prev, limit_reached: true, remaining: 0 } : prev);
        setShowModal(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: 'Sorry, I could not process your request. Please try again.',
            time: getTime(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: string) => {
    setShowModal(false);
    router.push({ pathname: '/(tabs)/subscription', params: { plan } });
  };

  const remaining  = chatStatus?.remaining ?? null;
  const showCounter = chatStatus && !chatStatus.is_subscribed && !chatStatus.limit_reached;

  const bottomSpacer = keyboardShown ? 0 : tabBarHeight;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AfyaSmart AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDotSmall} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {showCounter && remaining !== null && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{remaining} free left</Text>
            </View>
          )}
          {chatStatus?.limit_reached && (
            <TouchableOpacity style={styles.unlockBtn} onPress={() => setShowModal(true)}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
              <Text style={styles.unlockBtnText}>Unlock</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Chips ── */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {QUICK_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => handleSend(chip)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"   // ✅ FIX: tapping list won't dismiss keyboard
        keyboardDismissMode="interactive"      // ✅ FIX: keyboard follows drag on iOS
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubbleRow,
              msg.role === 'user' ? styles.bubbleRowUser : styles.bubbleRowAi,
            ]}
          >
            {msg.role === 'ai' && (
              <View style={styles.aiBadge}>
                <Text style={{ fontSize: 13 }}>🤖</Text>
              </View>
            )}
            <View style={{ maxWidth: '75%' }}>
              <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
                  {msg.text}
                </Text>
              </View>
              <Text style={[styles.timeText, msg.role === 'user' ? styles.timeRight : styles.timeLeft]}>
                {msg.time}
                {msg.role === 'user' && <Text style={styles.readTick}> ✓✓</Text>}
              </Text>
            </View>
          </View>
        ))}

        {loading && <TypingIndicator />}
      </ScrollView>

      {/* ── Input (locked state) ── */}
      {chatStatus?.limit_reached ? (
        <TouchableOpacity
          style={[styles.lockedBar, { marginBottom: bottomSpacer }]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="lock-closed" size={16} color={TEAL} />
          <Text style={styles.lockedBarText}>Subscribe to continue chatting</Text>
          <View style={styles.lockedBarBtn}>
            <Text style={styles.lockedBarBtnText}>Unlock</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.inputRow, { marginBottom: bottomSpacer }]}>
          <TextInput
            style={styles.input}
            placeholder="Type your symptoms..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="send"                          // ✅ FIX: shows send key on keyboard
            onSubmitEditing={() => handleSend()}          // ✅ FIX: send on keyboard return
            blurOnSubmit={false}                          // ✅ FIX: keeps keyboard open after send
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Subscribe Modal ── */}
      <SubscribeModal
        visible={showModal}
        remaining={chatStatus?.remaining ?? 0}
        onClose={() => setShowModal(false)}
        onSubscribe={handleSubscribe}
      />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f4' },

  // Header
  header: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 1.5, borderColor: TEAL,
  },
  onlineRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDotSmall: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  onlineText:     { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  headerTitle:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10,
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10,
  },
  unlockBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Chips
  chipsWrapper:    { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e8e8e8' },
  chipsRow:        { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  chip:            { backgroundColor: TEAL_LIGHT, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: '#c0dcdc' },
  chipText:        { fontSize: 12, color: TEAL, fontWeight: '600' },

  // Messages
  messages:        { flex: 1 },
  messagesContent: { padding: 16, gap: 6, paddingBottom: 24 },
  bubbleRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  bubbleRowAi:     { justifyContent: 'flex-start' },
  bubbleRowUser:   { justifyContent: 'flex-end' },
  aiBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: '#e0e0e0', marginBottom: 18,
  },
  bubble:     { padding: 12, borderRadius: 18 },
  userBubble: { backgroundColor: TEAL, borderBottomRightRadius: 4 },
  aiBubble:   { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#e0e0e0' },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText:   { color: '#fff' },
  aiText:     { color: '#1a1a1a' },
  timeText:   { fontSize: 10, color: '#aaa', marginTop: 3 },
  timeRight:  { textAlign: 'right' },
  timeLeft:   { textAlign: 'left', marginLeft: 4 },
  readTick:   { color: '#4CAF50', fontSize: 10 },

  // Typing
  typingBubble: {
    flexDirection: 'row', backgroundColor: '#fff', alignSelf: 'flex-start',
    padding: 14, borderRadius: 18, borderBottomLeftRadius: 4,
    gap: 5, marginLeft: 38, borderWidth: 0.5, borderColor: '#e0e0e0',
  },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL },

  // Input
  inputRow: {
    flexDirection: 'row', padding: 12, gap: 10,
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e8e8e8',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: '#f4f8f8', borderWidth: 0.5, borderColor: '#ddd',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#1a1a1a', maxHeight: 100,
  },
  sendBtn:      { backgroundColor: TEAL, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },

  // Locked bar
  lockedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', padding: 16,
    borderTopWidth: 0.5, borderTopColor: '#e8e8e8',
  },
  lockedBarText:    { flex: 1, fontSize: 13, color: '#555' },
  lockedBarBtn:     { backgroundColor: TEAL, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 16 },
  lockedBarBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader:  { alignItems: 'center', marginBottom: 16 },
  modalLock:    { fontSize: 32, marginBottom: 8 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  modalSub:     { fontSize: 13, color: '#777', textAlign: 'center' },
  featureRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  featurePill:  { backgroundColor: TEAL_LIGHT, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: '#c0dcdc' },
  featurePillText: { fontSize: 12, color: TEAL, fontWeight: '600' },
  planLabel:    { fontSize: 13, color: '#777', marginBottom: 10 },
  planRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14,
    padding: 14, marginBottom: 10,
  },
  planRowSelected: { borderColor: TEAL, backgroundColor: TEAL_LIGHT },
  popularBadge: {
    position: 'absolute', top: -10, left: 16,
    backgroundColor: TEAL, borderRadius: 10,
    paddingVertical: 2, paddingHorizontal: 10,
  },
  popularText:      { color: '#fff', fontSize: 10, fontWeight: '700' },
  planName:         { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  planNameSelected: { color: TEAL },
  planSub:          { fontSize: 11, color: '#999', marginTop: 2 },
  planPrice:        { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  planPriceSelected:{ color: TEAL },
  radio:            { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioSelected:    { borderColor: TEAL },
  radioDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: TEAL },
  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: TEAL, borderRadius: 16, paddingVertical: 16, marginTop: 8,
  },
  subscribeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

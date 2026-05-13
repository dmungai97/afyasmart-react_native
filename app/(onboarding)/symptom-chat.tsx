import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { buildDiagnosisFromSymptoms, useDiagnosisStore } from '../../src/store/diagnosisStore';
import api from '../../src/services/api';

const TEAL      = '#0B6E6E';
const TEAL_DARK = '#063D3D';
const BG        = '#F0F7F7';

type Message = {
  role:    'assistant' | 'user';
  text:    string;
  typing?: boolean;
};

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    text: "Hi 👋 I'm your AfyaSmart Doctor Assistant.\n\nI'll help you understand what your symptoms might mean. What are you experiencing today?",
  },
];

export default function SymptomChatScreen() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const setPendingDiagnosis = useDiagnosisStore((s) => s.setPendingDiagnosis);

  const [messages, setMessages]   = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [hasSymptoms, setHasSymptoms] = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const inputRef   = useRef<TextInput>(null);
  const dotAnim1   = useRef(new Animated.Value(0)).current;
  const dotAnim2   = useRef(new Animated.Value(0)).current;
  const dotAnim3   = useRef(new Animated.Value(0)).current;

  // Typing dots animation
  const startDots = () => {
    const dot = (a: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(a, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0,  duration: 300, useNativeDriver: true }),
        ])
      );
    Animated.parallel([dot(dotAnim1, 0), dot(dotAnim2, 150), dot(dotAnim3, 300)]).start();
  };

  const stopDots = () => {
    dotAnim1.stopAnimation(); dotAnim1.setValue(0);
    dotAnim2.stopAnimation(); dotAnim2.setValue(0);
    dotAnim3.stopAnimation(); dotAnim3.setValue(0);
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setHasSymptoms(true);
    setPendingDiagnosis(buildDiagnosisFromSymptoms(text));

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text }]);

    // Show typing indicator
    setLoading(true);
    startDots();
    setMessages((prev) => [...prev, { role: 'assistant', text: '', typing: true }]);

    try {
      const res = await api.post(
        '/chat/send',
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reply: string = res.data.reply ?? '';

      // Remove typing bubble, add real reply
      setMessages((prev) => {
        const without = prev.filter((m) => !m.typing);
        return [...without, { role: 'assistant', text: reply }];
      });

      stopDots();
      setLoading(false);

      // After first AI reply — wait 1.5s then show lock screen
      setTimeout(() => {
        router.push('/(onboarding)/locked-results' as any);
      }, 2000);

    } catch (err: any) {
      stopDots();
      setLoading(false);

      const limitReached = err?.response?.data?.limit_reached;

      setMessages((prev) => {
        const without = prev.filter((m) => !m.typing);
        if (limitReached) {
          return [...without, {
            role: 'assistant',
            text: "I've gathered enough to analyse your symptoms. Let me show you what I found... 🔍",
          }];
        }
        return [...without, {
          role: 'assistant',
          text: 'I had trouble processing that. Could you describe your symptoms again?',
        }];
      });

      if (limitReached) {
        setTimeout(() => router.push('/(onboarding)/locked-results' as any), 2000);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <View style={styles.crossV} />
            <View style={styles.crossH} />
          </View>
          <View>
            <Text style={styles.headerName}>AfyaSmart AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online · Health Assistant</Text>
            </View>
          </View>
        </View>
        <View style={styles.secureChip}>
          <Ionicons name="shield-checkmark" size={11} color="#4ADE80" />
          <Text style={styles.secureText}>Private</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
            ]}
          >
            {msg.typing ? (
              // Typing dots
              <View style={styles.typingDots}>
                <Text style={styles.analyzingText}>Analysing your symptoms</Text>
                <View style={styles.dotsRow}>
                  {[dotAnim1, dotAnim2, dotAnim3].map((a, di) => (
                    <Animated.View
                      key={di}
                      style={[styles.dot, { transform: [{ translateY: a }] }]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <Text style={msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAI}>
                {msg.text}
              </Text>
            )}
          </View>
        ))}

        {/* After first reply — show teaser hint */}
        {hasSymptoms && !loading && (
          <View style={styles.teaserHint}>
            <Ionicons name="lock-closed" size={14} color={TEAL} />
            <Text style={styles.teaserHintText}>
              Preparing your full diagnosis report...
            </Text>
            <ActivityIndicator size="small" color={TEAL} />
          </View>
        )}
      </ScrollView>

      {/* ── Input ── */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe your symptoms..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={500}
          editable={!loading}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: TEAL_DARK,
    paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  crossV: { position: 'absolute', width: 4, height: 20, backgroundColor: '#fff', borderRadius: 2 },
  crossH: { position: 'absolute', width: 20, height: 4, backgroundColor: '#fff', borderRadius: 2 },
  headerName:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlineText:  { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  secureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  secureText: { color: '#4ADE80', fontSize: 11, fontWeight: '600' },

  // Messages
  messages:        { flex: 1 },
  messagesContent: { padding: 16, gap: 10, paddingBottom: 8 },

  bubble: {
    maxWidth: '80%', borderRadius: 16, padding: 14,
  },
  bubbleAI: {
    backgroundColor: '#fff', alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleUser: {
    backgroundColor: TEAL, alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleTextAI:   { color: '#333', fontSize: 14, lineHeight: 22 },
  bubbleTextUser: { color: '#fff', fontSize: 14, lineHeight: 22 },

  // Typing
  typingDots:    { gap: 8 },
  analyzingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },
  dotsRow:       { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: TEAL, opacity: 0.7,
  },

  // Teaser hint
  teaserHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E0F0F0', borderRadius: 12, padding: 12,
    marginTop: 4, alignSelf: 'center',
  },
  teaserHintText: { color: TEAL, fontSize: 12, fontWeight: '600', flex: 1 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E5E5',
  },
  input: {
    flex: 1, backgroundColor: BG, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#333', maxHeight: 100,
    borderWidth: 1, borderColor: '#D1E8E8',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#B0CECE' },
});

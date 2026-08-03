import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiagnosisStore } from '@/src/store/diagnosisStore';
import type { SymptomsAnalysisRequest } from '@/src/services/symptoms.service';

const TEAL      = '#0B6E6E';
const TEAL_DARK = '#063D3D';
const BG        = '#F0F7F7';

const AGE_GROUP_TO_AGE: Record<string, number> = {
  'Under 18': 16,
  '18 – 30': 24,
  '31 – 45': 38,
  '46 – 60': 53,
  'Over 60': 68,
};

const FEELING_TO_SEVERITY: Record<string, string> = {
  'Very unwell': 'Severe',
  'Unwell': 'Moderate',
  'Okay': 'Mild',
  'Good': 'Mild',
  'Great': 'Mild',
};

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

export function SymptomChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPendingAnalysisRequest = useDiagnosisStore((s) => s.setPendingAnalysisRequest);
  const healthCheckAnswers = useDiagnosisStore((s) => s.healthCheckAnswers);

  const [messages, setMessages]   = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const inputRef   = useRef<TextInput>(null);
  const dotAnim1   = useRef(new Animated.Value(0)).current;
  const dotAnim2   = useRef(new Animated.Value(0)).current;
  const dotAnim3   = useRef(new Animated.Value(0)).current;

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

  const [keyboardShown, setKeyboardShown] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardShown(true);
      scrollToBottom();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardShown(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (keyboardShown) {
      scrollToBottom();
    }
  }, [keyboardShown]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    startDots();
    setMessages((prev) => [...prev, { role: 'assistant', text: '', typing: true }]);

    const request: SymptomsAnalysisRequest = {
      symptoms: [text],
      age: AGE_GROUP_TO_AGE[healthCheckAnswers?.age ?? ''] ?? 25,
      gender: 'other',
      duration: '1-3 days',
      severity: FEELING_TO_SEVERITY[healthCheckAnswers?.feeling ?? ''] ?? 'Moderate',
      answers: healthCheckAnswers?.concern ? { concern: healthCheckAnswers.concern } : {},
    };
    setPendingAnalysisRequest(request);

    // Brief typing beat before handing off — the actual analysis runs on the
    // next screen, so this message can't claim findings it doesn't have yet.
    setTimeout(() => {
      stopDots();
      setMessages((prev) => {
        const without = prev.filter((m) => !m.typing);
        return [...without, {
          role: 'assistant',
          text: "Got it — let me analyze that for you now.",
        }];
      });

      setTimeout(() => {
        router.push('/(onboarding)/analysis-loading' as any);
      }, 700);
    }, 500);
  };

  const inputBottomPadding = keyboardShown ? 12 : Math.max(insets.bottom, 8) + 12;
  const headerTopPadding = Math.max(insets.top + 28, 52);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DARK} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
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

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: inputBottomPadding }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe your symptoms..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={500}
          editable={!sending}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          onFocus={() => {
            setKeyboardShown(true);
            scrollToBottom();
          }}
          onBlur={() => setKeyboardShown(false)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
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
  typingDots:    { gap: 8 },
  analyzingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },
  dotsRow:       { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: TEAL, opacity: 0.7,
  },
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

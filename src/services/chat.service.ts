import {
  collection,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
} from "firebase/firestore";
import Constants from "expo-constants";
import { firebaseAuth, firestore } from "./firebase";
import {
  FREE_CHAT_LIMIT,
  canUseFreeChats,
  isSubscriptionActive,
} from "./subscription.model";

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface SendMessageResponse {
  reply: string;
  chat_count: number;
  limit: number;
  is_subscribed: boolean;
}

export interface ChatStatusResponse {
  chat_count: number;
  limit: number;
  is_subscribed: boolean;
  free_chat_eligible: boolean;
  limit_reached: boolean;
  remaining: number;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

export class ChatLimitError extends Error {
  constructor() {
    super("LIMIT_REACHED");
    this.name = "ChatLimitError";
  }
}

// ── Resolve the Laravel API base URL (same constant as M-Pesa) ──────────────
type FirebaseExtra = { mpesaApiBaseUrl?: string };
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;
const chatApiBaseUrl =
  process.env.EXPO_PUBLIC_MPESA_API_BASE_URL ??
  extra.mpesaApiBaseUrl ??
  "https://afyasmart-ey9q.onrender.com/api/v1";

// ── Low-level POST helper (mirrors requestLaravelMpesa in mpesa.service.ts) ──
const requestLaravelChat = async <T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const firebase_uid = firebaseAuth.currentUser?.uid;
  if (!firebase_uid) throw new Error("You must be signed in to use chat.");

  const response = await fetch(`${chatApiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, firebase_uid }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 403 && data?.limit_reached) {
      throw new ChatLimitError();
    }
    throw new Error(data?.message ?? "Chat request failed.");
  }

  return data as T;
};

// ── Public API ───────────────────────────────────────────────────────────────

const requireUid = () => {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to use chat.");
  return uid;
};

export const getChatStatus = async (
  token: string | null,
): Promise<ChatStatusResponse> => {
  void token;
  requireUid();

  // Fall back to local Firestore profile when the Laravel user row doesn't exist yet
  const { getCurrentUserProfile } = await import("./auth.service");
  const user = await getCurrentUserProfile();
  const chatCount = user?.chat_count ?? 0;
  const isSubscribed = isSubscriptionActive(user);
  const freeChatEligible = canUseFreeChats(user);

  return {
    chat_count: chatCount,
    limit: FREE_CHAT_LIMIT,
    is_subscribed: isSubscribed,
    free_chat_eligible: freeChatEligible,
    limit_reached: !isSubscribed && (!freeChatEligible || chatCount >= FREE_CHAT_LIMIT),
    remaining: isSubscribed || freeChatEligible
      ? Math.max(0, FREE_CHAT_LIMIT - chatCount)
      : 0,
  };
};

export const sendMessage = async (
  message: string,
  token: string | null,
  history: ChatMessage[] = [],
): Promise<SendMessageResponse> => {
  void token;
  requireUid();

  // Pre-flight limit check using local profile (fast, avoids a round-trip)
  const status = await getChatStatus(null);
  if (!status.is_subscribed && status.limit_reached) {
    throw new ChatLimitError();
  }

  // Delegate AI reply to the Laravel API (OpenAI key stays on the server)
  const data = await requestLaravelChat<SendMessageResponse>("/chat/send", {
    message,
    history,
  });

  return data;
};

export const getChatHistory = async (
  token: string | null,
): Promise<ChatHistoryResponse> => {
  void token;
  const uid = requireUid();

  // Chat history is stored in Firestore by the React Native app itself
  const q = query(
    collection(firestore, "users", uid, "chatMessages"),
    orderBy("created_at", "asc"),
    limitQuery(100),
  );
  const snap = await getDocs(q);

  return {
    messages: snap.docs.map((item) => {
      const data = item.data();
      return { role: data.role, text: data.text } as ChatMessage;
    }),
  };
};

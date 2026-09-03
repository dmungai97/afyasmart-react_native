import Constants from "expo-constants";
import {
  collection,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";
import { callFunction, FunctionApiError } from "./functionsApi";
import {
  FREE_CHAT_LIMIT,
  canUseFreeChats,
  isSubscriptionActive,
} from "./subscription.model";

type FirebaseExtra = {
  mpesaApiBaseUrl?: string;
  useSupabaseFunctions?: boolean;
};
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;

// chatSend went through Firebase Cloud Functions (via callFunction below),
// which requires the Blaze billing plan to deploy at all. The Supabase
// "chat" Edge Function (supabase/functions/chat) covers the same route —
// see mpesa.service.ts for the same reasoning. Reuses the mpesaApiBaseUrl
// field since it's really "the non-Firebase functions base URL" now, shared
// across mpesa/symptoms/chat.
const USE_SUPABASE_FUNCTIONS =
  process.env.EXPO_PUBLIC_USE_SUPABASE_FUNCTIONS === "true" || extra.useSupabaseFunctions === true;

const supabaseFunctionsBaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_BASE_URL ?? extra.mpesaApiBaseUrl ?? "";

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
  time?: string;
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

  // Delegate AI reply to the chat backend (OpenAI key stays server-side)
  try {
    if (USE_SUPABASE_FUNCTIONS) {
      const idToken = await firebaseAuth.currentUser?.getIdToken();
      const response = await fetch(`${supabaseFunctionsBaseUrl}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 403 && data?.limit_reached) {
          throw new ChatLimitError();
        }
        throw new Error(data?.message ?? "Chat request failed.");
      }

      return data as SendMessageResponse;
    }

    return await callFunction<SendMessageResponse>("chatSend", {
      body: { message, history },
    });
  } catch (error) {
    if (error instanceof ChatLimitError) throw error;
    if (error instanceof FunctionApiError && error.status === 403 && error.data?.limit_reached) {
      throw new ChatLimitError();
    }
    throw error;
  }
};

// Firestore Timestamp values expose .toDate() once resolved; a doc read back
// immediately after a serverTimestamp() write can briefly have it as null
// (pending server confirmation), so this falls back gracefully.
const formatMessageTime = (value: unknown): string => {
  const date = (value as { toDate?: () => Date } | null | undefined)?.toDate?.();
  return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
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
      return { role: data.role, text: data.text, time: formatMessageTime(data.created_at) } as ChatMessage;
    }),
  };
};

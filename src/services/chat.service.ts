import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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

const requireUid = () => {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to use chat.");
  return uid;
};

const buildReply = (message: string) => {
  const text = message.toLowerCase();

  if (text.includes("headache")) {
    return "Headaches can be caused by dehydration, stress, or lack of sleep. Try drinking water and resting. If it persists, consult a doctor.";
  }

  if (text.includes("fever")) {
    return "A fever above 38°C may indicate infection. Rest, stay hydrated, and seek medical attention if it exceeds 39.5°C or lasts more than 3 days.";
  }

  if (text.includes("hello") || text.includes("hi")) {
    return "Hello! I am AfyaSmart AI. How can I help you with your health question today?";
  }

  return "Thank you for your question. For accurate medical advice, please consult a licensed healthcare provider.";
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
): Promise<SendMessageResponse> => {
  void token;
  const uid = requireUid();
  const status = await getChatStatus(null);

  if (!status.is_subscribed && status.limit_reached) {
    throw new ChatLimitError();
  }

  const reply = buildReply(message);
  const nextCount = status.chat_count + 1;
  const messagesRef = collection(firestore, "users", uid, "chatMessages");

  await addDoc(messagesRef, {
    role: "user",
    text: message,
    created_at: serverTimestamp(),
  });

  await addDoc(messagesRef, {
    role: "ai",
    text: reply,
    created_at: serverTimestamp(),
  });

  await updateDoc(doc(firestore, "users", uid), {
    chat_count: nextCount,
    updated_at: serverTimestamp(),
  });

  return {
    reply,
    chat_count: nextCount,
    limit: FREE_CHAT_LIMIT,
    is_subscribed: status.is_subscribed,
  };
};

export const getChatHistory = async (
  token: string | null,
): Promise<ChatHistoryResponse> => {
  void token;
  const uid = requireUid();
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

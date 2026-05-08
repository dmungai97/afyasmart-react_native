import api from './api';

export interface ChatMessage {
  role: 'user' | 'ai';
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
  limit_reached: boolean;
  remaining: number;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

// Custom error thrown when free limit is hit
export class ChatLimitError extends Error {
  constructor() {
    super('LIMIT_REACHED');
    this.name = 'ChatLimitError';
  }
}

export const sendMessage = async (
  message: string,
  token: string | null
): Promise<SendMessageResponse> => {
  try {
    const response = await api.post(
      '/chat/send',
      { message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    // Backend returns 403 with limit_reached: true
    if (error?.response?.status === 403 && error?.response?.data?.limit_reached) {
      throw new ChatLimitError();
    }
    throw error;
  }
};

export const getChatStatus = async (
  token: string | null
): Promise<ChatStatusResponse> => {
  const response = await api.get('/chat/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getChatHistory = async (
  token: string | null
): Promise<ChatHistoryResponse> => {
  const response = await api.get('/chat/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
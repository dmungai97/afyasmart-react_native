// src/services/chat.service.ts

import api from './api';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface SendMessageResponse {
  reply: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

export const sendMessage = async (
  message: string,
  token: string | null
): Promise<SendMessageResponse> => {
  const response = await api.post(
    '/chat/send',
    { message },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
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
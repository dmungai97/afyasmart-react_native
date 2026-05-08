// src/services/auth.service.ts

import api from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_subscribed: boolean;
  chat_count: number;
  subscription_expires_at: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  password_confirmation: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', {
    name, email, phone, password, password_confirmation,
  });
  return response.data;
};

export const logoutUser = async (token: string): Promise<void> => {
  await api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
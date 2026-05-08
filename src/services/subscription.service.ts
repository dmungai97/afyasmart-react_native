import api from './api';

export const subscribeUser = async (
  token: string | null,
  plan: string
): Promise<{ subscription_expires_at: string }> => {
  const response = await api.post(
    '/chat/subscribe',
    { plan },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
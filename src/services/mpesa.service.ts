import api from './api';

export const initiateMpesa = async (
  token: string | null,
  phone: string,
  plan: string
): Promise<{ checkout_request_id: string }> => {
  const response = await api.post(
    '/mpesa/initiate',
    { phone, plan },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const pollMpesaStatus = async (
  token: string | null,
  checkoutRequestId: string
): Promise<{ paid: boolean; status: string }> => {
  const response = await api.post(
    '/mpesa/status',
    { checkout_request_id: checkoutRequestId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
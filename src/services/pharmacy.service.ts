import api from './api';

export const getPharmacies = async (token: string, search?: string) => {
  const url = search ? `/pharmacies?search=${search}` : '/pharmacies';
  const response = await api.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
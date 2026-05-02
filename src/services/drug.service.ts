import api from './api';

export const searchDrugs = async (query: string, token: string) => {
  const response = await api.get(`/drugs?search=${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getDrug = async (id: number, token: string) => {
  const response = await api.get(`/drugs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
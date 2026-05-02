import api from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  hospital: string;
  location: string;
  region?: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  experience_years: number;
  rating: number;
  availability: string;
  available: boolean;
  distance_km?: number;
}

export interface DoctorsResponse {
  status: string;
  count: number;
  data: Doctor[];
}

export interface ListResponse {
  status: string;
  data: string[];
}

// ── Doctors ──────────────────────────────────────────────────────────────────

export const fetchNearbyDoctors = async (
  token: string,
  options?: {
    specialization?: string;
    search?:         string;
    available?:      boolean;
    region?:         string;
    lat?:            number;
    lng?:            number;
    radius?:         number;  // omit for national browse; pass only for "Near me" hard cutoff
  }
): Promise<DoctorsResponse> => {
  const params: Record<string, string> = {};

  if (options?.specialization)               params.specialization = options.specialization;
  if (options?.search)                       params.search         = options.search;
  if (options?.available !== undefined)      params.available      = String(options.available);
  if (options?.region)                       params.region         = options.region;
  if (options?.lat != null)                  params.lat            = String(options.lat);
  if (options?.lng != null)                  params.lng            = String(options.lng);

  // ⚠️  Only attach radius when explicitly provided.
  // Omitting it tells the backend to sort by distance but return ALL doctors.
  // Passing it triggers the HAVING distance_km <= ? cutoff ("Near me" mode).
  if (options?.radius != null)               params.radius         = String(options.radius);

  const response = await api.get('/doctors', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export const fetchDoctor = async (id: number, token: string): Promise<Doctor> => {
  const response = await api.get(`/doctors/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

// ── Filter metadata ──────────────────────────────────────────────────────────

export const fetchRegions = async (token: string): Promise<string[]> => {
  const response = await api.get<ListResponse>('/doctors/regions', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data.map(
    (r) => r.charAt(0).toUpperCase() + r.slice(1)
  );
};

export const fetchSpecializations = async (token: string): Promise<string[]> => {
  const response = await api.get<ListResponse>('/doctors/specializations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};
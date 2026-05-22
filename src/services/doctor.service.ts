import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";

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

const numericId = (id: string, index = 0) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : index + 1;
};

const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const mapDoctor = (id: string, data: any, index = 0): Doctor => ({
  id: numericId(id, index),
  name: data.name ?? "",
  specialization: data.specialization ?? "",
  hospital: data.hospital ?? "",
  location: data.location ?? "",
  region: data.region ?? undefined,
  phone: data.phone ?? "",
  email: data.email ?? "",
  latitude: Number(data.latitude ?? 0),
  longitude: Number(data.longitude ?? 0),
  experience_years: Number(data.experience_years ?? 0),
  rating: Number(data.rating ?? 0),
  availability: data.availability ?? "",
  available: Boolean(data.available),
});

export const fetchNearbyDoctors = async (
  token: string,
  options?: {
    specialization?: string;
    search?: string;
    available?: boolean;
    region?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  },
): Promise<DoctorsResponse> => {
  void token;
  const snap = await getDocs(collection(firestore, "doctors"));
  const search = options?.search?.toLowerCase().trim();
  const region = options?.region?.toLowerCase().trim();
  const specialization = options?.specialization?.toLowerCase().trim();

  let doctors = snap.docs.map((item, index) =>
    mapDoctor(item.id, item.data(), index),
  );

  doctors = doctors.filter((doctor) => {
    if (options?.available !== undefined && doctor.available !== options.available) {
      return false;
    }
    if (region && doctor.region?.toLowerCase() !== region) return false;
    if (specialization && doctor.specialization.toLowerCase() !== specialization) {
      return false;
    }
    if (search) {
      const haystack = [
        doctor.name,
        doctor.specialization,
        doctor.hospital,
        doctor.location,
        doctor.region,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  if (options?.lat != null && options?.lng != null) {
    doctors = doctors
      .map((doctor) => ({
        ...doctor,
        distance_km: Number(
          distanceKm(
            options.lat!,
            options.lng!,
            doctor.latitude,
            doctor.longitude,
          ).toFixed(1),
        ),
      }))
      .filter(
        (doctor) =>
          options.radius == null || (doctor.distance_km ?? Infinity) <= options.radius,
      )
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  }

  return { status: "success", count: doctors.length, data: doctors };
};

export const fetchDoctor = async (id: number, token: string): Promise<Doctor> => {
  void token;
  const snap = await getDoc(doc(firestore, "doctors", String(id)));
  if (!snap.exists()) throw new Error("Doctor not found.");
  return mapDoctor(snap.id, snap.data());
};

export const fetchRegions = async (token: string): Promise<string[]> => {
  void token;
  const snap = await getDocs(collection(firestore, "doctors"));
  const regions = new Set<string>();
  snap.docs.forEach((item) => {
    const region = item.data().region;
    if (region) regions.add(region.charAt(0).toUpperCase() + region.slice(1));
  });
  return [...regions].sort();
};

export const fetchSpecializations = async (token: string): Promise<string[]> => {
  void token;
  const snap = await getDocs(collection(firestore, "doctors"));
  const specializations = new Set<string>();
  snap.docs.forEach((item) => {
    const specialization = item.data().specialization;
    if (specialization) specializations.add(specialization);
  });
  return [...specializations].sort();
};

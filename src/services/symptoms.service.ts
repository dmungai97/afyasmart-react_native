import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseAuth } from "./firebase";

export interface SymptomsAnalysisRequest {
  symptoms: string[];
  age: number;
  gender: string;
  duration: string;
  severity: string;
  answers: Record<string, string>;
}

export interface ConditionResult {
  name: string;
  likelihood: "High" | "Medium" | "Low";
  percent: number;
  color: string;
}

export interface MedicationResult {
  name: string;
  desc: string;
  icon: string;
}

export interface SymptomsAnalysisResponse {
  urgency: "High" | "Medium" | "Low";
  urgency_desc: string;
  conditions: ConditionResult[];
  medications: MedicationResult[];
  self_care: string[];
}

export interface SymptomsClarifyResponse {
  done: boolean;
  question?: string;
  options?: string[];
  duration?: string;
}

type FirebaseExtra = {
  mpesaApiBaseUrl?: string;
  functionsBaseUrl?: string;
  useFirebaseFunctions?: boolean;
};
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;

// Toggle this flag to switch between the legacy Laravel API and Firebase Cloud Functions
const USE_FIREBASE_FUNCTIONS =
  process.env.EXPO_PUBLIC_USE_FIREBASE_FUNCTIONS === "true" || extra.useFirebaseFunctions === true;

const symptomsApiBaseUrl = USE_FIREBASE_FUNCTIONS
  ? (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? extra.functionsBaseUrl ?? "https://us-central1-afya-smart-377ad.cloudfunctions.net")
  : (process.env.EXPO_PUBLIC_MPESA_API_BASE_URL ?? extra.mpesaApiBaseUrl ?? "https://afyasmart-ey9q.onrender.com/api/v1");

// Onboarding lets users check symptoms before creating an account, so these
// endpoints identify the caller by a locally persisted guest id rather than
// requiring a Firebase Auth session.
const resolveFirebaseUid = async (): Promise<string> => {
  const existing = firebaseAuth.currentUser?.uid;
  if (existing) return existing;

  const guestUuid = await AsyncStorage.getItem("guest_uuid");
  if (guestUuid) return guestUuid;

  const generated = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  await AsyncStorage.setItem("guest_uuid", generated);
  return generated;
};

export const requestSymptomsAnalysis = async (
  input: Omit<SymptomsAnalysisRequest, "firebase_uid">,
): Promise<SymptomsAnalysisResponse> => {
  const firebase_uid = await resolveFirebaseUid();

  const endpoint = USE_FIREBASE_FUNCTIONS
    ? `${symptomsApiBaseUrl}/symptomsAnalyze`
    : `${symptomsApiBaseUrl}/symptoms/analyze`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, firebase_uid }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message ?? "Failed to analyze symptoms. Please try again.");
  }

  if (body?.status === "success" && body?.data) {
    return body.data as SymptomsAnalysisResponse;
  }

  throw new Error("Invalid response format received from the server.");
};

// Best-effort — only available on the Firebase Functions path, and fails
// safe to `{ done: true }` on any error so a flaky/unreachable endpoint never
// blocks the onboarding funnel. Callers should treat a missing `duration` on
// a `done: true` result as "clarification wasn't available", not "the user
// has no symptom duration".
export const requestSymptomsClarification = async (params: {
  symptom: string;
  age: number;
  severity: string;
  history: { question: string; answer: string }[];
}): Promise<SymptomsClarifyResponse> => {
  if (!USE_FIREBASE_FUNCTIONS) {
    return { done: true };
  }

  try {
    const firebase_uid = await resolveFirebaseUid();

    const response = await fetch(`${symptomsApiBaseUrl}/symptomsClarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_uid, ...params }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.status !== "success" || !body?.data) {
      return { done: true };
    }

    return body.data as SymptomsClarifyResponse;
  } catch {
    return { done: true };
  }
};

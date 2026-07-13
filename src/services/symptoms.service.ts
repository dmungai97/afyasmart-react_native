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

// Toggle this flag to switch between custom Laravel API and full Firebase Cloud Functions in the future
const USE_FIREBASE_FUNCTIONS = process.env.EXPO_PUBLIC_USE_FIREBASE_FUNCTIONS === "true";

type FirebaseExtra = { mpesaApiBaseUrl?: string; functionsBaseUrl?: string };
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;

const symptomsApiBaseUrl = USE_FIREBASE_FUNCTIONS
  ? (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? extra.functionsBaseUrl ?? "https://us-central1-afya-smart-377ad.cloudfunctions.net")
  : (process.env.EXPO_PUBLIC_MPESA_API_BASE_URL ?? extra.mpesaApiBaseUrl ?? "https://afyasmart-ey9q.onrender.com/api/v1");

export const requestSymptomsAnalysis = async (
  input: Omit<SymptomsAnalysisRequest, "firebase_uid">,
): Promise<SymptomsAnalysisResponse> => {
  let firebase_uid: string | undefined = firebaseAuth.currentUser?.uid || undefined;
  if (!firebase_uid) {
    // Generate or retrieve a persistent guest UUID for unauthenticated onboarding symptom checks
    const guestUuid = await AsyncStorage.getItem("guest_uuid");
    if (guestUuid) {
      firebase_uid = guestUuid;
    } else {
      firebase_uid = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      await AsyncStorage.setItem("guest_uuid", firebase_uid);
    }
  }

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

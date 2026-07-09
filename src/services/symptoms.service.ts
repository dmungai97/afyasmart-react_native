import Constants from "expo-constants";
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

type FirebaseExtra = { mpesaApiBaseUrl?: string };
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;
const symptomsApiBaseUrl =
  process.env.EXPO_PUBLIC_MPESA_API_BASE_URL ??
  extra.mpesaApiBaseUrl ??
  "https://afyasmart-ey9q.onrender.com/api/v1";

export const requestSymptomsAnalysis = async (
  input: Omit<SymptomsAnalysisRequest, "firebase_uid">,
): Promise<SymptomsAnalysisResponse> => {
  const firebase_uid = firebaseAuth.currentUser?.uid;
  if (!firebase_uid) throw new Error("You must be signed in to analyze symptoms.");

  const response = await fetch(`${symptomsApiBaseUrl}/symptoms/analyze`, {
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

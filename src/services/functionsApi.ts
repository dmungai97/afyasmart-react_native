import Constants from "expo-constants";
import { firebaseAuth } from "./firebase";

type FirebaseExtra = {
  projectId?: string;
  functionsRegion?: string;
  functionsBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;
const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extra.projectId;
const region =
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION ??
  extra.functionsRegion ??
  "us-central1";

const baseUrl =
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_BASE_URL ??
  extra.functionsBaseUrl ??
  (projectId ? `https://${region}-${projectId}.cloudfunctions.net` : "");

export class FunctionApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.message ?? "Firebase function request failed.");
    this.name = "FunctionApiError";
    this.status = status;
    this.data = data;
  }
}

export const callFunction = async <T>(
  name: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    token?: string | null;
  } = {},
): Promise<T> => {
  if (!baseUrl) {
    throw new Error("Missing Firebase Functions base URL.");
  }

  const idToken =
    options.token ?? (await firebaseAuth.currentUser?.getIdToken());

  const response = await fetch(`${baseUrl}/${name}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new FunctionApiError(response.status, data);
  }

  return data as T;
};

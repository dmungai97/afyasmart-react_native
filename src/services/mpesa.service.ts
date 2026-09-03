import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseAuth } from "./firebase";
import { useAuthStore } from "../store/authStore";

type FirebaseExtra = {
  mpesaApiBaseUrl?: string;
  functionsBaseUrl?: string;
  useFirebaseFunctions?: boolean;
  useSupabaseFunctions?: boolean;
};
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;

// The Supabase mpesa Edge Function writes paymentRequests (and activates
// subscriptions) server-side, so the client never has to. It's the default
// unless Firebase Cloud Functions are explicitly selected: the Firebase
// mpesaInitiate/mpesaStatus functions require the Blaze billing plan to even
// deploy, so this app doesn't run them — see supabase/functions/mpesa.
const USE_SUPABASE_FUNCTIONS =
  process.env.EXPO_PUBLIC_USE_SUPABASE_FUNCTIONS === "true" || extra.useSupabaseFunctions === true;

const USE_FIREBASE_FUNCTIONS =
  !USE_SUPABASE_FUNCTIONS &&
  (process.env.EXPO_PUBLIC_USE_FIREBASE_FUNCTIONS === "true" || extra.useFirebaseFunctions === true);

const mpesaApiBaseUrl = USE_FIREBASE_FUNCTIONS
  ? (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? extra.functionsBaseUrl ?? "https://us-central1-afya-smart-377ad.cloudfunctions.net")
  : (process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_BASE_URL ?? extra.mpesaApiBaseUrl ?? "");

const checkoutPlans = new Map<string, string>();
const lastCheckoutKey = "mpesa_last_checkout_request_id";

const checkoutPlanKey = (checkoutRequestId: string) =>
  `mpesa_checkout_plan:${checkoutRequestId}`;

// Supabase uses the "/mpesa/initiate" & "/mpesa/status" path shape as-is; the
// Firebase Functions backend needs its path remapped to "/mpesaInitiate"/
// "/mpesaStatus".
const requestMpesaBackend = async <T>(
  path: string,
  body: Record<string, unknown>,
  token: string | null,
): Promise<T> => {
  const idToken = token ?? (await firebaseAuth.currentUser?.getIdToken());

  let resolvedPath = path;
  if (USE_FIREBASE_FUNCTIONS) {
    if (path === "/mpesa/initiate") resolvedPath = "/mpesaInitiate";
    else if (path === "/mpesa/status") resolvedPath = "/mpesaStatus";
  }

  const response = await fetch(`${mpesaApiBaseUrl}${resolvedPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({
      ...body,
      firebase_uid: firebaseAuth.currentUser?.uid,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "M-Pesa request failed.");
  }

  return data as T;
};

export const initiateMpesa = async (
  token: string | null,
  phone: string,
  plan: string,
): Promise<{ checkout_request_id: string }> => {
  const data = await requestMpesaBackend<{ checkout_request_id: string }>(
    "/mpesa/initiate",
    { phone, plan },
    token,
  );

  checkoutPlans.set(data.checkout_request_id, plan);
  await AsyncStorage.setItem(lastCheckoutKey, data.checkout_request_id);
  await AsyncStorage.setItem(checkoutPlanKey(data.checkout_request_id), plan);

  return data;
};

export const pollMpesaStatus = async (
  token: string | null,
  checkoutRequestId: string,
): Promise<{ paid: boolean; status: string; message?: string }> => {
  const data = await requestMpesaBackend<{ paid: boolean; status: string; message?: string }>(
    "/mpesa/status",
    { checkout_request_id: checkoutRequestId },
    token,
  );

  if (data.paid) {
    const plan =
      checkoutPlans.get(checkoutRequestId) ??
      (await AsyncStorage.getItem(checkoutPlanKey(checkoutRequestId)));

    // Subscription activation always happens server-side (Admin SDK, verified
    // against the actual M-Pesa result) — just pull the fresh users/{uid} doc
    // into local state. A client-side fallback here would let anyone grant
    // themselves a subscription without paying; Firestore rules block it too
    // (see isSafeUserUpdate in firestore.rules), but this is intentionally
    // not attempted at all.
    await useAuthStore.getState().refreshUser(token ?? "");

    if (plan) {
      checkoutPlans.delete(checkoutRequestId);
      await AsyncStorage.removeItem(lastCheckoutKey);
      await AsyncStorage.removeItem(checkoutPlanKey(checkoutRequestId));
    }
  }

  return data;
};

export const checkLatestMpesaPayment = async (
  token: string | null,
): Promise<{ paid: boolean; status: string; checkout_request_id: string; message?: string } | null> => {
  const checkoutRequestId = await AsyncStorage.getItem(lastCheckoutKey);
  if (!checkoutRequestId) return null;

  const result = await pollMpesaStatus(token, checkoutRequestId);
  return { ...result, checkout_request_id: checkoutRequestId };
};

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";
import { useAuthStore } from "../store/authStore";

type FirebaseExtra = {
  mpesaApiBaseUrl?: string;
  functionsBaseUrl?: string;
  useFirebaseFunctions?: boolean;
  useSupabaseFunctions?: boolean;
};
const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;

// The Supabase mpesa Edge Function speaks the same "/mpesa/initiate" &
// "/mpesa/status" request shape as the legacy Laravel backend below, and
// already writes paymentRequests itself — so it reuses that same code path,
// just with the client-side Firestore write skipped (see savePaymentRequest
// call sites) since the server write is already authoritative there too.
// Takes priority over useFirebaseFunctions: the Firebase mpesaInitiate/
// mpesaStatus functions require the Blaze billing plan to even deploy, so
// this app doesn't run them at all — see supabase/functions/mpesa.
const USE_SUPABASE_FUNCTIONS =
  process.env.EXPO_PUBLIC_USE_SUPABASE_FUNCTIONS === "true" || extra.useSupabaseFunctions === true;

const USE_FIREBASE_FUNCTIONS =
  !USE_SUPABASE_FUNCTIONS &&
  (process.env.EXPO_PUBLIC_USE_FIREBASE_FUNCTIONS === "true" || extra.useFirebaseFunctions === true);

const mpesaApiBaseUrl = USE_SUPABASE_FUNCTIONS
  ? (process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_BASE_URL ?? extra.mpesaApiBaseUrl ?? "https://afyasmart-ey9q.onrender.com/api/v1")
  : USE_FIREBASE_FUNCTIONS
  ? (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? extra.functionsBaseUrl ?? "https://us-central1-afya-smart-377ad.cloudfunctions.net")
  : (process.env.EXPO_PUBLIC_MPESA_API_BASE_URL ?? extra.mpesaApiBaseUrl ?? "https://afyasmart-ey9q.onrender.com/api/v1");

const checkoutPlans = new Map<string, string>();
const lastCheckoutKey = "mpesa_last_checkout_request_id";

const checkoutPlanKey = (checkoutRequestId: string) =>
  `mpesa_checkout_plan:${checkoutRequestId}`;

// Only needed on the legacy Laravel path — Laravel never touches Firestore, so the
// client has to log payment state itself. On the Firebase Functions and Supabase
// Edge Function paths, mpesaInitiate/mpesaStatus already write paymentRequests
// (and activate subscriptions) server-side.
const savePaymentRequest = async (
  checkoutRequestId: string,
  data: Record<string, unknown>,
) => {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;

  try {
    await setDoc(
      doc(firestore, "paymentRequests", checkoutRequestId),
      {
        checkout_request_id: checkoutRequestId,
        uid,
        ...data,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("Payment request log failed", error);
  }
};

// Handles all three backends: Supabase and the legacy Laravel API both use
// the "/mpesa/initiate" & "/mpesa/status" path shape as-is; only the Firebase
// Functions backend needs its path remapped to "/mpesaInitiate"/"/mpesaStatus".
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

  if (!USE_FIREBASE_FUNCTIONS && !USE_SUPABASE_FUNCTIONS) {
    await savePaymentRequest(data.checkout_request_id, {
      phone,
      plan,
      status: "pending",
      paid: false,
      created_at: serverTimestamp(),
    });
  }

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
  } else if (!USE_FIREBASE_FUNCTIONS && !USE_SUPABASE_FUNCTIONS) {
    await savePaymentRequest(checkoutRequestId, {
      status: data.status ?? "pending",
      paid: false,
    });
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

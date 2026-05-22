import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";
import { subscribeUser } from "./subscription.service";

type FirebaseExtra = {
  mpesaApiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtra;

const mpesaApiBaseUrl =
  process.env.EXPO_PUBLIC_MPESA_API_BASE_URL ??
  extra.mpesaApiBaseUrl ??
  "https://afyasmart-ey9q.onrender.com/api/v1";

const checkoutPlans = new Map<string, string>();
const lastCheckoutKey = "mpesa_last_checkout_request_id";

const checkoutPlanKey = (checkoutRequestId: string) =>
  `mpesa_checkout_plan:${checkoutRequestId}`;

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

const requestLaravelMpesa = async <T>(
  path: string,
  body: Record<string, unknown>,
  token: string | null,
): Promise<T> => {
  const idToken = token ?? (await firebaseAuth.currentUser?.getIdToken());
  const response = await fetch(`${mpesaApiBaseUrl}${path}`, {
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
  const data = await requestLaravelMpesa<{ checkout_request_id: string }>(
    "/mpesa/initiate",
    { phone, plan },
    token,
  );

  checkoutPlans.set(data.checkout_request_id, plan);
  await AsyncStorage.setItem(lastCheckoutKey, data.checkout_request_id);
  await AsyncStorage.setItem(checkoutPlanKey(data.checkout_request_id), plan);
  await savePaymentRequest(data.checkout_request_id, {
    phone,
    plan,
    status: "pending",
    paid: false,
    created_at: serverTimestamp(),
  });

  return data;
};

export const pollMpesaStatus = async (
  token: string | null,
  checkoutRequestId: string,
): Promise<{ paid: boolean; status: string }> => {
  const data = await requestLaravelMpesa<{ paid: boolean; status: string }>(
    "/mpesa/status",
    { checkout_request_id: checkoutRequestId },
    token,
  );

  if (data.paid) {
    const plan =
      checkoutPlans.get(checkoutRequestId) ??
      (await AsyncStorage.getItem(checkoutPlanKey(checkoutRequestId)));

    await savePaymentRequest(checkoutRequestId, {
      plan: plan ?? null,
      status: "paid",
      paid: true,
      paid_at: serverTimestamp(),
    });

    if (plan) {
      await subscribeUser(token, plan);
      checkoutPlans.delete(checkoutRequestId);
      await AsyncStorage.removeItem(lastCheckoutKey);
      await AsyncStorage.removeItem(checkoutPlanKey(checkoutRequestId));
    }
  } else if (data.status === "cancelled" || data.status === "failed") {
    await savePaymentRequest(checkoutRequestId, {
      status: data.status,
      paid: false,
    });
  } else {
    await savePaymentRequest(checkoutRequestId, {
      status: data.status ?? "pending",
      paid: false,
    });
  }

  return data;
};

export const checkLatestMpesaPayment = async (
  token: string | null,
): Promise<{ paid: boolean; status: string; checkout_request_id: string } | null> => {
  const checkoutRequestId = await AsyncStorage.getItem(lastCheckoutKey);
  if (!checkoutRequestId) return null;

  const result = await pollMpesaStatus(token, checkoutRequestId);
  return { ...result, checkout_request_id: checkoutRequestId };
};

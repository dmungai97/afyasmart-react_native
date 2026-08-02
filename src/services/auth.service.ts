import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: "user" | "admin" | "super_admin";
  is_subscribed: boolean;
  has_subscribed: boolean;
  onboarding_completed: boolean;
  subscription_plan?: string | null;
  chat_count: number;
  subscription_expires_at: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  isNewUser?: boolean;
}

const defaultUser = (
  uid: string,
  name: string,
  email: string,
  phone?: string,
): AuthUser => ({
  id: uid,
  name,
  email,
  phone: phone ?? "",
  role: "user",
  is_subscribed: false,
  has_subscribed: false,
  onboarding_completed: false,
  subscription_plan: "free",
  chat_count: 0,
  subscription_expires_at: null,
});

const normalizeDateValue = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return null;
};

const isStoredSubscriptionActive = (isSubscribed: unknown, expiresAt: string | null) => {
  if (!isSubscribed) return false;
  if (!expiresAt) return true;

  const expiryTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiryTime) && expiryTime > Date.now();
};

export const normalizeUser = (id: string, data: any): AuthUser => {
  const subscriptionExpiresAt = normalizeDateValue(data?.subscription_expires_at);
  const isSubscribed = isStoredSubscriptionActive(
    data?.is_subscribed,
    subscriptionExpiresAt,
  );

  return {
    id,
    name: data?.name ?? data?.displayName ?? "AfyaSmart User",
    email: data?.email ?? "",
    phone: data?.phone ?? undefined,
    role: data?.role === "admin" || data?.role === "super_admin" ? data.role : "user",
    is_subscribed: isSubscribed,
    has_subscribed: Boolean(
      data?.has_subscribed
        || data?.is_subscribed
        || subscriptionExpiresAt
        || ["daily", "weekly", "monthly"].includes(data?.subscription_plan),
    ),
    onboarding_completed: Boolean(data?.onboarding_completed),
    subscription_plan: data?.subscription_plan ?? "free",
    chat_count: Number(data?.chat_count ?? 0),
    subscription_expires_at: subscriptionExpiresAt,
  };
};

const getOrCreateCurrentUserProfile = async (): Promise<{
  user: AuthUser | null;
  isNewUser: boolean;
}> => {
  const current = firebaseAuth.currentUser;
  if (!current) return { user: null, isNewUser: false };

  const snap = await getDoc(doc(firestore, "users", current.uid));
  if (!snap.exists()) {
    const user = defaultUser(
      current.uid,
      current.displayName ?? "AfyaSmart User",
      current.email ?? "",
    );
    await setDoc(
      doc(firestore, "users", current.uid),
      { ...user, created_at: serverTimestamp(), updated_at: serverTimestamp() },
      { merge: true },
    );
    return { user, isNewUser: true };
  }

  return { user: normalizeUser(current.uid, snap.data()), isNewUser: false };
};

export const getCurrentUserProfile = async (): Promise<AuthUser | null> => {
  const { user } = await getOrCreateCurrentUserProfile();
  return user;
};

export const markOnboardingCompleted = async (): Promise<void> => {
  const current = firebaseAuth.currentUser;
  if (!current) return;

  await updateDoc(doc(firestore, "users", current.uid), {
    onboarding_completed: true,
    updated_at: serverTimestamp(),
  });
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );
  const token = await credential.user.getIdToken();
  const { user } = await getOrCreateCurrentUserProfile();

  if (!user) throw new Error("Unable to load Firebase user profile.");
  return { token, user };
};

// Resolves a human-readable referral code (?ref=AFYA-XXXXX) to the referring
// user's uid via the public affiliateCodes mapping. This can only be read
// once the new account is signed in (the mapping requires auth), which is
// why this runs after createUserWithEmailAndPassword below, not before.
const resolveReferrerUid = async (ref?: string | null): Promise<string | null> => {
  if (!ref) return null;
  try {
    const snap = await getDoc(doc(firestore, "affiliateCodes", ref));
    return snap.exists() ? ((snap.data().uid as string) ?? null) : null;
  } catch {
    return null;
  }
};

export const registerUser = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  password_confirmation: string,
  referralCode?: string | null,
): Promise<AuthResponse> => {
  if (password !== password_confirmation) {
    throw new Error("Passwords do not match.");
  }

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );

  await updateProfile(credential.user, { displayName: name.trim() });

  const user = defaultUser(
    credential.user.uid,
    name.trim(),
    email.trim(),
    phone.trim(),
  );

  // Resolved now that the account exists and is signed in. A referral code
  // that fails to resolve (typo, unenrolled affiliate) is silently dropped
  // rather than blocking registration.
  const referredByUid = await resolveReferrerUid(referralCode);

  // referred_by_uid is only ever set here, at account creation — Firestore
  // rules don't allow it to change afterward, so referral attribution can't
  // be gamed retroactively.
  await setDoc(doc(firestore, "users", credential.user.uid), {
    ...user,
    ...(referredByUid ? { referred_by_uid: referredByUid } : {}),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const token = await credential.user.getIdToken();
  return { token, user, isNewUser: true };
};

export const signInWithGoogleIdToken = async (
  idToken: string,
): Promise<AuthResponse> => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(firebaseAuth, credential);
  const token = await result.user.getIdToken();
  const { user, isNewUser } = await getOrCreateCurrentUserProfile();

  if (!user) throw new Error("Unable to load Firebase user profile.");
  return { token, user, isNewUser };
};

export const logoutUser = async (): Promise<void> => {
  await signOut(firebaseAuth);
};

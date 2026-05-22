import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./firebase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_subscribed: boolean;
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
  is_subscribed: false,
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

export const normalizeUser = (id: string, data: any): AuthUser => ({
  id,
  name: data?.name ?? data?.displayName ?? "AfyaSmart User",
  email: data?.email ?? "",
  phone: data?.phone ?? undefined,
  is_subscribed: Boolean(data?.is_subscribed),
  subscription_plan: data?.subscription_plan ?? "free",
  chat_count: Number(data?.chat_count ?? 0),
  subscription_expires_at: normalizeDateValue(data?.subscription_expires_at),
});

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

export const registerUser = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  password_confirmation: string
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

  await setDoc(doc(firestore, "users", credential.user.uid), {
    ...user,
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

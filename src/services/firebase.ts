import Constants from "expo-constants";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import * as FirebaseAuth from "@firebase/auth";

type FirebaseExtraConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

const extra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebaseExtraConfig;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? extra.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? extra.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extra.projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? extra.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    extra.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? extra.appId,
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? extra.measurementId,
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.warn(
    `Missing Firebase config: ${missingConfig.join(
      ", ",
    )}. Set EXPO_PUBLIC_FIREBASE_* values or app.json expo.extra.firebase.`,
  );
}

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const authModule = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence?: (
    storage: typeof ReactNativeAsyncStorage,
  ) => FirebaseAuth.Persistence;
};

export const firebaseAuth =
  Platform.OS === "web"
    ? FirebaseAuth.getAuth(firebaseApp)
    : (() => {
        try {
          return FirebaseAuth.initializeAuth(firebaseApp, {
            persistence: authModule.getReactNativePersistence?.(
              ReactNativeAsyncStorage,
            ),
          });
        } catch {
          return FirebaseAuth.getAuth(firebaseApp);
        }
      })();
export const firestore = getFirestore(firebaseApp);

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "resumeanalyzer2505",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "671188436706",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if API Key is configured in environment
const isFirebaseConfigured = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const app = isFirebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, isFirebaseConfigured };

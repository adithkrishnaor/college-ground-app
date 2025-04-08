// Import the functions you need from the SDKs you need
//import { API_KEY, AUTH_DOMAIN } from "../config";
import Constants from "expo-constants";
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: "college-ground-app-f6cc1",
  storageBucket: "college-ground-app-f6cc1.firebasestorage.app",
  messagingSenderId: "354834929396",
  appId: "1:354834929396:web:38828fdd0c8cba0c6ab0a1",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

export function FirebaseProvider({ children }) {
  return <>{children}</>;
}

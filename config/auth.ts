// firebase/auth.ts - Updated functions

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./FirebaseConfig"; // Adjust import based on your actual config

// Error handling helper
const handleFirebaseError = (error: any): string => {
  console.error("Firebase error:", error);

  // Common Firebase auth errors
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password";
    case "auth/weak-password":
      return "Password is too weak";
    case "permission-denied":
    case "firebase/permission-denied":
      return "Permission denied: You may not have access to this resource";
    default:
      return error.message || "An unexpected error occurred";
  }
};

export const getUserRole = async (uid: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role || "user";
    }
    return "user"; // Default to user role if not specified
  } catch (error) {
    console.error("Error getting user role:", error);
    // If permission denied, return default role instead of failing
    return "user";
  }
};

// Check if user is admin with error handling
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role === "admin";
    }
    return false; // Default to not admin
  } catch (error) {
    console.error("Error checking admin status:", error);
    // Handle permission error gracefully
    return false; // Default to not admin on error
  }
};

// Login function with better error handling
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    // On successful login, set user role in local storage for quick access
    try {
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role || "user";
        // If using localStorage in a web environment:
        // localStorage.setItem('userRole', role);
      }
    } catch (roleError) {
      console.error("Non-critical error getting role:", roleError);
      // Continue even if role fetch fails
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: { message: handleFirebaseError(error) } };
  }
};

// Register function with error handling
export const registerUser = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Store user data in Firestore
    try {
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date(),
        role: "user", // Default role
      });
    } catch (profileError) {
      console.error("Error creating user profile:", profileError);
      // Consider deleting the auth user if profile creation fails
      // await userCredential.user.delete();
      return {
        user: null,
        error: { message: "Failed to create user profile" },
      };
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: { message: handleFirebaseError(error) } };
  }
};

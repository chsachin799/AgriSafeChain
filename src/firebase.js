// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Get the raw environment variable value
const firebaseConfigRaw = process.env.REACT_APP_FIREBASE_CONFIG;

// Parse Firebase config from .env
let firebaseConfig = {};
try {
  // Check if the variable is a non-empty string and not the literal "undefined"
  if (firebaseConfigRaw && firebaseConfigRaw !== "undefined") {
    firebaseConfig = JSON.parse(firebaseConfigRaw);
  } else {
    console.warn("REACT_APP_FIREBASE_CONFIG is not set or is invalid. Using default config.");
    firebaseConfig = {};
  }
} catch (err) {
  console.error("Invalid Firebase config JSON:", err);
  // Fallback to an empty object to prevent app from crashing
  firebaseConfig = {};
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export them for use in other files
export { app, auth, db, storage };

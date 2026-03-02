import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * TO FIX SIGNUP:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Select your project -> Project Settings (gear icon) -> General.
 * 3. Scroll down to "Your apps" and copy the firebaseConfig object.
 * 4. Replace the placeholders below with your actual values.
 */
const firebaseConfig = {
  apiKey: "AIzaSyD5ybjXQ3YfEDEXsR-IbbBJgf9hnWV1oxM",
  authDomain: "cgpa-calculator-36a3a.firebaseapp.com",
  projectId: "cgpa-calculator-36a3a",
  storageBucket: "cgpa-calculator-36a3a.firebasestorage.app",
  messagingSenderId: "933465162638",
  appId: "1:933465162638:web:ab59ae99fad3fcb7b15adf",
  measurementId: "G-WHTJ3J0EST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
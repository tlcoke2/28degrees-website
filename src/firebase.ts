import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Log environment variables for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('Firebase Config Environment Variables:', {
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasStorageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    hasMessagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
    hasMeasurementId: !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  });
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  // Check if Firebase is already initialized to avoid duplicate initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Log successful initialization
  console.log('Firebase initialized successfully');
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('Firebase services initialized');
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error; // Re-throw to prevent the app from starting with a broken Firebase config
}

// Export the Firebase services
export { auth, db, storage };
export default app;

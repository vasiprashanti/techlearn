import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Only initialize Firebase if credentials are provided
let app = null;
let auth = null;

try {
  // Check if at least API key and project ID are present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
  } else {
    // Firebase not configured. Google OAuth will be unavailable.
    // Keep silent in dev to avoid noisy console logs.
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization failed:', error.message);
  console.log('💡 Google OAuth disabled. Use email/password authentication instead.');
}

export { auth };
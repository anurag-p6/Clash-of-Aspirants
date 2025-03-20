import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Hard-coded config for testing - replace with your actual values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBSXwQ7Q8dOOrp0mPgiAURhUyZbLHewdyk",
  authDomain: "clash-of-aspirant.firebaseapp.com",
  projectId: "clash-of-aspirant",
  storageBucket: "clash-of-aspirant.firebasestorage.app",
  messagingSenderId: "1090528188773",
  appId: "1:1090528188773:web:3a8aee897d24c5e039698c",
  measurementId: "G-N2M49RKLC8"
};

// Log config for debugging
console.log('Firebase config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket // Add this to check
});

// Initialize Firebase if it hasn't been initialized yet
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
  } else {
    app = getApp();
    console.log('Firebase app already initialized');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Auth
const auth = getAuth(app);

// Use emulator if in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  console.log('Using Firebase Auth emulator');
}

export { app, auth }; 
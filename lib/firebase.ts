// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Replace with the new configuration from your newly created Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyDDFNUyOzgRfZS1jQUOg5xAPWljHvHac1A",
  authDomain: "clash-of-aspirant-e42ad.firebaseapp.com",
  projectId: "clash-of-aspirant-e42ad",
  storageBucket: "clash-of-aspirant-e42ad.appspot.com",
  messagingSenderId: "12785445159",
  appId: "1:12785445159:web:fb90d349fd0b46bc30e102",
  measurementId: "G-HL7GNFQRJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { app, auth }; 
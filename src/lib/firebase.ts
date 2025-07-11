
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPp07PuQ7-Y4ZHecsWJNPjQaZ7wmHUsTQ",
  authDomain: "context-intelligence.firebaseapp.com",
  projectId: "context-intelligence",
  storageBucket: "context-intelligence.appspot.com",
  messagingSenderId: "702465558183",
  appId: "1:702465558183:web:76df1ac90c9e7d82ea3d82",
  measurementId: "G-8Z4LX7NNV7"
};

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { firebaseApp };

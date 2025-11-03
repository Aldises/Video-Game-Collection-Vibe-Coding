// Fix: Changed imports to support Firebase v8 namespaced API.
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Firebase configuration from your project settings
const firebaseConfig = {
  apiKey: "AIzaSyCzivd0Bvy82TJnb69W1Vn5OzsfHKJfm0Y",
  authDomain: "vide-game-collectoin.firebaseapp.com",
  projectId: "vide-game-collectoin",
  storageBucket: "vide-game-collectoin.firebasestorage.app",
  messagingSenderId: "419612953743",
  appId: "1:419612953743:web:81b4e2ce1d9592810274fa",
  measurementId: "G-6C45FGJSP6"
};

// Initialize Firebase
// Fix: Use v8 `firebase.initializeApp` syntax.
const app = firebase.initializeApp(firebaseConfig);

// Initialize and export Firebase services
// Fix: Use v8 `firebase.auth()` and `firebase.firestore()` syntax.
export const auth = firebase.auth();
export const db = firebase.firestore();

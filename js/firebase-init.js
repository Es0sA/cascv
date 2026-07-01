/* ============================================================
   CAS CV Builder — firebase-init.js
   Single source of truth for the Firebase app + auth instance.
   Every page that needs Firebase imports from this file instead
   of re-initializing its own copy.
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAh49ffWEnRg1PmlaCj3blcEM5xP1Mas24",
  authDomain: "cas-cv-builder.firebaseapp.com",
  projectId: "cas-cv-builder",
  storageBucket: "cas-cv-builder.firebasestorage.app",
  messagingSenderId: "777848218496",
  appId: "1:777848218496:web:752bd7af2dad1f4ef2d765"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

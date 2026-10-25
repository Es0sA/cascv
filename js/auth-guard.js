/* ============================================================
   CAS CV Builder — auth-guard.js
   Real Firebase auth check, replacing the old sessionStorage
   password-flag approach. Loaded as a module on dashboard.html
   and editor.html.

   Because Firebase's auth check is asynchronous (it has to look
   up persisted sign-in state), the page's <head> sets
   `body { visibility: hidden }` via inline CSS so nothing is
   ever shown before we know for sure the person is signed in.
   This script either reveals the page or redirects to login —
   whichever happens first, the person never sees a flash of
   content they shouldn't.
   ============================================================ */
import { auth } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Single source of truth: onAuthStateChanged. Fires once immediately with the
// current persisted user, so no separate authStateReady race is needed.
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.casUser = user;
    document.body.style.visibility = "visible";
  } else if (!window.__casSigningOut) {
    window.location.replace("login.html");
  }
});

// Exposed so dashboard.js (a classic, non-module script) can call
// it from the existing "Sign Out" button without needing to
// import Firebase itself.
window.casSignOut = function () {
  window.__casSigningOut = true;
  return signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

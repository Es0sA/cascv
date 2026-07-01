/* ============================================================
   CAS CV Builder — auth.js (Login Page)
   Real Firebase email/password auth, replacing the old
   hardcoded username/password check.
   ============================================================ */
import { auth } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// If already signed in, skip straight to dashboard.
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "dashboard.html";
});

// Elements
const signinBtn   = document.getElementById('signinBtn');
const usernameInp = document.getElementById('username');
const passwordInp = document.getElementById('password');
const errorMsg    = document.getElementById('errorMsg');
const togglePwd   = document.getElementById('togglePwd');
const eyeOpen     = document.getElementById('eyeOpen');
const eyeClosed   = document.getElementById('eyeClosed');
const btnText     = document.getElementById('btnText');

// Toggle password visibility
togglePwd.addEventListener('click', () => {
  const isHidden = passwordInp.type === 'password';
  passwordInp.type   = isHidden ? 'text' : 'password';
  eyeOpen.style.display   = isHidden ? 'none'  : '';
  eyeClosed.style.display = isHidden ? '' : 'none';
});

// Sign in logic
function handleSignIn() {
  const email    = usernameInp.value.trim();
  const password = passwordInp.value;

  errorMsg.textContent = '';

  if (!email || !password) {
    errorMsg.textContent = 'Please fill in both fields.';
    return;
  }

  signinBtn.disabled = true;
  btnText.textContent = 'Signing in...';

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = 'dashboard.html';
    })
    .catch((err) => {
      // Firebase error codes: auth/invalid-email, auth/user-not-found,
      // auth/wrong-password, auth/invalid-credential, auth/too-many-requests
      errorMsg.textContent = 'Incorrect email or password.';
      passwordInp.value = '';
      passwordInp.focus();
      signinBtn.disabled = false;
      btnText.textContent = 'Sign In';
    });
}

signinBtn.addEventListener('click', handleSignIn);

// Allow Enter key to submit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSignIn();
});

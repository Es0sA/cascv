/* ============================================================
   CAS CV Builder — auth.js (Login Page)
   NOTE: Client-side auth for now. Will upgrade to
   Firebase/Supabase auth in Phase 3.
   ============================================================ */

// ⚠️ Your login credentials — change password after first login
const AUTH = {
  username: 'cas_admin',
  password: 'CASbuild2026!'
};

const SESSION_KEY = 'cas_cv_session';

// If already logged in, skip straight to dashboard
if (sessionStorage.getItem(SESSION_KEY) === 'active') {
  window.location.href = 'dashboard.html';
}

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
  const username = usernameInp.value.trim();
  const password = passwordInp.value;

  errorMsg.textContent = '';

  if (!username || !password) {
    errorMsg.textContent = 'Please fill in both fields.';
    return;
  }

  if (username === AUTH.username && password === AUTH.password) {
    // Set session and redirect
    sessionStorage.setItem(SESSION_KEY, 'active');
    signinBtn.disabled = true;
    btnText.textContent = 'Signing in...';
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 500);
  } else {
    errorMsg.textContent = 'Incorrect username or password.';
    passwordInp.value = '';
    passwordInp.focus();
  }
}

signinBtn.addEventListener('click', handleSignIn);

// Allow Enter key to submit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSignIn();
});

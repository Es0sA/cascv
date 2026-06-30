/* Auth guard — redirect unauthorized users to login page */
const SESSION_KEY = 'cas_cv_session';
if (sessionStorage.getItem(SESSION_KEY) !== 'active') {
  window.location.replace('login.html');
}

/* ============================================================
   CAS CV Builder — cv-store.js
   CV data now lives in Firestore, at users/{uid}/cvs/{cvId}, one
   document per CV, instead of the old localStorage array under
   the cas_cv_data key.

   This is a module (uses import/export), but dashboard.js,
   editor.js, and import.js are classic scripts that run in the
   global scope (see CLAUDE.md's "Tech stack" section for why they
   can't just become modules). So instead of exporting normally,
   this file exposes everything through a single window.CVStore
   object, which the classic scripts call like plain global
   functions.
   ============================================================ */
import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const LOCAL_KEY       = 'cas_cv_data';
const MIGRATION_FLAG  = 'cas_cv_migrated_to_firestore';

// Firebase auth resolves asynchronously. auth-guard.js and this
// module both start loading at the same time, so by the time a
// page's classic script calls a CVStore function, auth.currentUser
// may not be set yet even though the person is signed in. Wait for
// the first real auth state instead of trusting a synchronous read.
function whenSignedIn() {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) resolve(user);
      else reject(new Error('CVStore: not signed in'));
    });
  });
}

function cvDocRef(uid, id) {
  return doc(db, 'users', uid, 'cvs', id);
}

// Firestore rejects `undefined` field values outright. A JSON
// round-trip strips them the same way localStorage's
// JSON.stringify always did, so existing CV objects behave the
// same way they did before.
function cleanForFirestore(cv) {
  return JSON.parse(JSON.stringify(cv));
}

async function getAll() {
  const user = await whenSignedIn();
  const snap = await getDocs(collection(db, 'users', user.uid, 'cvs'));
  const cvs = snap.docs.map(d => d.data());
  // Firestore doesn't guarantee insertion order like the old
  // localStorage array (which always unshifted new CVs to the
  // front). Sort newest-first here to match that behavior.
  cvs.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  return cvs;
}

async function getById(id) {
  const user = await whenSignedIn();
  const snap = await getDoc(cvDocRef(user.uid, id));
  return snap.exists() ? snap.data() : null;
}

async function save(cv) {
  const user = await whenSignedIn();
  await setDoc(cvDocRef(user.uid, cv.id), cleanForFirestore(cv));
}

async function remove(id) {
  const user = await whenSignedIn();
  await deleteDoc(cvDocRef(user.uid, id));
}

// One-time move of whatever's sitting in localStorage up to
// Firestore. Guarded by a localStorage flag so it only runs once
// per browser. Leaves the original localStorage data alone as a
// backup, per CLAUDE.md's migration notes.
async function migrateIfNeeded() {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  let localCVs = [];
  try {
    localCVs = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    localCVs = [];
  }

  if (!Array.isArray(localCVs) || localCVs.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return;
  }

  const user = await whenSignedIn();
  for (const cv of localCVs) {
    if (!cv || !cv.id) continue;
    await setDoc(cvDocRef(user.uid, cv.id), cleanForFirestore(cv));
  }
  localStorage.setItem(MIGRATION_FLAG, '1');
}

window.CVStore = { getAll, getById, save, remove, migrateIfNeeded };

// dashboard.js / editor.js / import.js are classic scripts that run
// immediately, before this module (deferred by default) has even
// started executing. They await window.cvStoreReady instead of
// touching window.CVStore directly, so it doesn't matter which
// script actually finishes loading first.
if (window._resolveCVStoreReady) window._resolveCVStoreReady(window.CVStore);

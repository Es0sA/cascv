# CAS CV Builder

A private CV/resume builder for CAS Brand Co. / CAS Writing Services.
Build, customize, and export CVs as PDF, plus run an ATS keyword checker.

---

## Login

Authentication is real, via Firebase Authentication (Email/Password).
There is exactly one account, created directly in the Firebase Console.
No credentials are stored in this repo or anywhere in code. To reset
the password, do it in the Firebase Console (Authentication, Users tab).

---

## Hosting

Live at `https://es0sa.github.io/cascv/`, hosted on GitHub Pages,
deployed automatically from the `main` branch (any push goes live
within about a minute). There is no build step and no bundler; every
`<script>` tag loads a plain JS file directly.

---

## Data storage

CV content is stored in Firestore, at `users/{uid}/cvs/{cvId}`, one
document per CV. This means CVs sync across any browser or device the
account signs into. A one-time migration pushes any CV data still
sitting in a browser's old `localStorage` (key `cas_cv_data`) up to
Firestore on first load; the local copy is left in place as a backup,
not deleted. See `CLAUDE.md` for details before touching this.

---

## Project status

- [x] Firebase authentication (login, auth-gated dashboard/editor/import)
- [x] Dashboard (CV gallery: list, create, delete, download)
- [x] Text parser / resume import flow
- [x] Rich CV editor (sections, drag-reorder, live preview)
- [x] Reimport (replace CV content while keeping Customize settings)
- [x] Templates (multiple design templates, live-rendered thumbnails)
- [x] PDF export
- [x] ATS keyword checker
- [x] Firestore migration (CV data synced across devices, off localStorage)
- [x] Real pagination (single-column templates split correctly across PDF pages)
- [ ] Real pagination for two-column layouts and the 5 sidebar templates

See `CLAUDE.md` for full technical context, and `CHANGELOG.md` for a
log of changes made by Claude Code sessions.

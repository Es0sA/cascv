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

CV content is currently stored in the browser's `localStorage`
(key `cas_cv_data`), not in a database. This means CVs do not sync
across browsers or devices yet. Migrating this to Firestore is planned
but not started. See `CLAUDE.md` for details before touching this.

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
- [ ] Firestore migration (move CV data off localStorage, cross-device sync)

See `CLAUDE.md` for full technical context, and `CHANGELOG.md` for a
log of changes made by Claude Code sessions.

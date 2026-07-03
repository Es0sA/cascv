# Changelog

Log of changes made to this repo by Claude Code sessions. Newest first.
Commit hashes refer to `main`.

## 2026-07-03

- Custom Section restructure: added a per-section icon picker (24 icon
  choices) and a Text/Normal/Skill type toggle to Custom Sections. Text
  keeps the original freeform textarea behavior (default, so every
  existing custom section on every existing CV is unaffected). Normal
  reuses the exact Projects-style structured entry form (Title,
  Subtitle, Start/End Date, Location, Description). Skill reuses the
  Core Skills form (Skill/Sub-skills/Level). Switching type when the
  section already has content prompts for confirmation since it clears
  the section first. Added `getSectionDef(sec, i)` and
  `getEffectiveStype(sec, i)` helpers so every render call site (entry
  editor, preview, section-layout chips, add-content picker) reads the
  per-instance override instead of the static `SECTION_TYPES` table.
  New per-CV state: `cvData.customSectionType` and
  `cvData.customSectionIcon`, plain objects keyed by section index like
  the existing `columnAssign`/`sectionNames`. Tested locally with
  Playwright: added a Custom Section, switched Normal then Skill (with
  confirm dialog firing correctly on the second switch since content
  existed), changed the icon, and confirmed the live preview rendered
  the structured entry correctly. Files changed: `js/editor.js`,
  `css/main.css`. Added `.gitignore` for `.playwright-mcp/` test
  artifacts.

## 2026-07-01

- Removed Netlify leftovers now that the project is fully on GitHub
  Pages: `netlify.toml` (GitHub Pages never read it), the "Job Role
  Requests" feature on `index.html`/`dashboard.html`/`js/ats.js` (a
  hidden form plus a handler that posted to Netlify's form backend,
  which no longer exists now the site isn't hosted there, so it was
  silently discarding visitor submissions while showing a fake success
  message), the unused `assets/templates/` stock-photo folder (5.7MB,
  superseded by live-rendered template thumbnails), and an unreferenced
  duplicate `assets/favicon.png`. Files changed: `index.html`,
  `dashboard.html`, `js/ats.js`, `css/main.css`, `css/ats.css`, deleted
  `netlify.toml`, `assets/favicon.png`, `assets/templates/*`.
- `9b7dfdf` Migrate CV data storage from localStorage to Firestore. CVs
  now live at `users/{uid}/cvs/{cvId}`, one document per CV, so they
  sync across any browser or device the account signs into instead of
  being stuck on one machine. Added `js/cv-store.js` (a module exposing
  `window.CVStore`, since `dashboard.js`/`editor.js`/`import.js` are
  classic scripts that can't import it directly) with a
  `window.cvStoreReady` promise pattern so those classic scripts can
  safely await it despite module scripts loading later. Every
  `localStorage.getItem('cas_cv_data')`/`setItem(...)` call site was
  replaced with the matching async `CVStore` call (gallery load,
  create, download, delete, the import-flow save, loading a CV by id,
  and the debounced autosave). A one-time `migrateIfNeeded()` pushes
  existing localStorage data to Firestore on first load, guarded by a
  flag so it only runs once, leaving the local copy in place as a
  backup. Also fixed a pre-existing bug in `import.js` where the Sign
  Out button called `sessionStorage.removeItem(SESSION_KEY)`, a
  leftover from the old hardcoded-password auth system where
  `SESSION_KEY` no longer exists, so it threw an error instead of
  signing out; it now calls `window.casSignOut()` like `dashboard.js`
  does. Tested end to end locally and on the live site with Playwright.
  Files changed: `js/firebase-init.js`, `js/dashboard.js`, `js/editor.js`,
  `js/import.js`, `dashboard.html`, `editor.html`, `import.html`,
  `css/main.css`; added `js/cv-store.js`.
- `c218acd` Fix stale README. Replaced hardcoded `cas_admin`/
  `CASbuild2026!` credentials (gone since Firebase auth was added) and
  Netlify deploy instructions (project moved to GitHub Pages) with what
  is actually true today, and replaced the generic 10-phase checklist
  with a status list matching current reality. File changed: `README.md`.
- `81c1abb` Add `CHANGELOG.md` logging recent fixes, and point
  `CLAUDE.md`'s Git workflow section at it for future sessions.
- `aba9f42` Fix import.html auth bypass. `import.html` loaded
  `auth-guard.js` as a classic script (missing `type="module"`), which
  threw a syntax error and skipped the auth check entirely, leaving the
  page reachable without signing in. Added `type="module"` and the same
  `body { visibility: hidden }` guard used on `dashboard.html` and
  `editor.html`. File changed: `import.html`.
- `b30a30f` Fix white gap above Silver Banner and Clear Banner headers.
  These two templates were missing the `padding-top: 0` override that
  Corporate, Blue Steel, and Hunter Green already had, so the paper's own
  top padding still showed above the header banner. Switched the header's
  top margin from a hardcoded `-40px` to `calc()` against
  `--cv-margin-tb`, matching the other three templates. File changed:
  `css/main.css`.
- `c5e0504` Fix banner template headers not spanning full paper width.
  Corporate, Blue Steel, Hunter Green, Silver Banner, and Clear Banner
  used a hardcoded `-40px` negative margin on the header banner to cancel
  out the paper's padding, but the paper's actual padding comes from
  `--cv-margin-lr` / `--cv-margin-tb` (50px/44px by default). The mismatch
  left white gaps on the left and right edges of the header. Switched to
  `calc()` against the real variables. File changed: `css/main.css`.

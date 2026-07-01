# CAS CV Builder: Project Context for Claude Code

Read this whole file before doing anything. It exists so that any future
session, even a fresh one that has never seen this project before, has
everything it needs to work safely and correctly. Do not assume prior
context; everything you need is either in this file or discoverable by
reading the actual code.

Note on style: never use em dashes anywhere in code, comments, commit
messages, or conversation with Cas. Use periods, commas, colons, or
parentheses instead. This file follows that rule itself; keep following
it in anything you write.

## What this project is

A free CV/resume builder web app built by Cas (Esosa Erinmwingbovo), a
Nigeria-based freelancer who runs CAS Brand Co. / CAS Writing Services (CV
writing, LinkedIn optimization, cover letters, ATS testing). This tool is
for Cas's own personal/business use. It is NOT a public multi-tenant
product. There is exactly one real user: Cas himself.

The app lets Cas build, customize, and export CVs as PDF, plus run an ATS
(Applicant Tracking System) keyword checker.

## Tech stack: READ THIS BEFORE WRITING ANY CODE

- Plain vanilla JavaScript. No framework. No React, Vue, etc.
- No build step, no bundler, no npm build process. Every `<script>` tag
  in the HTML files loads a plain `.js` file directly; nothing is
  compiled or bundled.
- No backend server. This is a static site.
- Two kinds of script loading are used, and it matters which one:
  - Classic scripts (`<script src="js/foo.js"></script>`, no `type`
    attribute): `dashboard.js`, `editor.js`, `parser.js`, `import.js`,
    `keywords.js`, `ats.js`. These run in the GLOBAL scope. Every function
    referenced in inline HTML, like `onclick="setSetting('template','x')"`,
    depends on that function existing on `window`, i.e. being a plain
    global function in a classic script. Do NOT convert these to ES
    modules without rewriting every single inline `onclick`/`onchange`
    handler in the generated HTML to explicit `window.foo = foo`
    assignments. There are hundreds of these across `editor.js` alone.
    This is a real trap; a past session almost walked into it.
  - Module scripts (`<script type="module" src="...">`): `auth.js`,
    `auth-guard.js`, `firebase-init.js`. These use `import`/`export` and
    talk to Firebase. They deliberately do not need to interact with the
    classic scripts' global functions, which is why splitting auth into
    its own module files (rather than converting the whole app to
    modules) was the safe choice.
- Hosting: GitHub Pages, repo `Es0sA/cascv`, live at
  `https://es0sa.github.io/cascv/`. Deploys automatically from the `main`
  branch. Any push to `main` goes live within roughly a minute.
- PDF generation: `html2pdf.js` loaded from a CDN (`cdnjs.cloudflare.com`)
  in `editor.html` and `dashboard.html`.

## File structure and what each file does

```
/
index.html          Public landing page (ATS checker demo, login link).
                     NOT auth-gated; anyone can see this.
login.html           Sign-in page. Auth is real (Firebase), not a
                     hardcoded password anymore. See Auth section below.
dashboard.html        CV gallery: list/create/delete/download CVs.
                     Auth-gated (redirects to login.html if not signed in).
editor.html           The actual CV editor: Edit tab, Customize tab,
                     live preview on the right, Download PDF button.
                     Auth-gated.
import.html           Resume-file import/parsing flow (upload a doc,
                     it gets parsed into the structured CV format).

css/
  main.css          ALL styling for login/dashboard/editor. One big
                     file, roughly 3500+ lines. Has some duplicate/
                     overriding rule blocks for the same selectors,
                     added in different sessions. See "Known gotchas"
                     below before touching CSS specificity-sensitive
                     things.
  ats.css            Styling for the ATS checker specifically.

js/
  firebase-init.js   Single source of truth for the Firebase app and
                     auth instance. Everything Firebase-related
                     imports from here. Contains the (public, safe to
                     expose) Firebase web config.
  auth-guard.js       Module. Runs on dashboard.html and editor.html.
                     Checks real Firebase auth state via
                     onAuthStateChanged. Hides the page (via inline
                     "<style>body{visibility:hidden}</style>" in the
                     HTML's head) until auth is confirmed, then
                     reveals it, or redirects to login.html if not
                     signed in. Also exposes window.casSignOut() for
                     the classic dashboard.js to call.
  auth.js             Module. Login page logic. Real
                     signInWithEmailAndPassword call. Auto-redirects
                     to dashboard.html if already signed in.
  cv-store.js          Module. Wraps every Firestore read/write for CV
                     data (users/{uid}/cvs/{cvId}) and exposes them as
                     window.CVStore so the classic scripts below can
                     call them like plain global functions. See "Data
                     storage" section above for the window.cvStoreReady
                     synchronization pattern this depends on.
  dashboard.js         Classic script. Gallery rendering, CV
                     create/delete/download, "Sign Out" button (calls
                     window.casSignOut from auth-guard.js).
  editor.js            Classic script. THE BIG ONE, roughly 1780 lines.
                     Everything about the editor: section editing,
                     drag-reorder, live preview rendering, Customize
                     panel (templates, fonts, colors, spacing), PDF
                     export, template thumbnail generation.
  parser.js            Shared parsing helpers used by editor.js and
                     import.js.
  import.js            Resume document import/parsing flow logic.
  keywords.js, ats.js    ATS keyword-checking feature logic.

assets/               Favicons and the apple touch icon, referenced by
                     every page's <head>. Nothing else lives here;
                     template thumbnails are live-rendered in CSS/JS,
                     not image files (see "Known gotchas" below).
```

Note: this project used to be hosted on Netlify before moving to
GitHub Pages. `netlify.toml` and a Netlify Forms-based "Job Role
Requests" feature (a hidden form on `index.html` plus a handler in
`ats.js` that posted to Netlify's form backend) were both removed since
neither works on GitHub Pages (no build-time form detection, no
backend to receive submissions). If a similar visitor-submission
feature is wanted again, it needs a real backend (a free third-party
form service, or a mailto: link), not anything Netlify-specific.

## Auth system: what's real and what's not

As of this session, auth is REAL, using Firebase Authentication
(Email/Password provider). It replaced an old system that was just a
hardcoded username/password string sitting in plain text in `auth.js`
(`cas_admin` / `CASbuild2026!`). That old system is gone.

- Firebase project: `cas-cv-builder`
- Firestore region: `africa-south1` (Johannesburg), chosen for proximity
  to Cas in Nigeria. This cannot be changed without recreating the
  database from scratch (Firebase locks the region permanently once set).
- There is exactly ONE real user account, created manually in the Firebase
  Console (Authentication, Users tab). Only Cas knows the actual password;
  it is never written down in any file, chat, or code. If you need to
  reset it, that happens in the Firebase Console directly, not in code.
- The Firebase web config (`apiKey`, `authDomain`, `projectId`, etc. in
  `firebase-init.js`) is NOT a secret. Firebase web config values are
  meant to be public/client-visible; this is documented, standard
  Firebase behavior. Real security comes from Firestore security rules
  (see below), not from hiding this config.
- Firestore security rules (already published, live):
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/cvs/{cvId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
  This means only a signed-in Firebase user can read/write documents
  under their own UID path. Nobody else can touch it, even if they found
  the project.

## Data storage: CV data lives in Firestore

CV data is stored in Firestore, at `users/{uid}/cvs/{cvId}`, one document
per CV (same shape the old `cas_cv_data` localStorage array used: `id`,
`name`, `parsed` content structure, `settings`, etc; read `dashboard.js`
and `editor.js` to see the exact shape, it's easier than describing it
here). This means CVs sync across any browser or device the account
signs into.

None of the classic scripts (`dashboard.js`, `editor.js`, `import.js`)
talk to Firestore directly. They all call `window.CVStore` (defined in
`js/cv-store.js`, a module), which wraps every Firestore read/write:
`getAll`, `getById`, `save`, `remove`, `migrateIfNeeded`. Since
`cv-store.js` is a module (deferred) and the classic scripts run
immediately, each HTML page sets up a small `window.cvStoreReady`
promise inline (before the `cv-store.js` script tag) that the classic
scripts `await` instead of touching `window.CVStore` directly. If you
add a new page that needs CVStore, copy that same inline-promise +
module-script-tag pattern, don't just add the module tag alone.

A one-time migration (`CVStore.migrateIfNeeded()`, called from both
`dashboard.js`'s and `editor.js`'s boot sequences) pushes whatever's
sitting in a browser's `localStorage` under `cas_cv_data` up to
Firestore on first load after this shipped, guarded by a
`cas_cv_migrated_to_firestore` flag so it only runs once per browser.
The original localStorage data is left in place as a backup, not
deleted, so don't write code that assumes `cas_cv_data` is empty or
absent.

## Known gotchas (learned the hard way this session, don't repeat these)

1. CSS specificity trap with `.cv-paper`. There are three separate
   `.cv-paper { ... }` rule blocks in `main.css` at different line
   numbers, added in different sessions, all with equal specificity
   (single class selector). One of them (`width: var(--cv-paper-w,
   210mm); min-width: var(--cv-paper-w, 210mm);`) is used correctly for
   true-to-life-size PDF export and template thumbnails, but it was
   silently overriding an earlier rule's `max-width: 660px` meant for the
   on-screen editor preview. This happens because in CSS, `min-width`
   always wins over `max-width` when they conflict, regardless of which
   one appears later in the file. This caused a real, hard-to-diagnose
   "preview renders off-center" bug that took several rounds to find. If
   you touch `.cv-paper` sizing, search for all `.cv-paper {` blocks in
   `main.css` first (there may still be three), understand which one is
   winning for the specific element you're changing, and prefer a more
   specific selector (e.g. `.cv-paper-wrap .cv-paper`) to override safely
   rather than editing the shared base rule.

2. `innerHTML` replacement resets scroll position. Almost every render
   function in `editor.js` (`renderEditPanel`, `renderCustomizePanel`)
   rebuilds a chunk of HTML and replaces it via `.innerHTML = ...`. This
   destroys and recreates every child element, which resets the scroll
   position of any ancestor scrollable container (e.g.
   `.editor-left-scroll`, `.template-grid-2col`). The fix pattern already
   in place: capture `scrollTop`/`scrollLeft` of the relevant scroll
   container(s) before the innerHTML swap, then restore them immediately
   after. If you add a new render function that replaces innerHTML inside
   a scrollable panel, follow this same pattern or you'll reintroduce the
   "page jumps to top" bug.

3. CSS `zoom` and flex centering don't always agree across browsers on
   whether a zoomed element's shrunk size counts for its parent's layout
   math. `fitPaperZoom()` in `editor.js` (auto-shrinks the CV preview
   when the sidebar is dragged wide) explicitly sets the wrapper
   element's inline `width` to match its true post-zoom visual footprint,
   rather than relying on `zoom` to auto-report the right size to the
   flex parent. Don't remove that explicit width-setting to "simplify"
   the function. It's there because centering silently breaks without it
   in at least one real-world case.

4. html2pdf.js phantom blank trailing page. Forcing a fixed page height
   on the PDF-export clone before measuring real content height causes
   rounding between the browser's mm-to-px layout and html2canvas's own
   pixel math to occasionally produce a near-empty extra page. The fix
   pattern in `editor.js`'s PDF download handler: measure the CV's true
   natural content height first (with no forced page height), calculate
   exactly how many pages it needs, then size the clone to that exact
   multiple of page height, plus a safety net that inspects the generated
   PDF via html2pdf's `.toPdf().get('pdf')` API and trims any stray
   trailing page before `.save()`. Don't go back to naively forcing a
   single page height.

5. Template thumbnails must be live-rendered, not photos. An earlier
   version showed random unrelated stock photos as template preview
   thumbnails, completely disconnected from what the CSS actually
   produced when clicked. This was a real, confusing bug for Cas. It's
   fixed now: `templateThumb()` in `editor.js` renders an actual
   `.cv-paper` element with the real template CSS class and placeholder
   content, scaled down with a CSS `transform`. If you add a new
   template, you must add matching `.cv-paper.t-yourvalue { ... }` CSS
   rules. The thumbnail auto-reflects them; there is no separate image
   asset to create or maintain. Do not reintroduce static preview images.

## Playwright MCP is set up for real browser testing

Cas has Claude Code plus the official Playwright MCP server
(`@playwright/mcp`) configured and working. This means you can, and
should, for anything visual or interactive, actually open a real browser,
navigate to `https://es0sa.github.io/cascv/`, click around, and take
screenshots rather than reasoning about CSS/JS blind. This already caught
a real bug (the `.cv-paper` min-width/max-width conflict above) that pure
code review missed across several attempts. Use it.

One caveat: Playwright launches a fresh, clean Chrome profile with no
existing localStorage or Firebase auth session. It will not automatically
have access to Cas's existing saved CVs or be already logged in. You'll
need to sign in within that session (Cas can type his own credentials
when a login page appears) or test against fresh/new CVs created within
the automated session itself.

## Coding conventions and standing preferences

- Never use em dashes anywhere, in code comments, commit messages, or any
  text generated for Cas. This is a firm standing requirement of his, not
  a style suggestion. Use periods, commas, colons, semicolons, or
  parentheses instead.
- Cas is comfortable with technical work and reads code fine, but doesn't
  have a formal software development background. Explain non-obvious
  decisions in comments and in conversation rather than assuming deep
  familiarity with framework conventions (though again, no framework is
  used here anyway).
- Keep costs at zero. Cas is a solo freelancer in Nigeria running a
  budget-conscious business. Do not introduce paid services, paid tiers,
  or anything requiring a credit card without discussing it with him
  first. Firebase's free Spark plan comfortably covers this app's real
  usage (single user, light traffic); there should be no realistic path
  to this project generating a Firebase bill.
- This is a solo, single-developer, single-user project. Don't add
  multi-tenant complexity, user roles, teams, or anything built for scale
  Cas doesn't need. If in doubt, favor the simpler option.

## Git workflow

Repo is cloned locally. Standard flow:
```
git add -A
git commit -m "describe what changed, no em dashes"
git push
```
Pushing to `main` deploys automatically via GitHub Pages within about a
minute. There is no staging environment and no CI/CD pipeline beyond
that. What's on `main` is what's live.

`CHANGELOG.md` logs changes made by Claude Code sessions, newest first,
with commit hashes. Add an entry there after committing, instead of
turning this file into a running log.

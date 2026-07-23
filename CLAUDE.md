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
- Drag-to-reorder (sections, entries, Section Layout chips, all in
  `editor.html`): `SortableJS`, also loaded from `cdnjs.cloudflare.com`.
  A past version used native HTML5 drag-and-drop, which no touch
  browser fires for touch input (mouse-only by spec) — silently did
  nothing on a phone. Don't go back to that.
- Fonts are self-hosted (`css/fonts.css` + `fonts/*.woff2`), NOT loaded
  from Google Fonts' CDN. This used to be a `<link>` to
  `fonts.googleapis.com` in every page's `<head>`; on a slow/unreliable
  mobile connection that external fetch could take a long time or fail
  outright, during which text renders in a fallback font that doesn't
  match the chosen one or the downloaded PDF. Self-hosting removes that
  dependency: the font files load from the exact same place as
  everything else. Latin subset only (this app is aimed at
  English-language CVs). If a new font is ever added to the
  `FONTS`/`NAME_FONTS` arrays in `editor.js`, it needs its `.woff2`
  file(s) added under `fonts/` and a matching `@font-face` rule added to
  `css/fonts.css` (fetch from `https://fonts.googleapis.com/css2?family=
  Name:wght@400;700&display=swap` with a modern browser User-Agent
  string to get real URLs back, since Google's API sniffs the UA to
  decide which format to serve). If the font is one of the `FONTS`
  (body font) options, it also needs italic 400/700 faces (same fetch,
  with `ital,wght@1,400;1,700`): the default Subtitle Style italicizes
  entry employer/date/location text, and several templates italicize
  the job title, so any body font without a real italic `@font-face`
  silently falls back to the browser's synthesized (sheared) italic,
  which html2canvas renders with different metrics/weight than native
  text. That mismatch is what made entry titles and company names look
  smaller and duller specifically in downloaded PDFs, on whichever CVs
  happened to use a body font missing its italic face. `NAME_FONTS`
  entries don't need italic since nothing italicizes the name.

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
  fonts.css           Self-hosted @font-face declarations for every
                     font in the Customize > Font pickers, plus the
                     app's own UI fonts (Playfair Display, DM Sans).
                     See the "Tech stack" note on fonts above before
                     touching this or adding a new font.

fonts/                The actual .woff2 font files fonts.css points at.

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

6. `pdf.addImage(dataURL, 'PNG', ...)` in the bundled jsPDF (inside
   `html2pdf.bundle.min.js`) embeds PNG images as fully uncompressed raw
   RGBA with no Flate filter applied at all, not the PNG's own
   compressed bytes. A single A4 page at `scale:2` balloons from roughly
   500KB to about 14MB; a 2-page CV export hit nearly 30MB. JPEG doesn't
   have this problem (its own DCT-compressed bytes get embedded more or
   less directly), which is why both PDF export functions in
   `editor.js` (`exportPaginatedPdf`, `exportFlowingPdf`) use
   `image: { type: 'jpeg', quality: 0.85 }` and not PNG, even though PNG
   would otherwise be the safer, simpler choice (lossless, no risk of a
   bad DCT encode). Quality was later dropped from an initial `0.98` to
   `0.85`, and `html2canvas`'s `scale` from `2` to `1.5`, once it turned
   out `0.98` measured out LARGER than a lossless PNG of the same page
   for this flat-background, dark-text content (paying for lossy
   compression while getting none of its benefit); real test downloads
   went from roughly 987KB to 414KB. `js/dashboard.js`'s separate
   `downloadCV()` export path uses the same `0.85`/`1.5` values now too
   (see gotcha below on the two PDF-export implementations existing in
   the first place). If a future session is tempted to switch to PNG to
   dodge a JPEG-related bug, measure the resulting file size on a real
   multi-page CV first: it is a 10 to 30x regression, confirmed in this
   session before it shipped. If tempted to raise quality/scale back up,
   measure file size before and after on a real multi-page CV first.

7. `fitPaperZoom()` (the CSS-`zoom`-based preview shrink, used by the
   desktop split panel) must not rely on a single `requestAnimationFrame`
   to measure its container's real size. A `position:fixed; inset:0`
   container's actual size can settle asynchronously on some mobile
   browsers, so one rAF-timed measurement can read a stale or zero
   width. `fitPaperZoom`'s call sites are backed by a `ResizeObserver` on
   `#editorRight` that re-fits whenever the container's real size
   actually changes, instead of guessing at timing. Don't remove that
   observer in favor of manual `scheduleFitZoom()` calls alone. Note
   this no longer matters for the mobile Preview modal specifically
   (see the note on the Mobile Preview Modal below): it shows the actual
   generated PDF now, not a zoomed `#cvPaperWrap`, so this whole class of
   zoom/timing bug can't recur there anymore, only in the desktop
   split-panel view `#editorRight` still uses.

8. Two separate PDF-export implementations existing (`editor.js`'s
   `exportPaginatedPdf`/`exportFlowingPdf` and `dashboard.js`'s
   `downloadCV()`, used by the gallery card's Download button) is a real
   trap: a fix applied to one (quality/scale settings, a font-load-race
   guard, a stale-repagination flush) silently does not apply to the
   other unless done twice. This already happened once: `dashboard.js`
   kept the old `quality:0.98`/`scale:2` settings and a flat
   `setTimeout(400)` font wait for a while after `editor.js` moved to
   `0.85`/`1.5` and a real `ensureFontsReady()` wait, producing a larger,
   sometimes differently-paginated PDF depending on which download
   button was used for the exact same CV. If you fix something in one
   file's PDF export, check whether the other file's export needs the
   same fix before considering the bug closed.

## Mobile Preview Modal

The mobile Preview button (`#mobilePreviewFab`/`#mobilePreviewModal` in
`editor.html`, `openMobilePreview()`/`closeMobilePreview()` in
`editor.js`) generates the actual PDF (the same
`exportPaginatedPdf`/`exportFlowingPdf` functions Download PDF uses,
called with a `'blob'` mode that returns `pdf.output('blob')` instead of
triggering a save), rather than showing a live CSS re-creation of the
CV shrunk down to fit the screen. An earlier version did the latter
(moved the live `#cvPaperWrap` into the modal and shrank it with
`fitPaperZoom()`), but that meant the preview and the downloaded PDF
could visually disagree on real mobile Safari in ways that were not
reproducible in this project's testing tools (see the Playwright note
below): reported cases included an entry's employer/school name
wrapping onto extra lines in the preview but not the PDF, and the
preview filling the page edge to edge while the PDF had its normal
margins. Rendering the actual PDF instead makes this category of bug
structurally impossible: the preview IS the download, byte for byte,
so it cannot disagree with itself. The live CSS preview panel
(`#editorRight`) is hidden entirely on mobile now (see the
`@media(max-width:800px)` rule for `.editor-right` in `main.css`) since
it would otherwise be a redundant, less trustworthy second preview,
though `#cvPaperWrap` still renders invisibly inside it either way, as
the export source both PDF functions clone from. Desktop's side-by-side
live preview is unaffected by any of this.

The generated PDF is opened in a new browser tab (`window.open()`),
not displayed inline via an `<iframe>` in the modal. An earlier version
did embed it in an iframe; Cas reported that on mobile, the preview
only ever showed page 1 of a multi-page CV (confirmed the PDF blob
itself genuinely had every page; only the preview rendering was
affected). Mobile PDF viewers, especially iOS Safari's, are known to
not reliably support scrolling past the first page when the PDF is
embedded in a nested `<iframe>` rather than viewed as its own full
page/tab. Opening the blob in a new tab hands it to the browser's own
first-class PDF viewer instead (the same one used for any normal PDF),
which already handles multi-page scroll/zoom correctly. Two details
that matter if you touch this again:
- `window.open('', '_blank')` is called synchronously, before the
  `await`s that generate the PDF, and only pointed at the real blob URL
  once generation finishes (`previewTab.location = url`). Calling
  `window.open()` only after the async PDF generation is done gets
  silently blocked by mobile popup blockers, since by then it no longer
  counts as a direct response to the user's tap.
- The object URL is deliberately NOT revoked immediately after handing
  it to the new tab. `URL.revokeObjectURL()` running synchronously
  right after `previewTab.location = url` can race the new tab's own,
  separate, asynchronous fetch of that URL and break its load on a
  slower connection. It's revoked a few seconds later instead
  (`setTimeout`), after the new tab has had time to actually load the
  file.

## Playwright MCP is set up for real browser testing

Cas has Claude Code plus the official Playwright MCP server
(`@playwright/mcp`) configured and working. This means you can, and
should, for anything visual or interactive, actually open a real browser,
navigate to `https://es0sa.github.io/cascv/`, click around, and take
screenshots rather than reasoning about CSS/JS blind. This already caught
a real bug (the `.cv-paper` min-width/max-width conflict above) that pure
code review missed across several attempts. Use it.

Caveats:
- In this environment the Chrome distribution the default `playwright`
  MCP server expects is not installed (`mcp__playwright__browser_*`
  tools error with "Chromium distribution 'chrome' is not found").
  `mcp__playwright-firefox__browser_*` (Firefox) is the variant that
  actually works here; use that one.
- Playwright normally launches a fresh, clean profile with no existing
  localStorage or Firebase auth session, so it won't automatically have
  access to Cas's existing saved CVs or be already logged in. Cas can
  type his own credentials when a login page appears, or you can test
  against fresh/new CVs created within the automated session itself.
  There is also a saved Firebase session at
  `/home/es0sa/.cascv-playwright-session.json` (outside this repo,
  owner-read-only, captured with Cas's explicit consent) that restores
  a real logged-in dashboard/editor session without asking him to log
  in again: read that file's contents and pass it as
  `context: await browser.newContext({ storageState: <that JSON> })`.
  Firebase Auth's session lives in IndexedDB, not plain
  localStorage/cookies, so Playwright's `storageState()` needs the
  `{ indexedDB: true }` option to capture or restore it; the plain
  default omits it silently. If that file is missing, stale (Cas
  changed his password or signed out elsewhere), or this is a
  differently-scoped session where using it isn't appropriate, fall
  back to asking Cas to log in.
- One class of bug is fundamentally not reproducible with these tools:
  WebKit/iOS-Safari-only rendering quirks (this project has hit two:
  the font-boosting bug and the mobile-preview-vs-PDF mismatch, both
  documented above). Firefox, and even a Firefox context emulating an
  iPhone viewport/user agent, does not reproduce these; the underlying
  CSS/JS math can check out perfectly in testing and still be wrong on
  a real iPhone. When a reported bug is mobile-only and doesn't
  reproduce here, say so plainly rather than assuming the code is fine,
  and consider pushing a fix to a branch (via a
  `https://raw.githack.com/Es0sA/cascv/<branch>/<page>.html` link, which
  serves any branch's raw files with correct content-types, no deploy
  needed) for Cas to verify on his own phone before merging to `main`.

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

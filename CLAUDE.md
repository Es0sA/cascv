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
- The static site itself (this repo) has no backend and no build step.
  PDF generation is the one exception: it calls a small separate backend,
  the `cascv-pdf-service` Netlify function. See "PDF generation backend"
  below.
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
- PDF generation: calls the `cascv-pdf-service` Netlify function (real
  headless Chromium `page.pdf()`, not a client-side screenshot). See
  "PDF generation backend" below. `html2pdf.js` and client-side
  html2canvas rendering are gone as of this session; don't reintroduce
  them.
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
  cv-render.js         Classic script (loaded by BOTH editor.html and
                     dashboard.html, before editor.js/dashboard.js).
                     Holds buildCVHTML() and everything it calls:
                     SECTION_TYPES and every other section-type
                     constant, entry rendering, contact/photo/footer
                     building, date formatting, computeCvPaperClassString,
                     DEFAULTS. Added because dashboard.js used to
                     maintain its OWN hand-written copy of this exact
                     rendering logic for gallery downloads, which
                     drifted out of sync with editor.js repeatedly:
                     a profile photo, custom footer, and page numbers
                     were completely absent from gallery-downloaded
                     PDFs, several style-picker settings (Date Style,
                     Subtitle Style, Location Style, Icon Style, Link
                     Style, six "accent color" toggles) and content
                     toggles (Show Duration, Subtitle Same Line,
                     Title/Subtitle Order) had no effect there, even
                     though all of it worked correctly from the
                     editor's own Download button the whole time.
                     cvData/cvSettings are declared here with `var`
                     (not `let`, which would throw a SyntaxError on
                     redeclaration): editor.js's own `var cvData`/
                     `var cvSettings` just reassign the same variables,
                     and dashboard.js's downloadCV() populates them
                     from a Firestore CV document before calling the
                     shared functions. IMPORTANT gotcha this already
                     caused once: dashboard.js must never declare a
                     top-level function or const with the same name as
                     anything in this file (it already had its own
                     formatDate()/escapeHtml() for gallery-card-only
                     purposes, which silently overrode the shared ones
                     since dashboard.js loads after this file — fixed
                     by renaming them to formatCardDate()/
                     escapeCardText(), but check for this class of
                     collision before adding any new top-level name to
                     either dashboard.js or editor.js).
  dashboard.js         Classic script. Gallery rendering, CV
                     create/delete/download (via the shared
                     buildCVHTML() in cv-render.js, not its own
                     rendering logic anymore), "Sign Out" button (calls
                     window.casSignOut from auth-guard.js).
  editor.js            Classic script. Everything about the editor:
                     section editing, drag-reorder, live preview
                     rendering, Customize panel (templates, fonts,
                     colors, spacing), PDF export payload construction,
                     template thumbnail generation. The actual CV
                     rendering (buildCVHTML and its call graph) now
                     lives in cv-render.js, shared with dashboard.js.
  parser.js            Shared parsing helpers used by editor.js and
                     import.js.
  import.js            Resume document import/parsing flow logic.
  keywords.js, ats.js    ATS keyword-checking feature logic.
  pdf-service.js        Classic script (same load pattern as parser.js),
                     loaded by editor.html and dashboard.html. Holds
                     casGeneratePdf(), the one function both files call
                     to reach the cascv-pdf-service backend. See "PDF
                     generation backend" below.

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

## PDF generation backend: Cas's own VM (was cascv-pdf-service on Netlify)

PDF export used to be entirely client-side (html2canvas screenshotting
the CV, then jsPDF assembling those screenshots into a PDF). That
approach was replaced because pagination decided by measuring layout in
whichever browser happened to be downloading proved unreliable across
devices: phantom blank trailing pages, wasted space, previews that
visually disagreed with the actual download. See the git history around
the commit "Switch PDF generation from client-side html2canvas to the
cascv-pdf-service backend" for that before/after.

PDF export works like this: the browser builds the CV's styled HTML (the
exact class string, inline custom properties, and inner markup the live
preview already computes) and POSTs it to a small backend, which renders
it with a real headless Chromium instance and returns the actual
generated PDF bytes. Chromium's own native print pipeline (`page.pdf()`)
paginates by reading the CSS fragmentation rules `main.css` already
declares (`break-inside: avoid` on entry titles/bullets/etc.), the same
way on every request, regardless of who's asking or what device they're
on. This also produces real vector text instead of a rasterized JPEG, at
a fraction of the file size (a 2-page CV: was roughly 414KB, is now
roughly 20 to 30KB).

### Current hosting: Cas's own EC2 VM (as of 2026-07-25)

- Endpoint: `https://13-217-108-198.sslip.io/generate-pdf`, called from
  `js/pdf-service.js`'s `casGeneratePdf()` (the one function both
  `editor.js` and `dashboard.js` call).
- Runs on Cas's own AWS EC2 instance (`13.217.108.198`), which already
  hosts several unrelated Telegram bots and other projects via Docker.
  This PDF service does NOT run in Docker (kept lean given the box's
  disk is chronically tight, ~1.3GB free of 28GB): it's a plain
  `node server.mjs` process (Express + `puppeteer-core` +
  `@sparticuz/chromium`, same dependency versions as the old Netlify
  function) under a systemd unit (`/etc/systemd/system/cascv-pdf.service`,
  source at `~/cascv-pdf-vm` on that VM), so it auto-restarts on crash
  or reboot. `@sparticuz/chromium`'s binary decompresses into `/tmp`,
  which is its own separate RAM-backed tmpfs on this box, not the tight
  root disk, so Chromium's footprint doesn't compete with everything
  else running there.
- Unlike the old per-request Netlify function (fresh Chromium launch
  and teardown every call), this server keeps ONE browser instance
  alive across requests (see `newPage()` in `server.mjs`), reusing it
  for speed; if the cached browser has died between requests, opening
  a page on it throws and the code relaunches a fresh one automatically
  (self-healing, not relying on any specific `browser.isConnected()`
  API shape, since that method's exact behavior isn't worth depending
  on across puppeteer-core versions).
- TLS/HTTPS: Caddy (`/etc/caddy/Caddyfile` on the VM) reverse-proxies
  port 443 to the Node server on `127.0.0.1:8181`, and automatically
  obtains/renews a real Let's Encrypt certificate. The hostname
  `13-217-108-198.sslip.io` is NOT a domain Cas owns; sslip.io is a
  free "magic DNS" service where any hostname of that form
  automatically resolves to the IP address embedded in it, which is
  enough for Let's Encrypt's HTTP-01 challenge to succeed (no domain
  purchase needed, keeps this free per "Keep costs at zero" below). If
  the VM's IP ever changes, this whole hostname changes with it, and
  `js/pdf-service.js`'s `CAS_PDF_SERVICE_URL` plus the Caddyfile both
  need updating to match.
- Firewall: the VM's own OS-level firewall (iptables/ufw) is NOT the
  relevant gate here; ufw is inactive and iptables' INPUT chain is
  ACCEPT-by-default. The actual gate is the AWS EC2 **Security Group**
  attached to this instance, which had to be manually opened for ports
  80 and 443 (Inbound rules, HTTP/HTTPS, source `0.0.0.0/0`) via the AWS
  Console before Let's Encrypt could complete its HTTP-01 challenge
  (symptom without this: Caddy's logs show
  `"Timeout during connect (likely firewall problem)"`, and this is not
  something fixable from inside the VM over SSH).
- Auth and CORS are unchanged from the Netlify version: a real Firebase
  ID token for the `cas-cv-builder` project is verified via Google's
  public JWKS on every request (no service-account secret needed), and
  CORS is scoped to `https://es0sa.github.io` specifically. Same caveat
  applies: you cannot test this from `localhost` or a `raw.githack.com`
  branch preview, since the browser blocks the cross-origin fetch.
- Request body and JS-disabled rendering are unchanged from the Netlify
  version too: `{ outerClassName, styleAttr, innerHTML, paperFormat,
  filename, marginLR, marginTB, colorBg }`, `innerHTML` always the
  UNSPLIT CV markup, and `page.setJavaScriptEnabled(false)` since the
  CV content never needs to run any script to render correctly.
- Deploying a code change: edit `server.mjs` locally, `scp` it to
  `~/cascv-pdf-vm/server.mjs` on the VM, then
  `sudo systemctl restart cascv-pdf`. No build step, no bundler, same
  "no build step" philosophy as the rest of this project.
- Why this replaced Netlify: the Netlify team account (`imafidongraphix`)
  is on Netlify's newer credit-based Free plan (300 credits/month, hard
  limit, no auto-recharge). Both production deploys (15 credits each)
  and Functions compute (10 credits per GB-hour, which headless Chromium
  renders burn through fast) were pushing the shared team allowance
  toward its cap, risking the whole site going down mid-month with no
  way to recover until the next billing cycle. A persistent VM has no
  equivalent metered limit.
- The old `cascv-pdf-service` Netlify function and site are left in
  place, not deleted, in case a rollback is ever needed (see below).

### Historical: cascv-pdf-service on Netlify (superseded, kept for context)

The section below describes the ORIGINAL Netlify-hosted version of this
backend. It's kept here because the underlying `page.pdf()`/Chromium
logic, auth model, and CORS approach are all still identical on the VM
version above; only the hosting/deployment mechanics changed. If the VM
ever needs to be abandoned, this is what a rollback target looks like
(the Netlify site and function are still deployed and functional as of
this writing, just no longer the one `js/pdf-service.js` points at).

- Separate repo/directory: `~/cascv-pdf-service` (not part of this
  `cascv` repo, has its own local git history, no GitHub remote as of
  this writing).
- Separate Netlify account and site, chosen deliberately fresh rather
  than reusing the Netlify account this project used to be hosted on
  before it moved to GitHub Pages. Site: `cascv-pdf-service`, team slug
  `imafidongraphix`, site ID `e6af0177-ca5c-45c1-905b-13fffb37cd20`.
- Endpoint: `https://cascv-pdf-service.netlify.app/generate-pdf`.
- Real bugs hit getting this working (both only reproducible against
  the actual live Netlify deploy, never locally, so don't trust a local
  reproduction of either as proof of a fix):
  1. Netlify's esbuild bundler drops `@sparticuz/chromium`'s binary
     `.br` assets from the deployed function (they're loaded via `fs`
     at runtime, not `import`/`require`, so esbuild's static analysis
     never sees them). Fixed via `included_files` in `netlify.toml`.
     Symptom without this fix: an opaque Netlify 502 ("error decoding
     lambda response"), not a clean error from the function's own code,
     because the crash happens before the function can construct any
     `Response` at all.
  2. `@sparticuz/chromium`'s own runtime-detection logic (in its
     `helper.js`) only special-cased Node 20.x Lambda runtimes as of
     older package versions; Netlify's actual runtime is Node 22.x, so
     older versions fell through to the wrong (Amazon Linux 2) shared-
     library path, while the real underlying OS is Amazon Linux 2023,
     leaving `libnspr4.so` off `LD_LIBRARY_PATH`. Fixed by updating to
     `@sparticuz/chromium@149.0.0` + `puppeteer-core@^25.3.0`, whose
     detection logic handles this correctly (and which only ships the
     AL2023 binary now, having fully dropped AL2 support). If a future
     Netlify runtime bump breaks this again, check
     `node_modules/@sparticuz/chromium/build/helper.js`'s
     `isRunningInAwsLambda*` functions against whatever
     `process.env.AWS_EXECUTION_ENV` actually reports in production
     (temporarily add a debug branch to the function that echoes
     `process.env` back, deploy, curl it, then remove the debug branch
     before considering the fix done — this is exactly how both bugs
     above were actually diagnosed).
- Deploying: `netlify-cli deploy --prod --site
  e6af0177-ca5c-45c1-905b-13fffb37cd20 --dir . --skip-functions-cache`
  from `~/cascv-pdf-service`, authenticated via
  `NETLIFY_AUTH_TOKEN=<personal access token>`. Always pass
  `--skip-functions-cache`: without it, `netlify-cli` can silently reuse
  a stale bundled function even after `package.json`/dependency changes
  ("Deploying functions from cache" in the deploy log is the tell), so a
  dependency-version fix can appear to deploy successfully while the
  live function keeps running the old broken code.

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

4. SUPERSEDED, kept for history only: html2pdf.js used to produce a
   phantom blank trailing page from time to time, caused by rounding
   between the browser's mm-to-px layout and html2canvas's own pixel
   math. This whole category of bug is what motivated moving PDF export
   to the `cascv-pdf-service` backend (see that section above); the
   client-side html2canvas/jsPDF code this gotcha described no longer
   exists in this repo. Don't reintroduce client-side screenshot-based
   PDF export to "simplify" something; it was replaced on purpose.

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

6. SUPERSEDED, kept for history only: the old jsPDF-based export had a
   real PNG-vs-JPEG file size trap (uncompressed PNG embedding balloon-
   ing a page from ~500KB to ~14MB) that took real measurement to catch.
   Moot now: the `cascv-pdf-service` backend embeds real vector text via
   Chromium's native `page.pdf()`, not a rasterized image at all, so
   there's no PNG/JPEG tradeoff to make. A 2-page CV now runs roughly
   20 to 30KB.

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

8. SUPERSEDED, kept for history only: `editor.js` and `dashboard.js`
   used to each independently build their own styled CV HTML from CV
   data before calling out to the same PDF backend, which was a real,
   repeatedly-hit trap: a fix to one file's rendering (a new field, a
   section type `dashboard.js`'s `renderSec()` didn't handle yet, a
   style prop `editor.js` set that `dashboard.js`'s inline equivalent
   didn't) silently didn't apply to the other. This happened multiple
   times (html2canvas quality/scale settings before the backend
   migration; then a photo, footer, page numbers, and half a dozen
   style-picker settings after it). Fixed properly by extracting the
   shared rendering logic into `js/cv-render.js`, loaded by both pages
   — there is only one `buildCVHTML()` now, not two. See that file's
   entry in "File structure" above for the naming-collision gotcha
   this fix itself introduced (and already caught once): don't declare
   a top-level function/const in `dashboard.js` or `editor.js` with the
   same name as anything in `cv-render.js`, since classic scripts
   share one global scope and the later-loaded file's version silently
   wins with no error.

## Mobile Preview Modal

The mobile Preview button (`#mobilePreviewFab`/`#mobilePreviewModal` in
`editor.html`, `openMobilePreview()`/`closeMobilePreview()` in
`editor.js`) generates the actual PDF (calls the same
`casGeneratePdf(buildBackendExportPayload(), 'blob')` the Download PDF
button uses, just with `'blob'` mode instead of triggering a save) and
displays it in an iframe, rather than showing a live CSS re-creation of
the CV shrunk down to fit the screen. An earlier version did the latter
(moved the live `#cvPaperWrap` into the modal and shrank it with
`fitPaperZoom()`), but that meant the preview and the downloaded PDF
could visually disagree on real mobile Safari in ways that were not
reproducible in this project's testing tools (see the Playwright note
below): reported cases included an entry's employer/school name
wrapping onto extra lines in the preview but not the PDF, and the
preview filling the page edge to edge while the PDF had its normal
margins. Rendering the actual PDF instead makes this category of bug
structurally impossible: the preview IS the download, byte for byte
(now literally guaranteed, since both call the exact same backend
function with the exact same payload), so it cannot disagree with
itself. The live CSS preview panel (`#editorRight`) is hidden entirely
on mobile now (see the `@media(max-width:800px)` rule for
`.editor-right` in `main.css`) since it would otherwise be a redundant,
less trustworthy second preview. It's no longer even the export source:
`buildBackendExportPayload()` builds fresh HTML straight from
`cvData`/`cvSettings`, not from `#cvPaperWrap`'s DOM. Desktop's
side-by-side live preview is unaffected by any of this.

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

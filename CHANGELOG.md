# Changelog

Log of changes made to this repo by Claude Code sessions. Newest first.
Commit hashes refer to `main`.

## 2026-07-23 (latest)

- `3eed116` Fixed the Dashboard download silently dropping skill-list
  content in Core Skills entries. Cas reported the Dashboard download's
  text color looked different from the Editor download's; direct
  testing ruled out any actual difference in accent-color computation
  between the two, so rendered both exports as real images and compared
  them directly instead. The "color" difference was missing content:
  Dashboard's version showed only the bold category labels ("Sales and
  Business Development") with nothing after them, Editor's showed the
  full "Category: Skill | Skill | Skill..." line. Losing the plain text
  after the colon shifts a section from mostly-black-with-a-green-label
  to solid bold-green, reading as a color difference at a glance even
  though no color value changed. Root cause: `dashboard.js`'s
  `downloadCV()` has its own simplified, hand-rolled per-entry renderer
  (a known separate implementation from `editor.js`'s), and it never
  learned skill-type entries store their content in `skill`/`info`/
  `level` fields rather than the `desc`/`summary` every other entry
  type uses — `info` (the actual skill list) was silently never read.
  Added a dedicated skills-entry branch mirroring editor.js's own
  output. Verified directly: re-rendered Core Skills with the fix and
  confirmed the full skill list matches the Editor export's HTML. File
  changed: `js/dashboard.js`.

- `155b516` Two fixes bundled together, found investigating why the
  wasted-space pagination fix wasn't applying to the Editor's Download
  PDF button, consistently across Safari, Firefox, and Chrome on Cas's
  iPhone (all three run on WebKit there, so "broken on all three"
  pointed at one shared engine issue, not three separate bugs).
  1. `ensureFontsReady()` (both `js/editor.js` and `js/dashboard.js`
     have their own copy) passed the CV's full font-family value,
     fallback list and all, straight into `FontFaceSet.load()`, whose
     font argument is a CSS font shorthand meant to name the ONE font
     being requested — a fallback list there is out of spec and
     inconsistently parsed across browsers, silently failing to trigger
     the real font's fetch on at least one. Both copies now extract
     just the primary family name first. Confirmed this fixed the
     Editor download (now 1 page, matching Dashboard); the wasted-space
     fix itself (previous entry) was correct all along; the font
     detection feeding it accurate measurements was the missing piece.
  2. Separately: `dashboard.js`'s `cachedCVs` is only populated once,
     when the script first runs; a phone's native back gesture can
     restore the dashboard from the browser's back-forward cache
     without re-running any script, leaving Download stuck on settings
     from before a since-made edit. Added a `pageshow` listener that
     re-fetches specifically on a bfcache restore (`event.persisted`).
  Files changed: `js/editor.js`, `js/dashboard.js`.

## 2026-07-23 (even later)

- `6f51d73` Fixed wasted blank space at the bottom of a page when a
  whole small trailing section (e.g. a 2-line Achievements section)
  gets stranded alone on the next page. Cas reported this with a
  screenshot; confirmed on a real downloaded PDF the blank gap measured
  ~38mm, more than double what the stranded section needed. Root cause:
  the real-pagination greedy forward walk (measureAndPaginate/
  measureColumnAndPaginate in `js/editor.js`) is usually tight, but this
  exact CV/settings paginated differently in this project's Firefox-
  based testing than in Cas's real Safari download, pointing at
  cross-browser text-measurement variance occasionally tipping a
  borderline unit the wrong way, in a way that compounds. Added a
  second pass after the greedy walk: for every adjacent pair of
  resulting pages, remeasure them combined with a fresh probe, and
  merge if they genuinely fit together, self-correcting regardless of
  what caused the original split to be conservative. Safe by
  construction (a merge only happens when a real remeasurement
  confirms the fit); verified on a CV that genuinely needs 2 pages that
  nothing gets wrongly merged and no content is lost. Applied to both
  the single-column and two-column pagination paths; deliberately left
  the sidebar-template path alone (it composites two independently
  paginated streams by page index, and merging within just one risks
  breaking that alignment without a sidebar-template CV to verify
  against). File changed: `js/editor.js`.

## 2026-07-23 (later)

- `bb20e48` Fixed the actual root cause behind the header-spacing bug
  logged just below: Cas reported that increasing the Margin (top/
  bottom) slider in Customize pushed the name further off the top of
  the page on the banner-header templates, the opposite of what the
  slider should do. Found live: each of the 5 banner templates has a
  `.cv-paper.t-X { padding-top: 0 !important; }` rule so the header can
  own the top inset itself, but the header's own rule still had
  `margin-top: calc(var(--cv-margin-tb) * -1)` left over from before
  that padding-top:0 rule existed, when the negative margin's job was
  to cancel the page's own top padding. With nothing left to cancel,
  the header just drifts further above the true page top as the
  setting grows. Verified live (Playwright): header position relative
  to the page top went from +43px at the CV's saved 12mm setting to
  -101px at 50mm with the old CSS; a margin-top:0 override made it sit
  flush at 0 regardless of the setting. Changed `margin-top` to a flat
  `0` on `.cvp-header` for all 5 templates (Hunter Green, Blue Steel,
  Corporate, Clear Banner, Silver Banner), leaving the still-needed
  negative left/right margins and the bottom margin untouched. Also
  confirmed this is the real root cause of the previous commit's
  PDF-only fix: html2canvas was rendering that same orphaned negative
  margin as compressed padding rather than an off-page drift, and this
  CSS fix alone reproduces the identical corrected PDF output without
  the earlier JS workaround, which stays in place as a now-inert safety
  net. File changed: `css/main.css`.

## 2026-07-23

- `e01511b` Fixed the name rendering almost flush against the top edge
  of the header band in downloaded PDFs on the dark "banner" header
  templates (Hunter Green, Blue Steel, Corporate, Clear Banner, Silver
  Banner), reported by Cas with side-by-side photos of his editor
  preview vs. the actual downloaded PDF. Logged into Cas's account with
  Playwright to reproduce the exact reported CV/template live rather
  than guess: confirmed the compressed spacing is real and reproducible
  (not a font-loading race, which is the usual suspect for this kind of
  preview/PDF drift in this codebase; ruled out by forcing a guaranteed-
  loaded fallback font and an artificial delay before capture, neither
  of which changed the result). Root cause: these templates bleed their
  header background to the true page edge using a negative top/left/
  right margin that exactly cancels the page's own padding, which
  renders correctly in a real browser but is not reliably replicated by
  html2canvas (used by all three of this app's PDF-capture code paths).
  Rather than restructure the CSS across every affected template (a
  bigger, riskier change touching the same `.cv-paper` sizing rules
  `CLAUDE.md` already flags as fragile), added a shared
  `neutralizeHeaderBleed()` helper (`js/parser.js`, loaded by both
  `dashboard.html` and `editor.html`) that runs only on the detached
  clone used for PDF capture, converting the negative-margin bleed into
  a zero-margin layout before html2canvas ever sees it; the live,
  on-screen preview is untouched. Wired into all three PDF export
  implementations per the project's own documented gotcha about that
  duplication (`exportPaginatedPdf`/`exportFlowingPdf` in `js/editor.js`,
  `downloadCV()` in `js/dashboard.js`); the mobile Preview modal reuses
  the editor.js functions in blob mode, so it's covered too. Verified
  live: the gap between the header top and the name went from a
  compressed ~17px (matching the reported bug) to a comfortable ~43px,
  with no page-count regression, and confirmed the fix correctly no-ops
  on templates without the bleed trick, including the sidebar-panel
  templates (Atlantic Blue, Corporate Panel, Cobalt Edge, Obsidian Edge,
  Neutral Gray), which turned out to be a structurally different layout,
  not banner-bleed, despite superficially similar dark-header styling.
  Files changed: `js/parser.js`, `js/editor.js`, `js/dashboard.js`.

## 2026-07-10 (even later)

- `6fe469f` Audited the whole repo (all three .md files, all PRs and
  branches) for undone or stale work, at Cas's request. Found and fixed:
  a genuinely never-merged fix sitting in a stale draft PR (#7, opened
  2026-07-03): switching template/columns/header position now resets
  the live preview panel's scroll to the top (a shorter new template
  could otherwise leave the view scrolled past its own end, looking
  like content was missing). The draft's original approach no longer
  worked as-is since `renderRightPanel()` gained its own scroll-
  preserving logic (with a deferred `requestAnimationFrame` restore) in
  a later session, which silently clobbered a same-tick `scrollTop = 0`;
  fixed by giving `renderRightPanel()` an explicit `resetScroll` param
  instead. Also corrected three stale claims in `CLAUDE.md` (PDF export
  quality said `0.98`, actually `0.85`; the Mobile Preview Modal section
  still described the old CSS-zoom mechanism replaced earlier this
  session; the Playwright section said Chrome, only Firefox works in
  this environment) and checked off README's pagination checklist item
  (completed 2026-07-03, never marked done). Closed PR #7 and deleted it
  and one other now-fully-merged stale branch. Files changed:
  `CLAUDE.md`, `README.md`, `js/editor.js`.

## 2026-07-10 (later)

- `c9b160f` Made the mobile Preview button show the actual generated
  PDF instead of a live CSS approximation of it. Reported by Cas: the
  name wrapped onto multiple lines in the mobile preview but stayed on
  one line in the downloaded PDF, and the preview filled the page
  edge to edge while the PDF had proper margins. Investigated live on
  the deployed site with a real CV in a narrow viewport; the zoom/
  width math in `fitPaperZoom()` checked out correctly, which pointed
  to a WebKit/iOS-Safari-specific rendering quirk (same category as
  the font-boosting bug below) not reproducible outside a real device.
  Rather than keep chasing CSS fixes blind, changed the approach:
  `exportPaginatedPdf`/`exportFlowingPdf` (`js/editor.js`) gained a
  `mode` param so they can return `pdf.output('blob')` instead of
  triggering a save, and the mobile Preview modal now generates the
  real PDF this way and displays it in an iframe. Since it's the
  literal same file Download PDF produces, it can never visually
  disagree with it, on any device. Also hid the live CSS preview panel
  (`.editor-right`, `css/main.css`) entirely on mobile per Cas's
  suggestion: it was the exact thing prone to this drift, and is now
  redundant since the Preview button shows the real thing;
  `#cvPaperWrap` still renders invisibly there as the export source.
  Desktop's side-by-side live preview is unaffected. Verified with a
  local test harness (real `editor.html` markup, Firebase/Firestore
  stubbed out): confirmed a valid PDF blob (`%PDF-` header) reaches the
  iframe with no console errors, then had Cas confirm on his own phone
  before merging. Files changed: `css/main.css`, `js/editor.js`.

- `24fe5fe` Fixed iOS Safari inflating the font size of some entry
  text (e.g. an employer or school name) on mobile while the date/
  location text right next to it, sharing the exact same font-size
  CSS rule, rendered at the correct size. Root cause: iOS Safari
  auto-inflates the font size of some text blocks on narrow viewports
  ("text size adjust" / font boosting) based on its own column-width
  heuristics, applied independently per element; `main.css` never
  opted out of this WebKit-only behavior. Added the standard
  `-webkit-text-size-adjust: 100%` / `text-size-adjust: 100%` reset to
  the `html` rule. Could not reproduce the behavior in this session's
  Firefox-based testing tools (it's WebKit-specific), so pushed to a
  branch and had Cas confirm on his own phone before merging to main.
  File changed: `css/main.css`.

## 2026-07-10

- `09f0a15` Fixed `dashboard.js`'s `downloadCV()` (the gallery card
  Download button), a separate PDF-export implementation from
  `editor.js`'s that never received either of the fixes below it.
  Reported by Cas comparing a PDF downloaded from the editor (correct,
  282KB, 1 page) against the same CV downloaded from the dashboard on
  his phone (777KB, 2 pages, same content otherwise intact). Root
  cause: `downloadCV()` still used the old `quality:0.98`/`scale:2`
  settings, and waited on a flat `setTimeout(..., 400)` instead of a
  real font-load check before capturing, so a slower mobile connection
  could still be mid-font-fetch past 400ms, baking fallback-font
  metrics into both the raster and the page-break measurement (tipping
  otherwise-1-page content onto 2 pages). Brought `downloadCV()` in
  line with `editor.js`: same `0.85`/`1.5` quality/scale, and a new
  `ensureFontsReady()` (same pattern as `editor.js`'s) awaited before
  capture. Verified locally: built a test harness serving the repo
  statically, stubbed `cachedCVs`/auth so `downloadCV()` could run
  without real Firestore/Firebase, and used Playwright to intercept the
  blob `html2pdf`/`jsPDF` hands to `URL.createObjectURL` (the download
  itself can't be inspected directly in this sandbox). The exact CV
  content from Cas's report now produces a 1-page, ~225KB PDF, matching
  the editor's export. File changed: `js/dashboard.js`.

## 2026-07-09 (later)

- **PDF export: shrank JPEG quality (0.98 to 0.85) and html2canvas scale
  (2 to 1.5) in both export paths.** Cas reported downloads that were
  both corrupted (a page rendering as solid diagonal color stripes,
  like the striped-PDF report from a previous round) and unnecessarily
  large. Measuring the actual per-page canvas output confirmed the
  size problem directly: at quality 0.98, the JPEG for a typical page
  came out LARGER than a lossless PNG of the same page (780KB vs
  582KB) since a flat white background with dark text barely benefits
  from JPEG's compression at that near-zero quantization setting, while
  still paying the lossy-artifact cost for nothing. Dropping to 0.85
  (checked side by side, no visible difference at normal reading zoom)
  plus scale 1.5 (still print-quality at roughly 144 DPI) cut a real
  test download from 987KB to 414KB.
  - The corruption itself could not be reproduced in this session's
    sandboxed headless Chromium (both the raw html2canvas capture and
    the assembled PDF came out perfect on repeated tries), which points
    to it being a GPU/driver-specific canvas rendering artifact on
    Cas's actual machine rather than a deterministic code bug. Cutting
    the canvas pixel count by more than half (scale 1.5 vs 2) reduces
    GPU memory/texture pressure during capture, which is the standard
    mitigation for this class of hardware-dependent corruption, but
    this is a risk-reduction step, not a confirmed fix. Needs live
    confirmation from Cas; if it recurs, worth knowing whether it
    happens on every download or only sometimes, and whether disabling
    hardware acceleration in Chrome (chrome://settings > System) makes
    it stop, since that would confirm the GPU theory.

## 2026-07-09

- **Fixed the real cause of the "blank space on one page, content
  stranded on the next" pagination bug.** A screenshot from Cas nailed
  it: adjusting a Customize > Style slider (Line Height, Section
  Spacing, Margins, Font Size, etc.) or a Font dropdown on an already
  multi-page CV left a big gap at the bottom of a page with an entry
  stuck on the next one. Root cause: those controls (`onSlider`,
  `stepSlider`, `onFontChange`, plus most of `setSetting`) only called
  `applySettings()`, which re-styles the existing `.cv-page` elements
  (font, spacing, colors) but never re-runs the actual pagination
  measurement. So the page-break boundaries stayed frozen from whatever
  they were BEFORE the slider move, while the content's real height
  changed underneath them. Fix: all of these now also call
  `scheduleRepaginate()` (debounced 200ms) when the layout is paginated,
  the same reconciliation pass already used after text edits, so a
  settings change actually re-flows content across pages instead of
  leaving stale boundaries behind. Verified with a Playwright test:
  grew a CV to 2 pages by raising Line Height, then lowered it back down
  and confirmed content correctly flows back up instead of staying
  stuck on page 2.
  - Also added a small 1mm tolerance to the page-fit height comparison
    itself (all four measure-and-paginate functions), as a secondary
    robustness improvement against sub-pixel measurement noise between
    the offscreen probe and the live page.

## 2026-07-08 (even later)

- Fixed a second batch of bugs found while testing the previous fixes
  live:
  - **Header Tagline (the Font Size slider renamed from "Job Title"
    last round) still did nothing on some templates.** Same class of
    bug as the earlier Heading Style fix: 5 templates (Executive,
    Refined, Precision Line, Atlantic Blue, Corporate Panel) hardcoded
    `.cvp-jobtitle`'s font-size as `calc(var(--cv-base) * N) !important`
    at higher CSS specificity than the slider's own rule, silently
    overriding it on those templates only. Stripped the hardcoded size
    from all 5, keeping their color/style. Verified the slider now
    works across all 7 templates tested.
  - **Frame and Boxed heading styles stayed left-aligned even when
    FlowCV's reference shows them centered.** Added `width:
    fit-content` + `margin: 0 auto` + `text-align: center` to both, so
    they render as a centered badge/frame regardless of the section
    body's own text alignment.
  - **Added per-section icons, shown directly on the CV** (a FlowCV
    parity request): every section already had a sensible default icon
    internally (used only in the app's own Add Content / Section Layout
    UI until now); added a new opt-in "Section Icons" toggle (Customize
    > Style, off by default so existing saved CVs don't change
    appearance without asking) that shows each section's icon next to
    its heading on the actual CV, plus a dropdown in every section's
    Edit-panel header (not just Custom Section, which already had one)
    to change it.
  - **Investigated but did not resolve:** a report that a short
    trailing section moves entirely to the next page despite visible
    blank space at the bottom of the previous page. Could not reproduce
    with synthetic test data at several content lengths and template/
    font/setting combinations matching the screenshot. Needs the actual
    CV content or settings to pin down; left as an open item.

## 2026-07-08 (later)

- Fixed a batch of bugs reported after the Heading Style rework:
  - **Mobile Preview modal reflowed/oversized instead of showing a true
    miniature, and broke again specifically on reopen.** Root cause:
    `fitPaperZoom()` measured its container's size with a single
    `requestAnimationFrame`, but a `position:fixed; inset:0` container
    (the modal) can settle its real size asynchronously on mobile
    Safari, so that one-shot measurement could read a stale/zero width,
    especially the second time the modal opened. Replaced with a
    `ResizeObserver` on `#editorRight`/`#mobilePreviewBody` that re-fits
    whenever the container's real size actually changes. Verified with
    Playwright: identical zoom/width across open, close, reopen x3.
  - **Frame heading style only looked right when the heading text was
    centered.** Its top/bottom lines spanned the full column width, so
    left-aligned text left a long empty line trailing past the word.
    Added `width: fit-content` (matching the existing Short style).
  - **Entry job titles and company names rendered smaller and duller
    than the rest of the CV, specifically in downloaded PDFs.** Root
    cause: the font self-hosting pass only fetched upright/normal
    weights; the default Subtitle Style italicizes entry
    employer/date/location text (and several templates italicize the
    job title), so italic text silently fell back to the browser's
    synthesized (sheared) italic, which html2canvas renders with
    different metrics/weight than native browser text. Fetched and
    added real italic 400/700 `.woff2` faces for all 16 body-eligible
    self-hosted font families (20 new files). Verified with Playwright:
    the real italic face now loads and renders identically in both the
    live preview and the exported PDF.
  - **Font Size sliders in Customize felt disconnected from what they
    controlled.** The CSS cascade itself was correct (Base applies
    everywhere except the four elements with their own dedicated
    slider, no compounding), but "Job Title" only resized the header
    tagline under the name, while the per-entry job titles most people
    mean by "job title" were controlled by "Entry Header," an unclear
    technical label. Renamed to "Header Tagline" and "Job Titles".
  - **PDF export intermittently produced a fully garbled/striped image
    instead of the CV.** Could not get a deterministic repro in this
    session. Added canvas memory hygiene (explicitly zeroing each
    page's canvas dimensions right after use instead of leaving several
    large `scale:2` canvases to pile up across a multi-page export) as
    a best-effort mitigation, since memory pressure on mobile devices
    is the most plausible remaining explanation. While investigating
    this, discovered and reverted a PNG-encoding change that looked
    like a safer fix for the same bug but actually caused a severe,
    guaranteed regression: this bundled jsPDF embeds PNGs as fully
    uncompressed raw RGBA with no compression at all, ballooning a
    2-page CV from under 1MB to nearly 30MB. Stayed on JPEG. See
    CLAUDE.md's Known Gotchas #6 and #7 for details on both of these.

## 2026-07-08

- Fixed Customize > Heading Style doing nothing on most templates, and
  reworked its options to match FlowCV's picker (Cas's reference).
  Root cause: about 20 templates hardcoded their own section-heading
  border in CSS (`.cv-paper.t-xxx .cvp-sec-heading { border-…:
  … !important }`) at higher specificity than the `.hs-*` heading-style
  classes, so on those templates clicking any Heading Style option
  changed nothing; separately, the Accent Line toggle (on by default)
  recolored every heading border to the accent color, collapsing
  Underline/Line/Double/Dotted into near-identical looks. Changes:
  - Heading decoration (borders/underlines/backgrounds) now lives ONLY
    in the `hs-*` classes (`css/main.css`); template rules keep their
    colors/typography but no longer declare competing borders.
  - Each template's signature decoration moved into a
    `TEMPLATE_HEADING_DEFAULTS` map (`js/editor.js`): picking a
    template applies its signature heading style the same way it
    already applies its accent color, and the user's own pick
    afterwards genuinely sticks, on every template.
  - New picker with 9 visually distinct options modeled on FlowCV:
    Underline, Line, Short, Dash, Frame, Boxed, Bar, Wavy, Plain.
    Legacy values (bold/overline/double/dotted) still render for CVs
    that saved them, just no longer offered. Dash uses a
    linear-gradient and Wavy an SVG background tile instead of
    text-decoration/pseudo-elements specifically so html2canvas
    captures them in the PDF exactly as the preview shows.
  - One-time per-CV migration: a stored headingStyle of 'underline'
    (the old untouched default) maps to the template's signature style
    on first load after this ships, guarded by a persisted flag, so
    every existing CV looks exactly the same as before; explicit picks
    made after that survive reloads untouched.
  - Sidebar templates' colored panels get light-on-dark variants of
    the boxed band, dash, and wavy pigments so headings stay visible.
  Verified with Playwright: all 9 styles produce distinct computed
  decorations on a plain template; picks apply and stick on decorated
  templates (atlantic-blue, editorial-rule); template switching applies
  the signature default; the migration preserves an old CV's look on a
  decorated template while an explicit pick survives reload; dash,
  wavy, and boxed all render correctly in actual exported PDFs; and
  the standard pagination/PDF regression suite still passes.

## 2026-07-07 (even later still)

- `e11f188`: Reworked `js/parser.js` so CV import handles raw,
  uncleaned resume text instead of requiring a pass through Claude to
  clean it into an all-caps format first. Reverse-engineered what
  FlowCV's competing import feature does under the hood (captured its
  network traffic during a paste-text import): it turned out to be an
  8.7 second server-side call with no external AI provider domain
  contacted, strongly suggesting an LLM call proxied through their own
  backend. That needs a paid API and a server to hold the key, neither
  of which fits this project's zero-backend, zero-cost setup, so
  instead made the existing client-side heuristic parser meaningfully
  smarter: heading detection now recognizes title-case/sentence-case
  section titles (not just all-caps) via a whole-phrase keyword match,
  header parsing classifies lines by content (email/phone/URL pattern)
  instead of assuming a fixed line order, date range parsing
  understands "to" and "Date"/"Current"/"Now" as well as dashes and
  "Present", and work/education entry grouping now handles headers
  split across 2 or 3 lines without silently dropping or merging
  entries. Also fixed a pre-existing bug where an all-caps name on the
  first line could be mistaken for a section heading. Also fixed
  `js/editor.js`'s entry description rich text toolbar: Bold/Italic/
  Underline wrapped an entire multi-line selection in one marker pair,
  which the preview renderer could never match since it converts each
  line independently (and putting the marker before a leading bullet
  character broke bullet detection for that line entirely); List only
  ever bulleted the single line the cursor sat on. Both now operate
  per line. Verified all of this against both the original cleaned
  format and real raw resume text before pushing.

## 2026-07-07 (even later)

- Self-hosted every font the app uses (`css/fonts.css` + `fonts/*.woff2`,
  29 files, ~1.1MB total) instead of loading them from Google Fonts'
  CDN. Cas kept seeing the mobile preview/PDF render in a plain
  fallback font that didn't match the desktop version or the chosen
  font at all, even after the earlier font-loading-race fix. Root
  cause this time: the font-race fix could wait for a font to finish
  loading, but couldn't make an external network request to
  `fonts.googleapis.com`/`fonts.gstatic.com` faster — on a slow or
  flaky mobile connection that fetch can take a long time or fail
  outright, and the browser just keeps showing the fallback font for
  however long that takes. Removing the external dependency entirely
  is the only way to make font rendering as reliable as the rest of
  the (already same-origin) site, regardless of network conditions.
  Downloaded the Latin-subset `.woff2` for every family in the
  `FONTS`/`NAME_FONTS` lists (`js/editor.js`) plus the app's own UI
  fonts (Playfair Display, DM Sans) directly from Google's CDN with a
  script (fetches each family's CSS with a Chrome User-Agent to get
  real `.woff2` URLs, since Google's API sniffs the UA to decide which
  format to serve), generated matching `@font-face` rules, and replaced
  the Google Fonts `<link>` tag in all 5 HTML pages with one link to
  `css/fonts.css`. Verified with Playwright: launched with the proxy
  disabled and every non-localhost request blocked outright (so any
  remaining dependency on Google's CDN would hard-fail), confirmed
  every font the test CV used (Playfair Display, DM Sans, PT Serif)
  still reported `status: 'loaded'` and rendered correctly, and reran
  the full existing regression suite (pagination, PDF export on both
  viewports, Sort by Date, all three drag-reorder systems, the mobile
  Preview modal) with no regressions.

## 2026-07-07 (later)

- Fixed drag-to-reorder not working on mobile at all (sections, entries
  within a section, and the Customize tab's Section Layout chips).
  Root cause: all three used the native HTML5 Drag and Drop API
  (`draggable="true"` + `dataTransfer`), which no touch browser (iOS
  Safari, Chrome for Android) fires for touch input — it's mouse-only
  by spec, silently doing nothing on a phone. Replaced all three with
  SortableJS (loaded via CDN in `editor.html`, same pattern as
  html2pdf.js), which handles mouse and touch through one code path.
  Section cards now live in their own `#sectionsList` wrapper (so the
  header card and the Add Content button, previously direct siblings,
  can't get pulled into the reorder index math); the Section Layout
  panel's sidebar/main zones read the final chip order straight out of
  the DOM after a drag rather than tracking from/to deltas, since a
  chip can now cross between zones. Verified with Playwright
  (mouse-driven drag gestures, which exercise the same SortableJS
  pointer-handling code path touch input does) for all three: entries
  within Work Experience, whole sections in the left panel, and chips
  moving between the sidebar/main zones.

- Added a mobile Preview button (bottom-left floating button, matching
  FlowCV), so seeing your edits no longer means scrolling past the
  entire edit form first. Only appears under the same width the editor
  already stacks the form above the preview at (800px) — above that,
  the live preview already sits beside the form. Opens a full-screen
  overlay by MOVING the real `#cvPaperWrap` node into it rather than
  cloning it, so there's exactly one live preview element and it can
  never drift out of sync while open; closing moves it straight back.
  Required making `fitPaperZoom()` (`js/editor.js`) read its sizing
  target from `wrap.parentElement` instead of a hardcoded `#editorRight`
  reference, so the same zoom-to-fit logic sizes correctly against
  whichever container the preview currently lives in. The modal also
  has its own Download PDF button (triggers the same download flow via
  the existing header button).

## 2026-07-07

- Added a "Sort by Date" button next to each section's Delete button
  (`js/editor.js`), matching a feature on FlowCV. Reorders that
  section's entries most-recent-or-current-first, using whichever date
  field(s) that section type has (`startDate`/`endDate` for Work,
  Education, Projects, Courses; `start`/`end` for Organisations; a
  single `date` for Certifications, Awards, Publications, Declaration).
  An entry with no end date (a current role) sorts as "now", ahead of
  anything with an actual end date, via the existing `parseDateToMs`
  helper. Only appears for sections that actually have a date field and
  more than one entry — sections like Core Skills, Languages, and
  References don't show it. Verified with Playwright: scrambled a set
  of work entries, clicked the button, confirmed the resulting order
  and the debounced autosave both come out correctly reverse
  chronological.

## 2026-07-06 (even later)

- Fixed the mobile preview not matching the true CV layout the way it
  does on desktop (reported by comparing against FlowCV, whose mobile
  preview is a true proportional miniature of the exact desktop/PDF
  layout, just zoomed out). Two compounding bugs in `fitPaperZoom()`
  (`js/editor.js`), both only reachable on a narrow panel (mobile, or a
  desktop panel dragged narrow with the resize divider):
  1. `.cv-paper-wrap`'s own CSS rule is `width: min(var(--cv-paper-w,
     210mm), 100%)`. Clearing the inline width to `''` to "measure the
     true natural width" actually fell back to that capped rule, and on
     a narrow panel the 100% branch wins, so the measured width was
     never allowed to exceed the panel's own width. That meant the
     shrink-to-fit branch never ran; the CV's own content just reflowed
     natively at that narrow width, with full desktop-sized fonts
     crammed into a narrower column instead of being rendered at true
     size and uniformly zoomed down — a different, "squeezed" layout
     rather than a small version of the same one.
  2. Once (1) was fixed and the shrink branch started running, it
     revealed a second, previously-dormant bug: that branch set both
     `wrap.style.zoom = scale` AND `wrap.style.width` to the
     already-scaled-down pixel value. `zoom` shrinks the rendered
     footprint of whatever width is set, so setting width to a value
     that's already been scaled down gets shrunk a second time,
     rendering at roughly `scale^2` of the intended size (verified: CV
     name text rendered at 11px tall instead of the intended ~22px).
     Fixed by keeping width at the true physical page size in both
     branches and letting `zoom` alone do the shrinking.
  Verified with Playwright: the CV name element's rendered height now
  matches the true page width times the zoom scale exactly (both on a
  simulated mobile viewport and a desktop viewport with the panel
  divider dragged narrow), and the mobile preview now shows the full
  page edge-to-edge like FlowCV's, instead of a narrow reflowed column.

## 2026-07-06 (later)

- Fixed two mobile-layout bugs found during a general mobile audit of
  `editor.html` (simulated a phone viewport locally with Firebase
  auth/Firestore stubbed out, since no real device or login was
  available in this session). `.editor-header-right` holds six controls
  (undo, redo, Reimport, Saved, Download PDF) at a fixed `flex-shrink:
  0`, so their combined natural width is wider than any phone screen.
  With no wrapping, `justify-content: space-between` shoved that whole
  group left until it visually overlapped the back button/CV name, and
  even after making it wrap onto its own line, the group still rendered
  wider than the viewport (a wrapped flex item sizes to its own content
  width, not the row's width), keeping the entire page horizontally
  scrollable. Added a `@media (max-width: 800px)` rule for `.editor-
  header` (`flex-wrap: wrap`) and `.editor-header-right` (`flex-wrap:
  wrap; width: 100%`) so the control group gets a bounded box to wrap
  its own buttons inside onto a real second line, instead of overlapping
  or spilling off-screen. Verified with Playwright at 390x844: page
  `scrollWidth` dropped from up to 459px back to the true 390px viewport
  width, and the header now renders as two clean, non-overlapping rows.
  The template-picker thumbnail strip and per-entry edit modal were
  checked too and are already fine on mobile (the thumbnail strip's
  horizontal scroll is an intentional swipeable carousel).

## 2026-07-06

- Fixed inconsistent CV pagination (sometimes the last job entry flows
  onto page 2, sometimes everything fits on page 1, changing between
  refreshes of the same CV) and PDFs downloaded on mobile coming out in
  the wrong font compared to the on-screen preview. Root cause: Google
  Fonts loaded via the `<link>` tag in `<head>` fetch lazily and
  asynchronously (the browser doesn't download the font file until
  something tries to paint text in it), but nothing in `js/editor.js`
  waited for that fetch to finish before measuring page-break height
  (`measureAndPaginate`) or before capturing the PDF (`exportPaginatedPdf`
  / `exportFlowingPdf`). Whichever font (real or fallback) happened to be
  loaded at that exact instant got measured/captured, and that's a race
  whose outcome depends on network/cache timing, which is why it varied
  between page loads and was worse on slower mobile connections. Added
  `ensureFontsReady()` (uses `document.fonts.load()` +
  `document.fonts.ready`) and now await it before the first pagination
  pass in `initEditor()` and before generating a PDF in the download
  button handler. Verified the race and the fix offline with a Playwright
  test serving a local font behind an artificial delay: measuring
  immediately gave the wrong (fallback-font) height on every run, while
  measuring after `ensureFontsReady()` consistently gave the correct
  height.

## 2026-07-05 (even later)

- Fixed the on-screen preview showing text noticeably bigger/roomier
  than the same CV looks in the downloaded PDF. Root cause: the live
  preview's `.cv-paper` was hard-capped to `max-width: 660px` (a fixed
  "screen-friendly" size chosen in an earlier session), while the PDF
  export explicitly renders an off-screen clone at the TRUE physical
  page width (210mm / 215.9mm, roughly 794px/816px at 96dpi). Font
  sizes are set in fixed px, not relative to the container, so the same
  text wrapped inside a narrower 660px box on screen than in the
  ~794px-wide PDF box, making it look proportionally bigger on screen
  than what actually prints. Changed `.cv-paper-wrap` and
  `.cv-paper-wrap .cv-paper` (`css/main.css`) to size at
  `var(--cv-paper-w, 210mm)` instead of the fixed 660px, and added a
  line in `applySettings()` (`js/editor.js`) to set that CSS variable
  on `#cvPaperWrap` itself, since it's an ANCESTOR of `#cvPaper` (which
  already had the variable) and custom properties don't propagate
  upward. The existing `fitPaperZoom()` mechanism (already built to
  shrink an oversized preview via CSS `zoom` when the editor's sidebar
  is dragged wide) now shrinks from this true-size starting point
  instead of the old 660px one, so narrow panels still fit correctly
  without any overflow — it just makes the shrink starting point
  accurate, so proportions match the PDF at any zoom level. Verified
  with Playwright against the real client CV that prompted this report
  (read-only: measured dimensions and downloaded a PDF, no edits or
  saves triggered): on-screen paper now renders at 794px (matching true
  210mm) instead of 660px, and the downloaded PDF's text density/layout
  now visually matches the live preview. Files changed: `css/main.css`,
  `js/editor.js`.

## 2026-07-05 (later)

- Fixed the live preview jumping back to the top of the CV after saving
  an entry edit, adding an entry, renaming a section, or any other action
  that re-renders the right-hand preview panel. `renderRightPanel()`
  replaces `#cvPaper`'s entire innerHTML on every call, which can reset
  the scroll position of its ancestor scrollable panel (`#editorRight`)
  the same way `renderEditPanel()`'s own innerHTML replacement already
  needed a save/restore workaround for the left panel. Added the same
  save/restore pattern here, plus a follow-up restore one frame later
  (via `requestAnimationFrame`) since `applySettings()` schedules zoom
  and page-break recalculation asynchronously
  (`scheduleFitZoom`/`updatePageBreaks`), which can shift the scroll
  position again after the synchronous restore already ran. Verified
  with Playwright: scrolled both panels partway down, edited and saved
  an entry, confirmed both scroll positions held steady; no console
  errors. File changed: `js/editor.js`.

## 2026-07-05

- Fixed four bugs Cas hit while using the editor on a real client CV:
  - **Section drag-reorder didn't work in the Edit tab or Customize tab.**
    Root cause: neither `onDragStart` nor `onLayoutDragStart` in
    `js/editor.js` called `dataTransfer.setData()`, which Firefox (Cas's
    browser) requires for a drag operation to actually complete; Chrome is
    lenient about this, which is why it looked completely broken only for
    him. Added `setData()` to both drag-start handlers. Also consolidated
    the two separate, duplicated splice/remap implementations
    (`onDrop` and `reorderSections`) into one shared `reorderSections()`
    function used by both tabs, and removed a redundant double-render in
    `onLayoutDrop`.
  - **"(cont'd)" heading on continuation pages.** Removed the synthetic
    `"SECTION NAME (cont'd)"` heading `unitsToPageHTML()` used to insert
    when a section's content continued onto a new page; content now just
    flows onto the next page with nothing repeated. Kept the underlying
    per-page id-suffix logic (still needed to avoid duplicate DOM ids
    across pages), just detached it from the heading text itself.
  - **Section headings hard to edit.** The Edit tab's rename input only
    committed on `onchange` (needed to click away first); changed to
    `oninput` so the preview updates live while typing. Also added the
    same rename input to the Customize tab's Section Layout chips (it was
    previously a plain non-editable `<span>` there), so renaming doesn't
    require switching tabs.
  - **`**bold**`/`*italic*`/`` `code` `` showing as literal text.** The
    `mdLine()` markdown-to-HTML converter existed and worked correctly,
    but was gated behind a `cvSettings.useMarkdown` toggle that defaulted
    to off, and only bypassed via a hardcoded `force=true` in some call
    sites but not others (header contact info skipped it entirely). Made
    markdown parsing unconditional everywhere `mdLine()` is called
    (dropped the gate and the now-pointless toggle/setting), and switched
    header contact-row rendering from `escapeHtml()` to `mdLine()` so bold
    works there too.
  - Verified all four with Playwright against a throwaway scratch CV
    (never touching Cas's real client CV): dragged sections successfully
    in both tabs and between sidebar/main columns, forced a section to
    overflow across 2 pages with no "(cont'd)" text anywhere and no
    duplicate DOM ids, renamed a section from both tabs with live preview
    updates, and confirmed `**bold**`/`*italic*`/`` `code` `` rendered as
    real `<strong>`/`<em>`/`<code>` in both the live preview and the
    exported PDF with zero console errors. Files changed: `js/editor.js`,
    `css/main.css`.

## 2026-07-03 (later)

- Phase 3 (final phase) of extending real pagination to two-column
  layouts and the 5 sidebar templates (PR #4, stacked on PR #3/#2, not
  yet merged): added `paginateSidebarTemplate()`,
  `measureSidebarPanelAndPaginate()`, and `measureSidebarMainAndPaginate()`
  in `js/editor.js`, so the 5 sidebar templates (Atlantic Blue, Corporate
  Panel, Cobalt Edge, Obsidian Edge, Neutral Gray) now split into real
  `.cv-page` elements instead of the old flowing + guessed-overlay
  behavior, matching what Phases 1-2 already did for single-column and
  generic two-column layouts. These templates don't use
  `.cv-two-col-wrap`: the colored panel IS `.cvp-header` itself, so the
  panel (header + sidebar-assigned sections) and the main column
  paginate as two independent streams, then get composited per page.
  New: the panel's colored background continuing onto page 2+ shows a
  small persistent name strip instead of repeating the full header, so a
  printed page 2 isn't a bare color block with no CV owner attached.
  `getPaginationMode()` now returns `'sidebar'` for these templates
  instead of `'flowing'`; every other pagination call site needed zero
  changes. CSS: added a scoped `.cv-page[template]` override so a
  mismeasured page fails safe (renders slightly tall) instead of
  silently clipping content via the templates' original `overflow:
  hidden` (which assumed exactly one page). Verified with Playwright
  (in-memory test content, never saved to Firestore) across all 5
  templates: panel fills the page on a short CV, continuation strip and
  "(cont'd)" headings render correctly across 4 pages, panel keeps
  stretching to match main-column height even when sidebar content is
  short, PDF export page count matched the live preview exactly with no
  phantom trailing page, no console errors, and no regression to
  single-column mode. This completes the real-pagination extension;
  Mix layout stays on the legacy flowing path (unchanged, out of scope
  per the original plan). Files changed: `js/editor.js`, `css/main.css`.

- Phase 2 of extending real pagination to two-column layouts and the 5
  sidebar templates (PR #3, stacked on PR #2, not yet merged): added
  `paginateTwoColumn()` and `measureColumnAndPaginate()` in
  `js/editor.js`, so generic two-column CVs (Columns: Two, non-sidebar
  templates) now split into real `.cv-page` elements the same way
  single-column pagination already does, instead of the old flowing +
  guessed-overlay behavior. The sidebar-assigned and main-assigned
  sections paginate as two independent streams (each can overflow or run
  out independently), then get composited per physical page. Replaced
  the `isPaginatedLayout()` boolean gate with `getPaginationMode()`
  returning `'single' | 'twocol' | 'flowing'`; the 5 sidebar templates and
  Mix layout still fall under `'flowing'`, deferred to Phase 3 and out of
  scope here. `exportPaginatedPdf()` needed zero changes since it just
  iterates whatever `.cv-page` elements exist. Verified with Playwright
  (in-memory test content, never saved to Firestore): main-column
  overflow across 7 pages, sidebar-overflow-while-main-short, Header
  Position Left rendering inside the sidebar column, PDF export page
  count matching the live preview exactly with no phantom trailing page,
  and regression-checked that single-column and sidebar templates are
  unaffected. Files changed: `js/editor.js`.

- Phase 1 of extending real pagination to two-column layouts and the 5
  sidebar templates (PR #2, not yet merged): refactored
  `buildLayoutUnits()` in `js/editor.js`, extracting `buildHeaderUnit()`
  and `buildSectionUnits()` so a later phase can build partial unit
  streams (e.g. only sidebar-assigned sections) without duplicating the
  per-section-type flattening logic. Pure refactor, no behavior change to
  existing single-column pagination; verified with Playwright against two
  real single-column CVs (live preview + PDF export, no console errors).
  Full plan for phases 2 (generic two-column) and 3 (sidebar templates)
  saved separately; ask Claude Code to recall it when ready to continue.
  Files changed: `js/editor.js`.

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

# Changelog

Log of changes made to this repo by Claude Code sessions. Newest first.
Commit hashes refer to `main`.

## 2026-07-03 (even later)

- Reverted the banner-style header top-spacing change below (PR #6, not
  yet merged) after Cas clarified with an annotated screenshot: the gap
  he wanted removed was the earlier change's own cream padding between
  the paper's top edge and the banner, not the separate, pre-existing
  gap above the paper itself (editor canvas spacing, untouched by
  either change). The banner should sit flush against the top edge of
  the actual paper/sheet, as it did originally. Corporate, Blue Steel,
  Hunter Green, Silver Banner, and Clear Banner are back to cancelling
  the paper's top padding via `padding-top: 0` plus a negative top
  margin on `.cvp-header`. Verified with Playwright (screenshot) that
  the banner is flush against the paper's top edge again, no console
  errors. File changed: `css/main.css`.

- Restored top space above banner-style template headers (superseded by
  the revert above, kept here for the record). Corporate, Blue Steel,
  Hunter Green, Silver Banner, and Clear Banner each cancelled the
  paper's top padding (`padding-top: 0` plus a negative top margin on
  `.cvp-header`) so the header banner touched the very top edge with no
  white space, unlike every other template. Cas flagged this with side-
  by-side photos and wants space above on all of them. Removed the top-
  padding cancellation on all 5 while keeping the left/right
  cancellation, so the banner still spans full width edge-to-edge with
  the paper's normal top padding restored above it. Verified with
  Playwright across all 5 templates (each now has the same ~49px top
  gap other templates get from the paper's own padding) plus a PDF
  export, no console errors. File changed: `css/main.css`.

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

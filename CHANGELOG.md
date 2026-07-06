# Changelog

Log of changes made to this repo by Claude Code sessions. Newest first.
Commit hashes refer to `main`.

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

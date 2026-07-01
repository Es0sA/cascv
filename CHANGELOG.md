# Changelog

Log of changes made to this repo by Claude Code sessions. Newest first.
Commit hashes refer to `main`.

## 2026-07-01

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

# Changelog

All notable changes to Resume Revisor are documented here.

## [1.2.1] — 2026-06-10

### Fixed
- **PDF parsing failed on Netlify** with `DOMMatrix is not defined`. Root cause: `pdf-parse` v2 bundles a modern pdf.js build that requires browser DOM globals absent in Netlify's serverless Node runtime. Downgraded to `pdf-parse` v1.1.1 (older pdf.js that runs in Node) and imported its lib entry directly to avoid the package's debug harness. Verified against real exported resumes.

## [1.2] — 2026-06-10

### Added
- **Revision history:** The dashboard now lists all of a user's past revisions (date, job-description snippet, ATS before/after score) and lets each one be re-downloaded as a PDF. New `GET /api/revisions` endpoint backs the list.

### Fixed
- **File upload parsing:** Migrated to the rewritten `pdf-parse` v2 `PDFParse` API, resolving failures where some PDFs would not parse. Added:
  - File size (max 10 MB) and empty-file validation
  - Clear, specific error messages for corrupted/password-protected files
  - Detection of scanned/image-based PDFs with no extractable text
  - A helpful message for unsupported legacy `.doc` files (asking the user to re-save as `.docx`/PDF)
  - Stripping of pdf-parse page separators (`-- 1 of N --`) from extracted text

## [1.1] — 2026-06-08

### Added
- **Login page redesign:**
  - "Resume Revisor" app header above the sign-in card
  - Animated lava lamp background (login page only)
  - "Designed by Thaison Nguyen" footer credit
- Responsive layout improvements across mobile, tablet, and desktop

## [1.0] — 2026-06-08

Initial prototype — all five build phases complete.

### Added
- **Phase 1 — Foundation:** Next.js 14 + Tailwind + Supabase auth (sign up, log in, log out), protected dashboard, session persistence
- **Phase 2 — Upload + Parse:** PDF/.docx upload to Supabase Storage, server-side text extraction via `pdf-parse` and `mammoth`
- **Phase 3 — AI Rewrite:** Job description input, Anthropic API resume rewrite (Claude Sonnet) returning structured JSON, revisions saved to Supabase
- **Phase 4 — Comparison + ATS Score:** Side-by-side original vs. revised view, keyword-frequency ATS scoring (before/after), keyword highlighting, per-revision reasoning
- **Phase 5 — Export:** Revised resume export to PDF via `jsPDF`
- Netlify deployment configuration

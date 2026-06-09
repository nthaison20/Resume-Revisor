# Changelog

All notable changes to Resume Revisor are documented here.

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

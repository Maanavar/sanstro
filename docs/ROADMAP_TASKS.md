# Vinaadi — Roadmap Backlog

Items parked here are not blocking the initial release but need a product decision before implementation.

---

## Parked — awaiting product decision

### P2-04 — Jaimini / Chara Dasha mobile screen

**Status:** API complete. Mobile screen missing.
**File:** `app/calculations/jaimini_dasha.py`, `app/api/charts.py` (`GET /charts/{id}/chara-dasha`)
**Decision needed:** Add a "Chara Dasha" tab to the mobile Dasha screen alongside Vimshottari?
- Option A (recommended): Add mobile tab — the backend is fully ready.
- Option B: Defer to a later release and mark explicitly in the roadmap.

---

### P2-05 — Ashtakavarga and Bhava Chalit mobile views

**Status:** Both are in `ChartCalculateResponse` (API ready). No dedicated mobile display for either.
**Files:** `app/calculations/ashtakavarga.py`, `app/calculations/bhava_chalit.py`
**Divisional charts status:** CLOSED — already surfaced in `mobile/app/vargas/index.tsx`.

**Decision needed (for each):**

| Feature | Current state | Decision needed |
|---------|--------------|-----------------|
| Ashtakavarga | Drives scoring internally, in API response | Show bindu grid in Jadhagam screen, or keep internal-only? |
| Bhava Chalit | Powers house assignments, in API response | Show as overlay/toggle in Jadhagam, or keep as chart-build only? |

---

## Post-launch growth features (P4)

Tracked in `docs/AUDIT_REMEDIATION_PLAN.md` P4-01 through P4-15.

| ID | Feature | Status |
|----|---------|--------|
| P4-01 | WhatsApp share button on Today screen | Done 2026-06-29 |
| P4-02 | "Download the app" CTA on web home page | Done 2026-06-29 |
| P4-06 | og:image + schema.org on nakshatra pages | Done 2026-06-29 |
| P4-09 | Push notification opt-in post-first-score | Done 2026-06-29 |
| P4-12 | ta-IN locale formatting for times and dates | Done 2026-06-29 |
| P4-03 | API versioning (`/api/v2/` for breaking changes) | Not started — needs migration planning |
| P4-04 | Branded share card surfaced in mobile UI | Not started |
| P4-05 | Annual wrapped shareable card | Not started |
| P4-07 | Family calendar view | Not started |
| P4-08 | Porutham as top-level navigation item | Not started |
| P4-10 | Email capture on web content pages | Not started |
| P4-11 | Deep-link generation for charts | Not started |
| P4-13 | Tamil-language educational content | Editorial — commission translations |
| P4-14 | Referral / invite system | Not started — needs DB migration |
| P4-15 | Muhurtham finder (date-range search) | Not started |

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

### P2-05 — Ashtakavarga and Bhava Chalit mobile views — **CLOSED 2026-08-18**

**Files:** `app/calculations/ashtakavarga.py`, `app/calculations/equal_bhava.py` (the roadmap's
"bhava_chalit.py" was renamed per DOCTRINE §6), `app/calculations/divisional_charts.py`

| Feature | Ruling |
|---------|--------|
| Divisional charts | **Closed — already shipped.** `mobile/app/vargas/index.tsx` + the jadhagam varga strip. The note recorded this and was never cleared. |
| Equal Bhava | **Closed — already shipped**, as a labelled secondary lens in `dashboard-vargas-panel.tsx` listing only the grahas whose bhava differs from their rasi. Deliberately not a parallel house grid: whole-sign is the primary engine (DOCTRINE §6), and a second full chart would give the reader two contradictory house numbers per graha with no way to tell which one the app's text used. |
| Ashtakavarga | **Bindu grid approved** for the Jadhagam screen, ungated, and **not yet built** — this closes the decision, not the UI. The grid renders planet × rasi counts and SAV. It must not acquire a band word, a life-domain label, or a highlight on a karaka-relative house; those are gated disclosures (DOCTRINE §13, rulebook `STR-05`–`STR-07`) and belong on the life-area cards. Enforced by `tests/test_bav_disclosure_boundary.py`, so the grid cannot become a bypass by accident. |

**Remaining build work (not blocking):** the Jadhagam bindu grid UI itself — web and mobile.
The payload already ships on `ChartSummaryData.ashtakavarga`; no backend work is needed.

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

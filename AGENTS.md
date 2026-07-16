# AGENTS.md — Vinaadi AI

Entry point for any AI agent (Codex, Cursor, Claude Code, etc.) working in this
repo. This file only summarises the non-negotiables — read the authoritative
docs below before making changes.

**Read first**
- [CLAUDE.md](CLAUDE.md) — **authoritative** workspace rules: repo root, shell, DB safety, encoding, API contracts
- [docs/AGENT_INSTRUCTIONS.md](docs/AGENT_INSTRUCTIONS.md) — canonical reference: stack map, astrology/coding rules, Tamil + cultural rules, tone, UI/UX, anti-patterns
- [docs/INDEX.md](docs/INDEX.md) — map to every doc in the repo

---

## Non-negotiables (summary — CLAUDE.md wins on any conflict)

**Environment**
- Repo root is `D:\sanstro`. Start every command there.
- Use PowerShell; chain with `;` (no `&&`); avoid `head` (use `Select-Object -First N`).
- Python/Tamil output: set `$env:PYTHONUTF8 = "1"` and `$env:PYTHONIOENCODING = "utf-8"`. Save Tamil files as UTF-8 **without BOM**; never `Out-File` a `.py` (it defaults to UTF-16).

**Database safety**
- Dev DB `vinaadi_dev` (port 5432) holds REAL data — never `DROP` / `drop_all` / reset it, and never point pytest at it.
- Tests use `vinaadi_test` (port 5433) or SQLite. Every migration must be reversible. Back up before risky work.

**Astrology doctrine (strictly enforced)**
- Lahiri sidereal ayanamsa · mean-node Rahu/Ketu (Ketu exactly 180° opposite Rahu) · Whole-Sign houses · Vimshottari dasha · gochar counted from Chandra Rasi (primary).
- Rationale and ratified decisions: [docs/DOCTRINE_DECISIONS_V1.md](docs/DOCTRINE_DECISIONS_V1.md).

**Code contracts**
- API routes, query params, and response shapes are a shared contract across `app/api/`, `packages/shared/src/api/`, `mobile/`, and `web/` — grep all four and change callers together (see CLAUDE.md).
- Never hardcode real personal data (birth profiles, names, coordinates) in tests, fixtures, seed data, or docs — use clearly-synthetic identities.

---

**History:** the mobile gap-closure sprint checklist that previously lived in
this file (2026-06-21: BUG-1..3, FEAT-1..5, UX-1..9, WEB-1..3) is fully
complete and preserved in git history. Track new work in
[docs/MASTER_FIX_LIST.md](docs/MASTER_FIX_LIST.md) and
[docs/ROADMAP_TASKS.md](docs/ROADMAP_TASKS.md).

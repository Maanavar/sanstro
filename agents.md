# AGENTS.md — Jothidam.AI Build Instructions

## Project identity

This project is Jothidam.AI, a Tamil astrology daily companion webapp.

The system must follow:
- Thirukanitham / Drik Ganita astronomical calculations
- Lahiri / Chitrapaksha ayanamsa
- Sidereal zodiac
- Mean node for Rahu
- Ketu exactly 180° opposite Rahu
- Whole-sign South Indian charting as the primary house system
- Tamil Jyothidam interpretation rules
- Supportive, non-fearful, non-deterministic language

Do not mix tropical astrology, Western astrology, generic Vedic shortcuts, or North Indian chart display unless explicitly requested.

## Core documents to follow

Read these before coding:

1. docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md
2. docs/Jothidam_AI_Technical_API_Database_Spec_v1_Thirukanitham_2026.md
3. docs/Jothidam_AI_OpenAPI_v1_Thirukanitham_2026.yaml
4. docs/Jothidam_AI_PostgreSQL_Schema_v1_Thirukanitham_2026.sql
5. docs/Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md
6. docs/Jothidam_AI_MVP_Sprint_Execution_Plan_v1_Thirukanitham_2026.md

The formula engine spec is the source of truth for calculations.

## MVP 1 scope

Build only MVP 1 first:

1. Birth profile API
2. D1 Rasi chart engine
3. D9 Navamsa engine
4. Nakshatra and Pada engine
5. Daily Panchangam engine
6. Rahu Kalam, Yamagandam, Kuligai
7. Vimshottari Dasha engine
8. Current Gochar from Moon and Lagna
9. Sani cycle detection
10. Daily 0–100 guidance score
11. Family Vault
12. Family Aggregate Fortune
13. QA test runner

Do not build marriage Porutham, full Muhurtham finder, payment, expert consultation, or mobile app yet unless asked.

## Technical stack

Backend:
- Python
- FastAPI
- PostgreSQL
- SQLAlchemy or SQLModel
- Alembic migrations
- pytest
- pyswisseph / Swiss Ephemeris

Frontend later:
- Next.js
- Tamil + English bilingual UI

## Coding rules

- Write small, testable modules.
- Never hardcode chart outputs except in tests.
- Every calculation function must have unit tests.
- Every API must use Pydantic request/response models.
- All time handling must store both local birth time and UTC time.
- Use IANA timezone names.
- Do not silently assume IST for non-India births.
- All planetary longitudes must be modulo 360.
- All house counting must use inclusive zodiac counting:
  house = ((target_rasi - reference_rasi) % 12) + 1

## Astrology safety rules

- Do not write fatalistic predictions.
- Do not say “will happen.”
- Use “traditionally associated with,” “indicates tendency,” or “supportive/caution period.”
- Health output must be preventive only and must include medical-disclaimer style wording.
- Do not mention death predictions.
- Sani periods must be framed as discipline, restructuring, support, and care.

## QA rules

Before completing any task:
- Run unit tests.
- Add or update tests for changed calculations.
- Check that the old known mistakes do not return:
  - May 20, 2025 must not be marked as Wednesday.
  - Meenam must be Rasi 12, not 9.
  - Saturn in Meenam from Dhanusu Moon is Ardhashtama Sani, not Janma Sani.
  - Uthiradam 3rd Paadham maps to Kumbam Navamsa, not Magaram.
  - Gandanta uses 3°20′ zones, not 0.8° zones.

## Work style

When given a task:
1. Read the relevant docs.
2. Summarize the implementation plan.
3. Modify only required files.
4. Add tests.
5. Run tests.
6. Report changed files and test result.
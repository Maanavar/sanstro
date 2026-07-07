# Page Inventory — Index & Scope

**Scope:** The **web app only** (`web/app/*`) — the full public marketing/SEO site **and** the signed-in dashboard.
**Out of scope (for now):** The **mobile app** (`mobile/*`) is intentionally excluded from this inventory pass.
**Method:** Documentation only, read from source. No review, no recommendations. Templated route families (27 nakshatram pages, `[slug]`/`[event]`/`[date]`/`[year]` dynamic routes, etc.) are documented once as a template + instance list.

## Files
| File | Covers |
|---|---|
| `WEB_00_shared_chrome_and_home.md` | Public nav, footer, Home `/` |
| `WEB_01_marketing_trust_learn.md` | `/features/*`, `/pricing`, `/trust/*`, `/learn/*` |
| `WEB_02_public_tools.md` | `/tools/*` (jadhagam, porutham, muhurta, panchangam planner, rasipalan, friendship, chandrashtama, birth-time-rectification) |
| `WEB_03_seo_content_templates.md` | `/natchathiram/*`, `/dosham/*`, `/pariharam/*`, `/yogam/*`, `/temples/*`, `/tamil-calendar/*`, `/muhurtham-naal/*`, `/panchangam/*` |
| `WEB_04_misc_and_utility.md` | `/family`, `/notifications`, `/beta`, `/privacy`, `/terms`, `/share/panchangam`, `/widget/panchangam`, `/admin` |
| `WEB_05_dashboard_app.md` | `/login` (auth), the `/dashboard` SPA (all tabs, **both Classic + Nova themes**) + `/dashboard/*` standalone pages |

## Theme note
The dashboard offers **two user-selectable UI themes** (Settings → Session → "Look"): **Classic** (default; supports Light/Dark Appearance) and **Nova** (always-dark). Both are documented per-tab in `WEB_05` — same feature set, different presentation. (Corrects the earlier assumption that Nova was "the shipped variant" — Classic is the default.)

## Web coverage checklist (all documented)
- [x] Home + shared chrome
- [x] Features (4), Pricing, Trust (2), Learn (5)
- [x] Public tools (8)
- [x] SEO content families (natchathiram, dosham, pariharam, yogam, temples, tamil-calendar, muhurtham-naal, panchangam)
- [x] Misc/utility/legal/admin + signed-in notifications
- [x] Auth (login 4-mode) + Dashboard SPA tabs + standalone dashboard pages
- [ ] ~~Mobile app~~ — excluded this pass

# A12 assessment — birth-data consumers and confidentiality options

Date: 8 October 2026  
Scope: assessment only. No model, column, migration, row, key, or live database
was changed or inspected. `vinaadi_dev` contains real birth profiles and remains
out of scope for mutation.

## Executive finding

`birth_profiles.birth_datetime_utc` has no database-side filter, ordering,
join, uniqueness, or index consumer in current source. Every production read is
application-side calculation or response assembly. Removing it and deriving the
instant after decrypting the local fields, or encrypting it, is therefore
technically possible without replacing a SQL query.

That change alone would not meet a claim that an readable database dump hides
exact birth date/time. `charts.julian_day` is a reversible representation of the
same instant. `family_members.date_of_birth_local` stores a plaintext duplicate
of the encrypted local birth date. Persisted chart geometry and dasha rows are
also sensitive derivatives, while several location and export surfaces retain
plain birth/current-location information.

## Direct `birth_datetime_utc` inventory

| Consumer | Read/write | Purpose | Needs database-side filtering/ordering? |
|---|---|---|---|
| `app/models/birth_profile.py` | Storage declaration | Nullable plaintext `TIMESTAMPTZ` | No index or constraint |
| `app/services/_chart_persist.py:118-143` | Write on profile creation | Derives UTC from decrypted/request local date, time and timezone | No |
| `app/services/birth_profile_service.py:56-78, 153` | Write/clear on birth-moment edit | Keeps the cached instant aligned; clears it when time becomes unknown | No |
| `app/services/_chart_build.py:139-149` | Read with fallback | Converts the instant to Julian day for natal chart calculation | No; can derive after decrypting local fields |
| `app/services/_chart_build.py:658-714, 721-850, 876-884, 1108-1113` | Read/serialize | Builds birth-profile and full-chart API responses; full chart also emits the instant separately | No |
| `app/services/_dg_scoring.py:207-218` | Read with fallback | Birth instant for daily-guidance/dasha scoring | No |
| `app/services/shadbala_service.py:53-88` | Read | Exact instant for Shadbala; unknown-time path uses local noon | No |
| `app/services/daily_push_cron.py:379-393` | Read with fallback | Birth Julian day for dasha-transition alerts | No |
| `app/services/birth_profile_service.py:330-393, 473-524` | Read/serialize | Authenticated profile GET/list and `calculation_status` | No; status can use known-time semantics instead |
| `app/schemas/birth_profiles.py:125-135` | API contract | Emits `birthDatetimeUtc` in profile responses | Client contract, not SQL |
| `app/schemas/charts.py:239` | API contract | Emits `birthDateTimeUTC` in full chart data | Client contract, not SQL |
| `packages/shared/src/types/index.ts:345,500` | Client type | Handwritten twins of those response fields | No runtime use found |

Searches across `app/`, shared packages, mobile, web, and scripts found no
runtime SQL predicate or ordering on `BirthProfile.birth_datetime_utc`. The only
client references to the two JSON aliases outside shared types are test fixtures;
no web/mobile production component reads either alias directly.

## Other copies and equivalent disclosures

### Exact or near-exact birth moment

- `charts.julian_day` is plaintext and reversible to the UTC instant. It is
  populated by `_chart_persist.py` and returned in the full-chart API. Protecting
  only `birth_datetime_utc` leaves the same fact exposed.
- `chart_planets.absolute_longitude`, `charts.lagna_longitude`, D1/D9 positions,
  and `dasha_periods.start_jd/end_jd` are persistent sensitive derivatives.
  Exact inversion is more complex than converting Julian day, but these rows
  materially narrow or validate a birth time and should not be described as
  non-sensitive simply because they are calculated data.
- Full chart responses contain decrypted `birthDateLocal`, `birthTimeLocal`,
  birth location/timezone, `birthDatetimeUtc`, and `julianDay` together.

### Plain duplicate birth date

- `family_members.date_of_birth_local` is plaintext and is synchronized from
  the encrypted birth-profile date by `birth_profile_service._sync_linked_family_member`.
- Unlike `birth_datetime_utc`, it has a real SQL equality consumer:
  `family_vault_service.py:222` uses it in duplicate-member detection. An
  encryption design must replace that equality lookup (for example with a
  keyed blind index) or accept application-side candidate comparison.
- Family API responses expose `dateOfBirthLocal` by design to the authenticated
  owner.

### Location

- Birth latitude/longitude use encrypted SQLAlchemy types, but `birth_place` and
  `birth_timezone` remain plaintext. Combined with UTC they reconstruct the
  local birth clock; the place also identifies a sensitive personal attribute.
- `current_place`, `current_latitude`, `current_longitude`, `current_timezone`,
  and `current_location_updated_at` are plaintext. Current coordinates can be
  more immediately sensitive than a birth location.
- `panchangam_cache` stores precise latitude/longitude in plaintext. It is not
  user-linked, but correlation with request/log timing or uncommon coordinates
  can still disclose location.

### Caches, generated material, and exports

- `daily_scores.data` and `family_daily_scores` retain personalised derived
  guidance/narratives. These do not normally repeat the exact birth clock, but
  they reveal chart-derived health, relationship, family, and timing inferences.
- The mobile A07 allowlist persists `chart-full` for up to 30 days in encrypted
  device storage. `chart-full` calls `GET /charts/{id}` and therefore includes
  the full birth profile, exact UTC instant, Julian day, and natal positions—not
  merely a minimal chart summary. `dasha-timeline` and `daily-snapshot` persist
  additional derived data for 7 days and 1 day.
- Jadhagam report responses explicitly include local birth date, time, place,
  and timezone. PDF export prints the date, formatted time, and place. Downloaded
  PDFs leave server retention controls and must be treated as user-controlled
  exports, not protected database fields.
- `interpretation_outputs.structured_input/output_text` can hold arbitrary PII
  and narratives, although no production write path was found in current
  source. Its schema should remain in the privacy inventory rather than being
  assumed safe because it is presently dormant.
- `porutham_shares.snapshot` is deliberately minimized and documents that it
  excludes names and birth details. That is a positive boundary to preserve.

### API, logs, backups, and historical copies

- Authenticated profile/full-chart endpoints return exact local and UTC birth
  details. Field-at-rest encryption does not protect authorized API payloads,
  browser/native memory, screenshots, or client telemetry.
- Database backups and replicas contain every plaintext/derived field above.
  A future migration cannot erase old backup generations. Historical encryption
  keys and restore verification are part of any storage change.
- Existing central log redaction lowers accidental logging risk, but this
  assessment did not certify every deployed log sink, proxy, crash report, or
  analytics destination.

## Options for an owner decision

| Option | What changes | What it actually protects | Main cost / residual exposure |
|---|---|---|---|
| A. Derive UTC after decrypting local parts | Stop storing `birth_datetime_utc`; derive in application | Removes one redundant plaintext column | `charts.julian_day` still directly reveals the instant; historical backups remain |
| B. Encrypt UTC too | Replace with an encrypted datetime type and include key rotation | Hides that column in a dump | Same Julian-day bypass; no SQL loss today, but migration/key recovery complexity |
| C. Protect the complete natal-input/derivative set | Cover UTC, Julian day, family DOB duplicate, location policy, and selected chart derivatives; minimize client/cache/export payloads | Can support a defensible leaked-dump confidentiality claim, depending on chosen derivative boundary | Broad, populated data migration; blind indexes/application comparison may be needed; more decryption and operational key dependence |
| D. Retain plaintext and narrow the claim | Document that field encryption covers selected source columns, not reconstructable birth facts or derived charts | No migration risk | Explicitly accepts exact birth time/date disclosure from a readable dump |

## Assessment recommendation (not an implementation decision)

Do not approve an isolated `birth_datetime_utc` migration as “birth-data
confidentiality.” First decide the protection boundary:

1. Is the goal only to remove an accidental duplicate, or to hide an exact
   natal instant from a readable database dump?
2. Are natal chart positions and dasha timelines themselves classified as
   sensitive protected derivatives?
3. Must family DOB duplicate detection remain database-side, and if so is a
   keyed blind index acceptable?
4. Which exact fields may remain in mobile offline cache and downloaded PDFs?
5. What backup-retention and historical-key policy applies after migration?

If the goal is exact-instant confidentiality, the minimum coherent scope is
`birth_datetime_utc` **plus `charts.julian_day`**, with an explicit ruling on
`family_members.date_of_birth_local` and chart derivatives. Option A or B alone
improves column hygiene but does not satisfy that goal.

## Corrections found while ruling (2026-10-08)

1. **"UTC + Julian day" is not a coherent minimum.** Plaintext
   `charts.lagna_longitude` and `chart_planets.absolute_longitude` reconstruct
   the instant almost as well: the Moon moves ~13°/day (fixes the date), the
   lagna ~1° per 4 minutes (fixes the time to minutes). Protecting the two
   instant columns while leaving positions readable is theatre. The coherent
   choices were C-with-derivatives or D.
2. **Derivative encryption costs no SQL.** Every `ChartPlanet` query filters on
   `chart_id` and `graha` only (`app/api/charts.py:287,369,504`,
   `daily_push_cron.py:372`, `tajaka_service.py:60`, `shadbala_service.py:69`).
3. **The family DOB duplicate check needs no blind index.**
   `_find_duplicate_family_member` (`family_vault_service.py:206`) is scoped to
   one `family_vault_id` and already compares decrypted values in Python; the
   `date_of_birth_local`, `birth_place` and `birth_timezone` SQL predicates are
   narrowing only and can be dropped.
4. **The public claim was false.** "Birth details are encrypted at rest" (and
   in `legal.ts`, "Your data is encrypted in transit and at rest") was printed
   on six surfaces, English and Tamil.

## Owner ruling (2026-10-08)

| Question | Ruling |
|---|---|
| Goal | **Narrow the public copy now, then implement Option C**; restore stronger wording only once C ships on real rows. |
| Natal derivatives | **Encrypt them**: `charts.julian_day`, `charts.lagna_longitude`, `chart_planets.absolute_longitude` (and D9 positions), `dasha_periods.start_jd/end_jd`, alongside `birth_datetime_utc`. Rasi/nakshatra keys stay plaintext (coarse, not instant-precise). |
| Family DOB duplicate | **Encrypt `family_members.date_of_birth_local`; compare in Python.** No blind index. |
| Mobile cache / PDF exports | **Out of scope; document.** User-held data on the user's device or in the user's export; the "at rest" claim covers our servers. |

Copy narrowing is done (see `docs/MASTER_FIX_LIST.md`, A12). Guard:
`web/lib/encryption-claim-copy.test.ts` fails on any encryption claim in web
`app/`, `components/`, `lib/` or `packages/shared/src/data/`; delete it
deliberately when C ships.

**Delegated rulings (owner gave Claude the decision, 2026-10-08):**
- **Birth place and timezone: encrypted in C.** Dropping the duplicate-check
  predicates removed their only SQL consumers.
- **Current location: encrypted in C** — place, latitude, longitude, timezone.
  No SQL consumer; precise current coordinates are the more immediately
  sensitive fact. `current_location_updated_at` stays plaintext.
- **Backups and keys: forward-only.** Pre-migration dumps keep plaintext and age
  out under retention (manual deletion, owner-approved per file); the existing
  rule "old key retention ≥ backup retention" covers the new ciphertext. See
  `docs/DATA_PROTECTION.md` §3.

**Implemented** as migration `uu4e5f6a7b8c` — see `docs/MASTER_FIX_LIST.md`
A12b. Found during implementation and added to scope: `chart_planets.degree_in_rasi`
(with `rasi` it *is* the longitude), `speed_deg_per_day`, and `raw_payload`
(the full planet object, longitudes included). `dasha_periods` and
`varga_positions` have no writer and no rows and were left out; a test fails if
the chart path starts writing them.

**Residual that keeps the public copy narrow:** the plaintext rasi/nakshatra/pada
keys fix the birth year and month, narrow the day to one or two candidates, and
the time to a ~2-hour lagna window. Exact instant: protected. Birth date: still
inferable from a dump.

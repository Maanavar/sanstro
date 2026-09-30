"""The two version strings this platform stamps, kept apart on purpose.

They used to be one literal, `"thirukanitham-2026-v1"`, hand-copied to about
thirty call sites, while the chart engine's own constant had moved on to
`jothidam-formula-engine-v1.4-2026`. Two things went wrong with that:

1. **A lookup filtered on it.** `birth_profile_service.get_birth_profile` and
   `_chart_persist.calculate_chart_for_persisted_profile` both restricted their
   chart query with `Chart.calculation_version == calculation_version`. The
   birth-profiles API handed them the frozen literal; `family_vault_service`
   wrote charts stamped with the engine constant. So a family-vault member's
   chart existed and `GET /birth-profiles/{id}` still answered
   `chart_id: null`. Neither read filters on the version any more — a chart is
   found by its profile, and the version records *which engine produced it*,
   which is provenance, not identity.

2. **Bumping the engine constant did nothing.** Its own comment claimed a bump
   "invalidates stored charts so they recompute on next load". It never could:
   `load_persisted_chart_response` rebuilds from the stored rows without
   consulting the version at all, and every path that passed the frozen literal
   compared a string that never changed. Invalidation is now an explicit,
   separate decision rather than a side effect nobody verified.

Keeping the two names distinct matters because they answer different questions.
`CHART_CALCULATION_VERSION` describes the astronomical engine that computed a
natal chart — it moves when the ephemeris, the sunrise convention or the Maandhi
doctrine moves. `API_RESPONSE_VERSION` is the platform label on responses that
are not charts (daily guidance, dasha story, varshaphala, Ask Vinaadi); folding
those into the chart version would make every chart-engine bump look like a
change to surfaces the engine never touched.
"""
from __future__ import annotations

#: The natal-chart engine. The ONE string written to `Chart.calculation_version`
#: — every write path resolves to this, and a client cannot choose it (see
#: `ChartCalculateRequest.calculation_version`, which is accepted and ignored).
#:
#: v1.3 (2026-09-29): sunrise/sunset moved from disc-centre / no-refraction to
#: the apparent upper-limb event including refraction (owner ruling; see
#: SunriseConvention in app/calculations/ephemeris.py and
#: PANCHANGAM_CACHE_DATA_VERSION v47). Charts inherit that anchor, so every
#: chart persisted before it is numerically stale in two ways:
#:   - Maandhi: the span boundaries scale with day length, which grew ~7.2 min,
#:     so the Maandhi degree moves on EVERY chart (measured at Chennai).
#:   - is_daytime: births within ~3.6 min of sunrise or sunset now classify the
#:     other way (~0.50% of birth times), flipping the day/night Maandhi branch
#:     and Kala Bala's day/night term.
#:
#: v1.4 (2026-09-30): a birth with NO TIME on file no longer counts as a
#: daylight birth. `resolve_daytime_birth` returns None there and Kala Bala
#: scores nathonnatha at the 0.7 midpoint instead of awarding Sun/Jupiter/Venus
#: the full day term and docking Moon/Mars/Saturn to 0.4. Only time-less
#: profiles move; every chart with a birth time is numerically identical to v1.3.
#:
#: Bumping this does NOT recompute anything on its own — see the module
#: docstring. A recompute is a deliberate migration.
CHART_CALCULATION_VERSION = "jothidam-formula-engine-v1.4-2026"

#: The platform label for non-chart responses. Deliberately NOT the chart
#: engine version: a daily-guidance digest, a dasha story, a varshaphala sheet
#: and an Ask Vinaadi answer are not natal charts, and must not appear to change
#: whenever the ephemeris doctrine does. Kept at the historical string so no
#: outward-facing value moves as part of the unification.
API_RESPONSE_VERSION = "thirukanitham-2026-v1"

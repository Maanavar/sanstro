"""Runtime-editable feature flags stored in process memory."""
from __future__ import annotations

from typing import Any

from app.core.config import get_settings


def _defaults() -> dict[str, Any]:
    settings = get_settings()
    return {
        "enable_admin_data_delete": bool(settings.enable_admin_data_delete),
        "ask_vinaadi_daily_limit": int(settings.ask_vinaadi_daily_limit),
        "enable_push_notifications": True,
        "maintenance_mode": False,
        "max_birth_profiles_per_user": 10,
        # D1 reasoning gate (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 1).
        # Rollout: internal → beta → all; watch for over-suppression
        # (too many BLOCKED/SILENT means the gate is too strict).
        # Flipped to internal 2026-07-03 per plan §8 rollout order, step 2 —
        # PR-1 thresholds already signed off (§11). Watch for over-suppression
        # before promoting to beta.
        "reasoning_gate": True,
        # D2/D3/D7 ordinal bands (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 2).
        # Speaks in Band words (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT) and
        # exposes the `band` field on whatif/marriage/daily-guidance responses;
        # derives marriage's legacy confidence tier from the band. Numeric
        # scores are deliberately NOT stripped from copy — product decision
        # 2026-07-13 (P0-1, docs/PREDICTION_DOCTRINE_AND_ROADMAP.md) is to show
        # both the band and the score, not replace one with the other.
        # Independent of reasoning_gate so copy can roll out separately.
        # Flipped ON 2026-07-13 (P0-1 rollout — value already built, ship it).
        "reasoning_bands": True,
        # D4 contradiction engine (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 3).
        # Classifies gate-vs-timing disagreement into a Reading and speaks it
        # ("promised but not now" / "active period, but not this"). Readings
        # derive from the promise gate, so this only has user-visible effect
        # when reasoning_gate is also on.
        # Specialist sign-off closed 2026-07-13 (plan §15.3, P0-2):
        # §15.1 six templates approved as-is; §15.2 WEAK-gate framing decided
        # Option B (new PARTIALLY_PROMISED reading, distinct from
        # ACTIVE_BUT_UNPROMISED's full redirect); golden-set worksheet's 17
        # TODO rows annotated (tests/golden/reasoning/golden_set_worksheet.json).
        # Flipped ON 2026-07-13 (P0-2 rollout).
        "reasoning_contradiction": True,
        # D5 calibration data spine (docs/REASONING_LAYER_UPGRADE_PLAN.md Phase 4).
        # Silent-launch: log material predictions on serve + join outcomes so
        # hit-rates accrue for weeks before anyone trusts them. No user-facing
        # behaviour change; the read side is admin-only.
        # Flipped ON 2026-07-03 per plan §8 rollout order (turned on first,
        # precisely because it's invisible — needs weeks of collection before
        # n>=30/bucket makes hit-rates meaningful).
        "reasoning_calibration_log": True,
        # Chart signature + root-cause chains (docs/REASONING_LAYER_UPGRADE_PLAN.md
        # Phase 5). Adds a chart-level "dominant graha" framing sentence and,
        # for LOW-confidence life areas, an ordered "because ... therefore ..."
        # causal chain instead of a flat factor list. Purely additive/optional
        # response fields; no change to any score or gate.
        # Specialist review closed 2026-07-13 (P0-4,
        # docs/PREDICTION_DOCTRINE_AND_ROADMAP.md): all 9 SIGNATURE_VOICE
        # motif framings correctly reflect classical graha significations
        # (e.g. Saturn=delay-then-reward, Rahu=ambition/reinvention).
        # §16's "falls back to Sun on no signal" doc claim was found stale —
        # the code actually raises ValueError on malformed/empty chart data
        # (caught gracefully by callers), which is the more doctrine-correct
        # choice (D6: never fabricate a claim) — doc corrected, code kept as
        # built. Wiring extended from life-areas-only to whatif/marriage in
        # this same pass. Flipped ON 2026-07-13.
        "reasoning_chart_signature": True,
        # Track A synthesis (humanization). Composes the six already-computed
        # daily `reasons` + component scores into ONE prioritized, flowing
        # briefing (verdict lead → 1-2 salient signals → one action) instead of
        # the flat six-row stack. Populates the additive `briefing` field on
        # daily guidance; nothing else changes. Tamil glue native-reviewed and
        # approved 2026-07-09; enabled together with the DAILY_SCORE_ENGINE_VERSION
        # bump so cached rows regenerate with the briefing. Frontend falls back to
        # the six-row `reasons` if `briefing` is ever null.
        "daily_briefing_synth": True,
        # "Chances & Cautions" life-propensity panel. Additive read-only
        # endpoint (GET /charts/{id}/propensities).
        # Specialist copy review closed 2026-07-13 (P0-3,
        # docs/PREDICTION_DOCTRINE_AND_ROADMAP.md): all 8 sensitive-tier
        # disclaimers (5 shared DISCLAIMER_* constants + 3 folded from
        # inline literals) read as appropriately hedged, non-alarming, and
        # redirect to real professionals without diagnosing or predicting
        # doom. Sequenced after P1-1 (safety_filter serve-time tone pass)
        # and P1-2 (hard suppression of sensitive cards for minors/opt-in
        # reduced-content preference) per the roadmap's own §7 recommendation
        # — never widen sensitive-domain exposure without the safety pass
        # in place first. Flipped ON 2026-07-13.
        "propensity_insights": True,
        # Timing-vote band cutoffs (app/reasoning/timing_vote.py::timing_band_from_score).
        # Recalibration mechanism (docs/PREDICTION_DOCTRINE_AND_ROADMAP.md P3-2/P3-3):
        # admin reviews GET /admin/calibration hit-rates per band, and once a bucket
        # has enough volume to be meaningful (n>=30), can nudge a cutoff via the
        # existing PATCH /admin/flags/{flag_name} endpoint (auto-audit-logged via
        # log_admin_action) instead of a code change + deploy. Defaults reproduce
        # timing_band_from_score()'s original hardcoded cutoffs byte-for-byte — no
        # threshold has actually been changed yet; only 10 days of data exist as of
        # 2026-07-13, well short of the n>=30/bucket bar the roadmap itself sets.
        "timing_band_strong_cutoff": 75,
        "timing_band_likely_cutoff": 60,
        "timing_band_mixed_cutoff": 45,
        # Nadi Dosha cancellation rule (A-9 v2, astrologer live session ruling
        # 2026-07-14, docs/ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md). Gates
        # the rasi-lord-friendship cancellation branch in
        # app/calculations/porutham.py::check_nadi_dosha (the two Classical
        # Exceptions — same nakshatra/different pada, same rasi/different
        # nakshatra — apply in every mode regardless of this flag).
        # "strict" (default): friendly rasi lords → partial mitigation only,
        # dosha stays flagged. "classical_lenient": friendly rasi lords → full
        # cancellation. Admin-editable via the existing PATCH /admin/flags
        # mechanism; string value, not boolean.
        "nadi_parihara_mode": "strict",
        # Holistic Planet Strength Synthesis (docs/THIRUKANITHAM_STRENGTH_SYNTHESIS_2026-07-23.md).
        # Second-pass refinement of the natal strength_score that layers the four
        # relational measures a Tamil reading synthesises but the base Shadbala
        # blend omits: G1 functional lordship (lagnadhipathi/yogakaraka/dusthana),
        # G2 yuti (company kept, graded by the co-tenant's nature+strength),
        # G3 neecha bhanga (debilitation cancellation), G4 aspect relief weighted
        # by the aspecting planet's own strength. Bounded ±22 so it refines,
        # never dominates, the base score; flag-OFF is byte-identical to today.
        # OFF by default pending astrologer weight sign-off (spec §7). Changes
        # every downstream prediction, so bump DAILY_SCORE_ENGINE_VERSION when
        # flipping ON. Flipped ON 2026-07-23 after the §6.3 live-diff validated
        # the numbers (bounded, conservative) and the astrologer signed off the
        # weights + node handling (nodes carry no lordship delta — spec §7).
        "holistic_strength_synthesis": True,
        # Numerology engine master gate (docs/NUMEROLOGY_IMPLEMENTATION_PLAN_2026-07-25.md).
        # Phases 1-4 are built and tested — Chaldean core, object numerology
        # (mobile/vehicle/house), the Fortune Alignment chart bridge, compatibility
        # (NUM-34) and time numerology — plus the name-correction half of Phase 5.
        # Flipped ON 2026-07-28 to launch the numbers-only surfaces (favourable
        # numbers, Fortune Alignment, personal cycle, lucky/marriage dates, name
        # sessions) — deliberately decoupled from content review, because
        # numerology_content.CONTENT_REVIEWED is a SEPARATE gate that still
        # nulls every interpretive string (schemas/numerology.py::reviewed_prose)
        # regardless of this flag: no Tamil native has read the root 1-9 or
        # compound 10-52 copy yet, so this launch ships numbers and graha names
        # only, same as it always would have. NU-05 is discharged — the compound
        # series is sourced to Cheiro, Book of Numbers, 1935 ed., pp. 126-133.
        # Peyar Porutham (NUM-34) and name-correction alternatives stay unbuilt
        # on the frontend regardless — see dashboard-numerology-panel-nova.tsx
        # docstring — because those two are sentence-shaped, not number-shaped.
        "numerology_engine": True,
        # Doctrine D1 — personal year rollover epoch. String flag (same mechanism
        # as nadi_parihara_mode) so every branch ships and the ruling is a
        # PATCH /admin/flags call, not a code change. See
        # docs/NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md D1 for sources.
        #   "birthday"  (default) — increments on the native's birthday.
        #   "january"   — increments 1 January. This is the DOMINANT published
        #                 convention in both Pythagorean and Chaldean practice.
        #   "chithirai" — increments at Tamil new year; a minority Tamil view.
        # Default is "birthday" on a coherence argument, not a claim that the
        # calendar-year method is wrong: Vinaadi already computes varshaphala
        # from the solar return (app/calculations/tajaka.py::find_solar_return_jd),
        # which is the birthday boundary. Two "your year ahead" features with
        # different year boundaries would contradict each other in the same app.
        # CORRECTION (2026-07-25): an earlier revision of this comment asserted
        # that 1 January is "correct in neither tradition" and is a bug. That was
        # wrong — it is the most widely published method. The option exists.
        "numerology_personal_year_epoch": "birthday",
        # Doctrine D2 — baby-naming precedence. "pada_first" (default): only
        # names carrying a valid nakshatra-pada akshara are returned, numerology
        # ranks within that set. "pada_weighted": pada-valid names rank far
        # higher but siblings may be reached for, clearly marked. A
        # "numerology_first" mode is deliberately NOT offered — it would let a
        # number override a graha, which the astrologer ruled against.
        "numerology_naming_mode": "pada_first",
        # Plan §9.1 — a number never overrides a graha. When True (the default,
        # and the only value the doctrine actually sanctions) no name-change
        # alternative may be offered without its Fortune Alignment against the
        # native's own chart; a variant whose alignment could not be computed is
        # dropped rather than shown unscored. Registered with Phase 5 because
        # name correction is the first feature capable of violating it —
        # everything before it either had no recommendation to make or could not
        # be reached without a chart. Exists as a flag rather than a constant so
        # a support/debug session can inspect an unaligned ranking without a
        # deploy; turning it off in production would make this a generic
        # numerology app with a jadhagam bolted on.
        "numerology_alignment_required": True,
        # Doctrine D4 — what makes two *numbers* compatible (NUM-34). String flag,
        # same mechanism as the two above; both branches ship and are tested.
        # See docs/NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md D4 for the sources.
        #   "cheiro_series" (default) — Cheiro's own person-to-person doctrine:
        #       the sympathetic groups {1,2,4,7} and {3,6,9}, 5 friendly with
        #       almost anyone, 4 and 8 interchangeable. He names sympathies and
        #       never enmities, so this basis can RAISE a compatibility score and
        #       can never lower one. Every negative verdict comes from the
        #       poruthams, which is standing ruling 1 taken to its conclusion.
        #   "graha_maitri" — number -> graha -> Parashari natural friendship, the
        #       table shadbala/porutham/daily-guidance already share. Scores the
        #       full range including enmity.
        # Default is Cheiro because naisargika maitri is a *dignity* rule — it
        # governs how a graha behaves in another graha's sign, not whether two
        # people get on. Cheiro states the person-to-person doctrine explicitly,
        # and Chaldean numerology reached Tamil practice through him (NU-05).
        # The naisargika regard is reported on every pair either way, so an
        # astrologer always sees the graha view alongside the numerology one.
        "numerology_compatibility_basis": "cheiro_series",
        # Baby naming (NUM-50/51/52, plan Phase 5 "blocked" half). Independent of
        # `numerology_engine` — everything else that flag guards ships numbers
        # only and has no data-quality dependency beyond the Chaldean table
        # itself. This feature stacks TWO unresolved blockers instead of one:
        #   1. app/data/nakshatra_pada_akshara.py is 0/108 rows verified
        #      (CANON_VERSION "0.1.0-draft"); assert_canon_usable() raises
        #      UnverifiedCanonError outside dev/test as a backstop, independent
        #      of this flag.
        #   2. app/data/tamil_name_corpus.py is a corpus I (the assistant)
        #      authored to exercise the pipeline — zero rows have astrologer
        #      review.
        # Flipped True 2026-07-30 on product direction: ship access to
        # everyone now (no tier gate exists for this feature yet), add a
        # premium/pay-per-use gate in a later pass, and flip this off then if
        # the access model needs it instead. NOTE this flag alone does not
        # make results reach a real user today — see UnverifiedCanonError
        # above, still unresolved as of this flip.
        "numerology_baby_naming": True,
        # "Your Chart in One Minute" (docs/ONE_MINUTE_READING_2026-08-04.md).
        # A ~200-word plain-language reading composed from engines that already
        # exist — Vimshottari, strength scores, the age gates, the dasha/area
        # affinity table. No new calculation, no LLM, no new content gate.
        #
        # This is a ROLLOUT flag, not a content gate, and the distinction is the
        # point: flag-off means the feature is absent, not that it renders with
        # its sentences nulled. The four numerology CONTENT_REVIEWED gates
        # produce the latter, and docs/DASHBOARD_PRODUCT_DECISIONS_2026-08-02.md
        # P0-2 is a full account of why that outcome is worse. The Tamil copy
        # here ships under a PENDING NATIVE-TAMIL REVIEW marker in the service
        # docstring, which is the same posture nakshatra_content.NAKSHATRA_LENS
        # already ships live under.
        #
        # Flipped True 2026-08-04 so the surface is reachable for the authed
        # browser pass — with it off the route 404s and the component renders
        # null, so the review could not happen at all. If the browser pass finds
        # something that cannot be fixed in the same sitting, set this back to
        # False rather than leaving a half-right reading on Family & Charts.
        "one_minute_reading": True,
        # "Your Chart in Five Minutes" (docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md).
        # Off by default -- unlike one_minute_reading this ships with only 4 of
        # 8 beats built (1, 2, 3, 8; see five_minute_reading_service.py's module
        # docstring for what's missing) and the "self" register only. Flip True
        # only for the authed review pass, same as one_minute_reading's own
        # rollout did, and only once that pass is done.
        "five_minute_reading": False,
    }


_overrides: dict[str, Any] = {}


def get_flag(name: str) -> Any:
    defaults = _defaults()
    if name in _overrides:
        return _overrides[name]
    return defaults.get(name)


def set_flag(name: str, value: Any) -> None:
    defaults = _defaults()
    if name not in defaults:
        raise ValueError(f"Unknown flag: {name}")
    _overrides[name] = value


def reset_flag(name: str) -> None:
    _overrides.pop(name, None)


def all_flags() -> dict[str, dict[str, Any]]:
    defaults = _defaults()
    return {
        name: {
            "name": name,
            "value": get_flag(name),
            "default": default,
            "overridden": name in _overrides,
        }
        for name, default in defaults.items()
    }

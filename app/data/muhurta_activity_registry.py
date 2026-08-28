"""Which sourced rule table governs which muhurta activity.

One place binds an activity key to the constants extracted from a classical
text, to the `rule_id` that leads back to the page, and to the bilingual label
the reason copy names it by. `muhurta_engine` reads this registry instead of
growing an `if activity == ...` branch per chapter.

**MARRIAGE is deliberately absent.** Its tithi doctrine is paksha-conditional
across three tiers — a sweep that applies in the dark fortnight only and
overrides the best-list where they overlap (`marriage_muhurta_rules.
MARRIAGE_TITHI_INAUSPICIOUS_KRISHNA_AFTER_ASHTAMI`) — which the flat shape below
cannot express. Rather than flatten it, and silently re-score every marriage day
in the process, the engine keeps its existing marriage branch and consults this
registry for everything else.

The cost of that absence: any code that asks this registry a question about an
activity gets `None` for MARRIAGE and must decide what that means. See
`muhurta_engine._activity_rules_on_amavasai`, where the `None` was read as "the
chapter has not ruled" and left the new moon scored by generic convention alone
for every wedding date (FCR-10c).

**Severity grading is read off the source's verb, not chosen for convenience.**
This is the one place in the pipeline where a translated sentence becomes a
number, so the rule is written down:

* **VETO** — the passage prohibits with a stated consequence or a categorical
  imperative: *"should be totally avoided"*, *"one should not start any function
  of feeding on those days ... will cause misery"*, *"Other Thithis are not to
  be considered"*, *"Avoid Rikthai"*. Applied only to **nakshatra and tithi**,
  the two primary day-selection factors.
* **PENALTY** — everything softer. Absence from a non-exhaustive "best" list;
  an exclusion phrased as *"all Thithis except X are auspicious"* (X is left out
  of the auspicious set, which is weaker than being forbidden); and lagna rules,
  none of which state a consequence.
* **Weekday VETO (owner ruling, 2026-08-17)** — every activity-specific weekday
  in a source's `vara_avoid` set is a categorical date-selection rule. This
  does not invent a universal Saturday ban: activities whose own sources name
  Saturday favourable, or name no avoided weekday, remain eligible.

The lagna grading follows the precedent already set by
`MARRIAGE_LAGNA_SIGN_PREFERENCE`, whose provenance record states that "should be
avoided" is treated as a strong penalty and not automatically a hard veto.

**Karana is graded VETO-class, and the grade is not what limits it.** All four
karana passages are imperatives — "Sakunam and Vishti Karanas should be avoided"
(Ch. III p.30), "Sthira Karanas ... and Vishti Karanas should be avoided" (Ch.
XXI p.110), "Avoid Rikthai and Vishti Karana" (Ch. XXI p.112) — and
`docs/MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2_2026-08-14.md` already records this
repo's position, "Default Tamil profile: VISHTI => VETO at L2 for subha karya".
So the prohibition is a veto *at the elected moment*, which is the scope the
text speaks in.

What the engine cannot do is promote that to a flat date veto. A karana spans
half a tithi, so a date carries two or more, and `PanchangamSnapshot` supplies
only the active one and its successor. Vetoing the whole date on a karana that
expires mid-morning would discard hours the text never condemned; ignoring the
change would certify hours it did. So `muhurta_engine._karana_factor` vetoes only
when **both** supplied karanas are prohibited — a span with no clean side — and
otherwise penalises and names the transition, leaving the exclusion to a
time-level layer. That is deliberately conservative: it does not certify later
transitions the snapshot never showed, and window selection still needs a full
karana schedule.

This is the same sub-day-transition problem as `KP_CH4_EAR_BORING_SANDHI_001`,
and it is resolved here rather than deferred for one reason only — unlike
nakshatra-sandhi, the snapshot actually carries the input.

Tamil labels below are new strings and are pending native review, per this
repo's convention.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.data import kalaprakasika_adornment_rules as adornment
from app.data import kalaprakasika_agriculture_rules as agriculture
from app.data import kalaprakasika_harvest_rules as harvest
from app.data import kalaprakasika_learning_rules as learning
from app.data import kalaprakasika_lifecycle_rules as lifecycle
from app.data import kalaprakasika_samskara_rules as samskara
from app.data import kalaprakasika_treasure_rules as treasure


@dataclass(frozen=True, slots=True)
class StarGroup:
    """One sourced "these stars are good for this" list.

    An activity can have more than one, because a chapter sometimes does: Ch. XXI
    gives cattle a *buy-only* six-star list (p.112) and a *buy-or-sell* nine-star
    list (p.113), and they overlap on exactly one star. Merging them into a
    single set would erase which page a given day's credit came from, so each
    keeps its own `rule_id` and its own descriptor and the engine names whichever
    one matched.
    """

    rule_id: str
    stars: frozenset[int]
    # What this particular list IS, slotted into the reason sentence. Kept
    # specific ("named good for buying cattle") rather than generic ("good"),
    # because for cattle the distinction between the two lists is the doctrine.
    what_en: str
    what_ta: str
    # "BEST" earns the star bonus; "MIDDLING" scores neutral and says so.
    # Several chapters state two positive tiers and mean the gap: Ch. V p.38
    # lists nine favourable stars and then six that are "pretty good"; Ch. VIII
    # p.53 and Ch. XI p.65 both name a "neutral" set beside the fruitful one.
    # Collapsing a middling star into the best list would credit it 14 points the
    # text never gave it.
    tier: str = "BEST"


@dataclass(frozen=True, slots=True)
class ActivityRules:
    """Every sourced, *scoreable* rule for one activity.

    Rules that are sourced but not scoreable — house occupancy, named yogas,
    day-part, days-from-birth — live in the data modules with their
    provenance and are absent here on purpose. The registry is the set of things
    the engine can actually check against a daily panchangam snapshot; anything
    else appearing here would be a rule the engine pretends to evaluate.
    """

    activity: str
    label_en: str
    label_ta: str
    # Where the whole activity comes from, for the UNSOURCED-gap copy and the docs.
    chapter: str
    worksheet: str
    # Explicitly preserves the picker’s daytime-only behaviour.  Future evening
    # support must opt in per activity after an owner-approved policy decision.
    evening_policy: Literal["DAY_ONLY", "FORENOON_ONLY", "UNTIL_PRADOSHA", "EVENING_ALLOWED"] = "DAY_ONLY"

    # Other `RuleSource.source_scope` values this activity may legitimately cite,
    # because the chapter rules on a category and this activity is a member of it.
    # `RuleSource`'s own docstring calls scope load-bearing: a rule confirmed for
    # one scope must never be read as confirmed for another just because the
    # wording fits. Borrowing therefore has to be written down —
    # `muhurta_source_invariant` rejects any citation whose scope is neither this
    # activity nor a scope named here. Keep it to categories the source itself
    # groups; it is not a general escape hatch.
    inherits_scope_from: tuple[str, ...] = ()

    # ── nakshatra ────────────────────────────────────────────────────────────
    star_groups: tuple[StarGroup, ...] = ()
    prohibited_stars: frozenset[int] = frozenset()
    prohibited_stars_rule_id: str | None = None
    prohibited_stars_is_veto: bool = False
    # True when the passage closes the list — "The remaining twelve asterisms
    # should be avoided" (Ch. V p.38), "The remaining asterisms should be
    # avoided" (Ch. VI p.41, Ch. VIII p.53, Ch. XI p.65, Ch. XXIII p.115).
    # An unlisted star is then an *excluded* star and earns the heavier penalty,
    # not the mild not-listed one. Still never a veto: these sentences are
    # imperatives with no stated consequence, which this module grades PENALTY.
    stars_exhaustive: bool = False
    # Softens the claim in the reason copy when the list reaches this activity
    # by chapter scope rather than by a sentence naming it (GRAIN).
    stars_inherited_by_chapter_scope: bool = False

    # ── tithi (in-paksha day numbers 1..15) ─────────────────────────────────
    tithi_best: frozenset[int] = frozenset()
    tithi_avoid: frozenset[int] = frozenset()
    tithi_avoid_purnima: bool = False
    tithi_avoid_amavasya: bool = False
    tithi_avoid_is_veto: bool = False
    # "all Thithis except X are auspicious" — the un-excluded remainder is
    # positively good, not merely unranked.
    tithi_remainder_auspicious: bool = False
    # "Other Thithis are not to be considered" — anything off `tithi_best` is
    # prohibited rather than unlisted.
    tithi_exhaustive: bool = False
    tithi_rule_id: str | None = None

    # Karana names use PanchangamSnapshot's uppercase vocabulary. Avoidance is
    # VETO-class at the elected moment; the engine documents its date-level
    # current/next-transition approximation.
    karana_avoid: frozenset[str] = frozenset()
    karana_rule_id: str | None = None

    # ── vara (uppercase weekday, matching PanchangamSnapshot.weekday) ────────
    vara_good: frozenset[str] = frozenset()
    vara_avoid: frozenset[str] = frozenset()
    # Owner ruling: an explicitly avoided weekday is never returned as a start
    # recommendation. Set False only for a documented source conflict.
    vara_avoid_is_veto: bool = True
    vara_rule_id: str | None = None
    # A condition the passage attaches to the weekday rule that a day-level
    # snapshot cannot evaluate (Ch. XXI p.112's "the lord of the day should
    # occupy the rising sign at the moment of the transaction"). Named in the
    # reason copy so a half-met rule never reads as met.
    vara_unmet_condition_en: str | None = None
    vara_unmet_condition_ta: str | None = None

    # ── lagna sign at sunrise (1=Aries .. 12=Pisces) ─────────────────────────
    lagna_best: frozenset[int] = frozenset()
    lagna_middling: frozenset[int] = frozenset()
    lagna_avoid: frozenset[int] = frozenset()
    # Signs the text approves only on a condition the snapshot cannot check
    # (Namakarana's common signs "when occupied by a benefic"). Scored neutral
    # with the condition named — never credited as met.
    lagna_conditional: frozenset[int] = frozenset()
    lagna_conditional_en: str | None = None
    lagna_conditional_ta: str | None = None
    lagna_rule_id: str | None = None

    # ── paksha ──────────────────────────────────────────────────────────────
    # "The bright fortnight bestows longevity; the dark fortnight tells upon
    # life and fortune" (Ch. V p.37). Only set where a chapter rules on the
    # fortnight itself, which most do not.
    paksha_preferred: str | None = None            # "SHUKLA" | "KRISHNA"
    # Some chapters exempt the opening days of the disfavoured half: Ch. V p.38
    # and Ch. VII p.44 both call the first five tithis of the dark fortnight
    # beneficent. In-paksha day numbers that escape the preference.
    paksha_exempt_in_paksha: frozenset[int] = frozenset()
    paksha_rule_id: str | None = None

    # ── personal layer ──────────────────────────────────────────────────────
    # "The child should not be fed on a day ruled by its asterism at birth"
    # (Ch. III p.34). Only evaluable with a subject; absent from general mode.
    janma_nakshatra_prohibited: bool = False
    janma_nakshatra_rule_id: str | None = None

    # Counts from the subject's birth star (1 = the birth star itself) that the
    # chapter prohibits. This is the book's most-repeated personal rule and it
    # recurs almost verbatim across six chapters — see `_JANMA_TARA_NOTE`.
    janma_tara_prohibited: frozenset[int] = frozenset()
    janma_tara_rule_id: str | None = None

    # Dimensions the source covers but the engine cannot check, surfaced so a
    # UI can say what is *not* being judged rather than implying full coverage.
    unscored_dimensions: tuple[str, ...] = field(default_factory=tuple)


_SAMSKARA_WORKSHEET = "docs/sources/kalaprakasika_samskara_rules.md"
_TREASURE_WORKSHEET = "docs/sources/kalaprakasika_ch21_treasure_rules.md"
_LIFECYCLE_WORKSHEET = "docs/sources/kalaprakasika_lifecycle_rules.md"
_LEARNING_WORKSHEET = "docs/sources/kalaprakasika_learning_rules.md"
_HARVEST_WORKSHEET = "docs/sources/kalaprakasika_harvest_rules.md"
_ADORNMENT_WORKSHEET = "docs/sources/kalaprakasika_adornment_rules.md"
_AGRICULTURE_WORKSHEET = "docs/sources/kalaprakasika_agriculture_rules.md"

# The four weekday-lord amsa/hora preferences the samskara and treasure chapters
# repeat verbatim. Named once so the three activities that state it are visibly
# stating the same thing.
_BENEFIC_WEEKDAYS = frozenset({"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"})
_MALEFIC_WEEKDAYS = frozenset({"SUNDAY", "TUESDAY", "SATURDAY"})

# The book's most-repeated personal rule, and the reason `janma_tara_prohibited`
# is a shared field rather than a per-chapter one-off. Six chapters state it in
# nearly the same words, always counting from the subject's own birth star:
#
#   Ch. V   p.40  janma, 10th, 19th          (after tonsure)
#   Ch. VII p.51  janma, 5th, 7th, 10th, 19th, 22nd, 27th
#   Ch. XIV p.86  janma, 3rd, 5th, 7th, 10th, 19th          (marriage)
#   Ch. XVI p.92  janma, 10th, 19th
#   Ch. XVII p.98 3rd, 5th, 7th, 10th, 19th, 22nd, 27th     (Seemantham)
#   Ch. XX  p.106 janma, 10th, 19th                         (harvest)
#
# **The scan's ordinals decode from Ch. XVI, not from guesswork.** In Ch. V and
# Ch. VII the two middle ordinals are OCR noise — both print as "roth" — which on
# its own would be exactly the illegible-ordinal trap that left
# `ANNAPRASANA_FAVOURABLE_TARA_COUNTS` empty. Ch. XVI p.92 spells the same pair
# out in words: "the 10th asterism (Anu-Jenma), and also the 19th asterism
# (Thri-Jenma) therefrom". The named triad janma / Anu-Jenma / Thri-Jenma fixes
# both readings, and every other chapter's surviving ordinals agree with it. That
# is a decode from a parallel passage, not a reconstruction.
_JANMA_TARA_NOTE = (
    "counted from the subject's own birth star, where 1 is that star itself"
)
# janma + Anu-Jenma + Thri-Jenma — the minimal form, stated by four chapters.
_TARA_JANMA_TRIAD: frozenset[int] = frozenset({1, 10, 19})

# Karana IS scored — see the module docstring — but only across the two karanas a
# daily snapshot carries. Every activity holding a karana rule states that
# residual limit, so a day that clears the factor is never read as a cleared
# clock. This replaces the flat "karana (p.NN)" gap these activities used to
# declare while the rule was dormant.
_KARANA_TRANSITION_GAP = (
    "karana is judged only across the two karanas the daily snapshot supplies, so a "
    "further transition later in the day is not certified"
)


ACTIVITY_RULES: dict[str, ActivityRules] = {
    # ═══ Ch. III & IV — the three samskaras ═════════════════════════════════
    "NAMING_CEREMONY": ActivityRules(
        activity="NAMING_CEREMONY",
        label_en="the naming ceremony",
        label_ta="பெயர் சூட்டு விழாவிற்கு",
        chapter="III",
        worksheet=_SAMSKARA_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH3_NAMING_NAKSHATRA_001",
                samskara.NAMING_NAKSHATRA_BEST,
                "named good for the naming ceremony",
                "பெயர் சூட்டு விழாவிற்கு உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=samskara.NAMING_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=samskara.NAMING_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=samskara.NAMING_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=samskara.NAMING_TITHI_AVOID_AMAVASYA,
        # "The Thithis to be avoided are..." — a categorical imperative.
        tithi_avoid_is_veto=True,
        tithi_remainder_auspicious=True,
        tithi_rule_id="KP_CH3_NAMING_TITHI_001",
        karana_avoid=samskara.NAMING_KARANA_AVOID,
        karana_rule_id="KP_CH3_NAMING_KARANA_001",
        vara_good=samskara.NAMING_VARA_GOOD,
        vara_avoid=samskara.NAMING_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH3_NAMING_VARA_001",
        lagna_best=samskara.NAMING_LAGNA_BEST,
        lagna_conditional=samskara.NAMING_LAGNA_CONDITIONAL,
        lagna_conditional_en="approved only when a benefic occupies the sign, which is not checked here",
        lagna_conditional_ta="ஒரு சுபகிரகம் அந்த ராசியில் இருந்தால் மட்டுமே ஏற்கப்படும் — அது இங்கு சரிபார்க்கப்படவில்லை",
        lagna_rule_id="KP_CH3_NAMING_LAGNA_001",
        unscored_dimensions=(
            "8th-house vacancy (p.30)",
            _KARANA_TRANSITION_GAP,
            "forenoon-only requirement (p.31)",
            "10th/12th/16th day from the child's birth (p.30)",
            "three named yogas (p.31)",
        ),
    ),
    "MILK_FEEDING": ActivityRules(
        activity="MILK_FEEDING",
        label_en="the first feeding on milk",
        label_ta="பால் ஊட்டத் தொடங்குவதற்கு",
        chapter="III",
        worksheet=_SAMSKARA_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH3_MILK_FEEDING_NAKSHATRA_001",
                samskara.MILK_FEEDING_NAKSHATRA_BEST,
                "named best for the first feeding on milk",
                "பால் ஊட்டத் தொடங்க உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=samskara.MILK_FEEDING_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=samskara.MILK_FEEDING_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=samskara.MILK_FEEDING_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=samskara.MILK_FEEDING_TITHI_AVOID_AMAVASYA,
        # "Avoid the following Thithis" — the same categorical form Namakarana
        # states on p.30, and graded the same way.
        tithi_avoid_is_veto=True,
        tithi_rule_id="KP_CH3_MILK_FEEDING_TITHI_001",
        karana_avoid=samskara.MILK_FEEDING_KARANA_AVOID,
        karana_rule_id="KP_CH3_MILK_FEEDING_KARANA_001",
        vara_good=samskara.MILK_FEEDING_VARA_GOOD,
        vara_avoid=samskara.MILK_FEEDING_VARA_AVOID,   # empty — none named
        vara_rule_id="KP_CH3_MILK_FEEDING_VARA_001",
        # Only the three prohibited signs are scored. The nine the sentence calls
        # favourable are NOT credited, because one of them is disqualified for a
        # month at a time by the same sentence's Sun clause.
        lagna_avoid=samskara.MILK_FEEDING_LAGNA_AVOID,
        lagna_rule_id="KP_CH3_MILK_FEEDING_LAGNA_001",
        unscored_dimensions=(
            "the 31st day from the child's birth, which p.32 states first",
            "p.32 offers the 10th tara from the child's birth star as the fallback good day — "
            "a count six other chapters PROHIBIT. Recorded, deliberately not scored, and "
            "raised for the astrologer; Ch. X p.62 states the same reversal independently",
            "'the sign occupied by the Sun' is a fourth prohibited sign that moves through the "
            "year, so the nine signs the page calls favourable are not credited either",
            _KARANA_TRANSITION_GAP,
            "10th-house vacancy, and forenoon-or-noon only (p.32)",
        ),
    ),
    "ANNAPRASANA": ActivityRules(
        activity="ANNAPRASANA",
        label_en="Annaprasana (the first feeding of rice)",
        label_ta="அன்னப்பிராசனத்திற்கு",
        chapter="III",
        worksheet=_SAMSKARA_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH3_ANNAPRASANA_NAKSHATRA_001",
                samskara.ANNAPRASANA_NAKSHATRA_BEST,
                "named most favourable for Annaprasana",
                "அன்னப்பிராசனத்திற்கு மிகவும் உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        prohibited_stars=samskara.ANNAPRASANA_NAKSHATRA_PROHIBITED,
        prohibited_stars_rule_id="KP_CH3_ANNAPRASANA_NAKSHATRA_002",
        # "one should not start any function of feeding on those days" — a
        # prohibition with a stated consequence ("misery, thoughtlessness and
        # fear"). The only named forbidden-star set in the sourced doctrine.
        prohibited_stars_is_veto=True,
        stars_exhaustive=samskara.ANNAPRASANA_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=samskara.ANNAPRASANA_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=samskara.ANNAPRASANA_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=samskara.ANNAPRASANA_TITHI_AVOID_AMAVASYA,
        # "should be totally avoided for this function".
        tithi_avoid_is_veto=True,
        tithi_remainder_auspicious=True,
        tithi_rule_id="KP_CH3_ANNAPRASANA_TITHI_001",
        vara_good=samskara.ANNAPRASANA_VARA_GOOD,
        vara_avoid=samskara.ANNAPRASANA_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH3_ANNAPRASANA_VARA_001",
        lagna_best=samskara.ANNAPRASANA_LAGNA_BEST,
        lagna_rule_id="KP_CH3_ANNAPRASANA_LAGNA_001",
        janma_nakshatra_prohibited=samskara.ANNAPRASANA_JANMA_NAKSHATRA_PROHIBITED,
        janma_nakshatra_rule_id="KP_CH3_ANNAPRASANA_JANMA_NAKSHATRA_001",
        unscored_dimensions=(
            "month from the child's birth, which p.35 calls this rite's most important element",
            "10th-house vacancy and the Mars/Venus/Mercury house bans (p.34)",
            "the favourable tara counts on p.34, whose ordinals are illegible in the scan",
            "combustion is explicitly waived for this rite (p.35) and is not scored either way",
        ),
    ),
    "EAR_BORING": ActivityRules(
        activity="EAR_BORING",
        label_en="ear-boring (Karnavedha)",
        label_ta="காதுகுத்து விழாவிற்கு",
        chapter="IV",
        worksheet=_SAMSKARA_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH4_EAR_BORING_NAKSHATRA_001",
                samskara.EAR_BORING_NAKSHATRA_BEST,
                "named auspicious for ear-boring",
                "காதுகுத்து விழாவிற்கு உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=samskara.EAR_BORING_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=samskara.EAR_BORING_TITHI_BEST_IN_PAKSHA,
        # "Other Thithis are not to be considered" closes the set — the only
        # exhaustive tithi rule in the sourced doctrine.
        tithi_exhaustive=samskara.EAR_BORING_TITHI_LIST_IS_EXHAUSTIVE,
        tithi_avoid_is_veto=True,
        tithi_rule_id="KP_CH4_EAR_BORING_TITHI_001",
        vara_good=samskara.EAR_BORING_VARA_GOOD,
        vara_avoid=samskara.EAR_BORING_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH4_EAR_BORING_VARA_001",
        lagna_best=samskara.EAR_BORING_LAGNA_BEST,
        lagna_middling=samskara.EAR_BORING_LAGNA_MIDDLING,
        lagna_avoid=samskara.EAR_BORING_LAGNA_AVOID,
        lagna_rule_id="KP_CH4_EAR_BORING_LAGNA_001",
        unscored_dimensions=(
            "nakshatra-sandhi and days ruled by two stars or two tithis (pp.35-36)",
            "8th-house vacancy and the Venus/Mercury house bans (p.36)",
            "forenoon-best / afternoon-inauspicious day part (p.36)",
            "12th/16th day or 6th/7th/8th/10th month from the child's birth (p.35)",
        ),
    ),
    # ═══ Ch. XXI — To Lay Up Treasure ═══════════════════════════════════════
    "TREASURE_STORE": ActivityRules(
        activity="TREASURE_STORE",
        label_en="laying up treasure",
        label_ta="செல்வம் சேமிப்பதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH21_TREASURE_NAKSHATRA_001",
                treasure.TREASURE_NAKSHATRA_BEST,
                "named best for laying up treasure",
                "செல்வம் சேமிப்பதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=treasure.TREASURE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=treasure.TREASURE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=treasure.TREASURE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=treasure.TREASURE_TITHI_AVOID_AMAVASYA,
        # "all Thithis EXCEPT Rikthai, Full-Moon and New-Moon are auspicious" —
        # an exclusion from the auspicious set, not an imperative to avoid.
        # Graded a penalty; contrast the land rule (p.112), which says "Avoid".
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=treasure.TREASURE_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH21_TREASURE_TITHI_001",
        karana_avoid=treasure.TREASURE_KARANA_AVOID,
        karana_rule_id="KP_CH21_TREASURE_KARANA_001",
        vara_good=treasure.TREASURE_VARA_GOOD,
        vara_avoid=treasure.TREASURE_VARA_AVOID,  # empty — no adverse day is named
        vara_rule_id="KP_CH21_TREASURE_VARA_001",
        lagna_best=treasure.TREASURE_LAGNA_BEST,
        lagna_middling=treasure.TREASURE_LAGNA_MIDDLING,
        lagna_avoid=treasure.TREASURE_LAGNA_AVOID,  # empty — none stated
        lagna_rule_id="KP_CH21_TREASURE_LAGNA_001",
        unscored_dimensions=(
            _KARANA_TRANSITION_GAP,
            "8th-house vacancy (p.110)",
            "malefics in 3/6/11 and benefics in kendra or trikona (p.110)",
            "the named store-durability, servants, fragrance and library yogas (pp.110-111)",
        ),
    ),
    "GOLD": ActivityRules(
        activity="GOLD",
        # Ch. XXI rules on the treasure-house as a category and this is one of
        # its named contents, so the chapter's tithi/karana/vara/lagna rules are
        # cited here under TREASURE_STORE scope rather than re-recorded.
        inherits_scope_from=("TREASURE_STORE",),
        label_en="acquiring or storing gold and precious metals",
        label_ta="தங்கம் மற்றும் விலைமதிப்புள்ள உலோகங்களைச் சேமிப்பதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH21_GOLD_NAKSHATRA_001",
                treasure.GOLD_NAKSHATRA_BEST,
                "named best for treasuring gold and precious metals",
                "தங்கம் மற்றும் உலோகங்களைச் சேமிப்பதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=treasure.TREASURE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=treasure.TREASURE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=treasure.TREASURE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=treasure.TREASURE_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=treasure.TREASURE_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH21_TREASURE_TITHI_001",
        karana_avoid=treasure.TREASURE_KARANA_AVOID,
        karana_rule_id="KP_CH21_TREASURE_KARANA_001",
        vara_good=treasure.TREASURE_VARA_GOOD,
        vara_avoid=treasure.TREASURE_VARA_AVOID,
        vara_rule_id="KP_CH21_TREASURE_VARA_001",
        lagna_best=treasure.TREASURE_LAGNA_BEST,
        lagna_middling=treasure.TREASURE_LAGNA_MIDDLING,
        lagna_rule_id="KP_CH21_TREASURE_LAGNA_001",
        unscored_dimensions=(
            "the four named gold yogas and the two silver yogas (pp.110-111)",
            "8th-house vacancy (p.110)",
            _KARANA_TRANSITION_GAP,
            "the separate rule for PARTING WITH gold (p.112), which is a different "
            "transaction and is not folded in here",
        ),
    ),
    "GEMS": ActivityRules(
        activity="GEMS",
        # Ch. XXI rules on the treasure-house as a category and this is one of
        # its named contents, so the chapter's tithi/karana/vara/lagna rules are
        # cited here under TREASURE_STORE scope rather than re-recorded.
        inherits_scope_from=("TREASURE_STORE",),
        label_en="acquiring or storing gems and jewels",
        label_ta="ரத்தினங்கள் மற்றும் நகைகளைச் சேமிப்பதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH21_GEMS_NAKSHATRA_001",
                treasure.GEMS_NAKSHATRA_BEST,
                "named best for treasuring pearl, coral, emerald and diamond",
                "முத்து, பவளம், மரகதம், வைரம் ஆகியவற்றைச் சேமிப்பதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=treasure.TREASURE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=treasure.TREASURE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=treasure.TREASURE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=treasure.TREASURE_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=treasure.TREASURE_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH21_TREASURE_TITHI_001",
        karana_avoid=treasure.TREASURE_KARANA_AVOID,
        karana_rule_id="KP_CH21_TREASURE_KARANA_001",
        vara_good=treasure.TREASURE_VARA_GOOD,
        vara_avoid=treasure.TREASURE_VARA_AVOID,
        vara_rule_id="KP_CH21_TREASURE_VARA_001",
        lagna_best=treasure.TREASURE_LAGNA_BEST,
        lagna_middling=treasure.TREASURE_LAGNA_MIDDLING,
        lagna_rule_id="KP_CH21_TREASURE_LAGNA_001",
        unscored_dimensions=(
            "the Saturn-in-lagna gathering yoga shared with gold and grain (p.110)",
            "8th-house vacancy (p.110)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    "GRAIN": ActivityRules(
        activity="GRAIN",
        # Ch. XXI rules on the treasure-house as a category and this is one of
        # its named contents, so the chapter's tithi/karana/vara/lagna rules are
        # cited here under TREASURE_STORE scope rather than re-recorded.
        inherits_scope_from=("TREASURE_STORE",),
        label_en="storing grain",
        label_ta="தானியம் சேமிப்பதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH21_GRAIN_NAKSHATRA_001",
                treasure.GRAIN_NAKSHATRA_BEST,
                "on the chapter's best-for-treasure list, which reaches grain by chapter scope",
                "இவ்வதிகாரத்தின் செல்வச் சேமிப்புப் பட்டியலில் உள்ள (தானியத்திற்கு தனியே கூறப்படவில்லை)",
            ),
        ),
        # Weaker than gold and gems: p.111 points those two back at the chapter
        # list by name, and never does so for grain. The reason copy says so.
        stars_inherited_by_chapter_scope=True,
        stars_exhaustive=treasure.TREASURE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=treasure.TREASURE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=treasure.TREASURE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=treasure.TREASURE_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=treasure.TREASURE_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH21_TREASURE_TITHI_001",
        karana_avoid=treasure.TREASURE_KARANA_AVOID,
        karana_rule_id="KP_CH21_TREASURE_KARANA_001",
        vara_good=treasure.TREASURE_VARA_GOOD,
        vara_avoid=treasure.TREASURE_VARA_AVOID,
        vara_rule_id="KP_CH21_TREASURE_VARA_001",
        lagna_best=treasure.TREASURE_LAGNA_BEST,
        lagna_middling=treasure.TREASURE_LAGNA_MIDDLING,
        lagna_rule_id="KP_CH21_TREASURE_LAGNA_001",
        unscored_dimensions=(
            "Ch. XX (pp.105-109) carries the substantive grain doctrine and IS now extracted — "
            "as the separate HARVEST, HARVEST_INGATHERING and GRAIN_EXPENDITURE activities, "
            "which are reaping, gathering and spending rules where this one is a storing rule. "
            "This activity is deliberately still scored on Ch. XXI alone",
            "the Saturn-in-lagna gathering yoga (p.110), the only Ch. XXI sentence naming grain",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    "LAND_POSSESSION": ActivityRules(
        activity="LAND_POSSESSION",
        label_en="taking possession of land",
        label_ta="நிலத்தைக் கைவசப்படுத்துவதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH21_LAND_NAKSHATRA_001",
                treasure.LAND_POSSESSION_NAKSHATRA_BEST,
                "named best for taking possession of land",
                "நிலத்தைக் கைவசப்படுத்துவதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=treasure.LAND_POSSESSION_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=treasure.LAND_POSSESSION_TITHI_AVOID_IN_PAKSHA,
        # "Avoid Rikthai" — an imperative, unlike the chapter opening's
        # "all Thithis except Rikthai ... are auspicious".
        tithi_avoid_is_veto=True,
        tithi_remainder_auspicious=False,  # only the Rikta ban is stated here
        tithi_rule_id="KP_CH21_LAND_TITHI_001",
        karana_avoid=treasure.LAND_POSSESSION_KARANA_AVOID,
        karana_rule_id="KP_CH21_LAND_KARANA_001",
        unscored_dimensions=(
            _KARANA_TRANSITION_GAP,
            "the Sun-and-Ketu-together lagna yoga (p.112)",
            "the separate contested-title earth-taking rite: Cancer rising with the 4th pada "
            "of Bharani, Ardhra, Visakha or Hastha (p.111)",
            "no weekday or lagna-sign preference is stated for taking possession",
        ),
    ),
    "LAND_PURCHASE": ActivityRules(
        activity="LAND_PURCHASE",
        label_en="buying land",
        label_ta="நிலம் வாங்குவதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        # No star list: the 14-star list on p.112 sits under "To take possession
        # of land" and the chapter never extends it to buying. Leaving this
        # empty is the finding, not an omission — see the worksheet's scope
        # decision 2.
        vara_good=treasure.LAND_PURCHASE_VARA_GOOD,
        vara_avoid=treasure.LAND_PURCHASE_VARA_AVOID,
        vara_rule_id="KP_CH21_LAND_VARA_001",
        vara_unmet_condition_en=(
            "the text also requires that day's lord to occupy the rising sign at the moment of "
            "the transaction, which is not checked here"
        ),
        vara_unmet_condition_ta=(
            "அன்றைய கிழமையின் அதிபதி பரிவர்த்தனை நேரத்தில் லக்னத்தில் இருக்க வேண்டும் என்பதும் "
            "நூலின் நிபந்தனை — அது இங்கு சரிபார்க்கப்படவில்லை"
        ),
        unscored_dimensions=(
            "the day-lord-in-lagna condition attached to the weekday rule (p.112)",
            "Ch. XXI states NO nakshatra, tithi or lagna rule for buying land — the 14-star "
            "list on p.112 belongs to taking possession and is deliberately not promoted here",
        ),
    ),
    "CATTLE_PURCHASE": ActivityRules(
        activity="CATTLE_PURCHASE",
        label_en="buying cattle",
        label_ta="கால்நடை வாங்குவதற்கு",
        chapter="XXI",
        worksheet=_TREASURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH21_CATTLE_NAKSHATRA_001",
                treasure.CATTLE_BUY_ONLY_NAKSHATRA,
                "named good for buying cattle — and expressly not for selling",
                "கால்நடை வாங்குவதற்கு மட்டும் உகந்ததெனக் கூறப்பட்ட (விற்பதற்கு அல்ல)",
            ),
            StarGroup(
                "KP_CH21_CATTLE_NAKSHATRA_002",
                treasure.COW_BUY_OR_SELL_NAKSHATRA,
                "named proper for buying or selling cows",
                "பசு வாங்கவோ விற்கவோ உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        vara_good=treasure.CATTLE_PURCHASE_VARA_GOOD,
        vara_avoid=treasure.CATTLE_PURCHASE_VARA_AVOID,
        vara_rule_id="KP_CH21_CATTLE_VARA_001",
        vara_unmet_condition_en=(
            "the text also requires that day's lord to occupy the rising sign at the moment of "
            "the transaction, which is not checked here"
        ),
        vara_unmet_condition_ta=(
            "அன்றைய கிழமையின் அதிபதி பரிவர்த்தனை நேரத்தில் லக்னத்தில் இருக்க வேண்டும் என்பதும் "
            "நூலின் நிபந்தனை — அது இங்கு சரிபார்க்கப்படவில்லை"
        ),
        unscored_dimensions=(
            "the day-lord-in-lagna condition attached to the weekday rule (p.112)",
            "the Thursday + Pushya + Aries-rising yoga for buying sheep (p.112)",
            "Ch. XXI states no tithi or lagna-sign rule for buying cattle",
        ),
    ),
    # ═══ Ch. V, VII, XVII — the later life-stage samskaras ══════════════════
    "TONSURE": ActivityRules(
        activity="TONSURE",
        label_en="the tonsure ceremony (Choulam)",
        label_ta="மொட்டை அடிக்கும் சடங்கிற்கு (சூடாகர்மம்)",
        chapter="V",
        worksheet=_LIFECYCLE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH5_TONSURE_NAKSHATRA_001",
                lifecycle.TONSURE_NAKSHATRA_BEST,
                "named favourable for the tonsure",
                "மொட்டை அடிக்கும் சடங்கிற்கு உகந்ததெனக் கூறப்பட்ட",
            ),
            StarGroup(
                "KP_CH5_TONSURE_NAKSHATRA_001",
                lifecycle.TONSURE_NAKSHATRA_MIDDLING,
                "called only 'pretty good' for the tonsure, a tier below the favourable list",
                "மொட்டை அடிக்கும் சடங்கிற்கு ஓரளவு உகந்ததெனக் கூறப்பட்ட",
                tier="MIDDLING",
            ),
        ),
        stars_exhaustive=lifecycle.TONSURE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=lifecycle.TONSURE_TITHI_BEST_IN_PAKSHA,
        tithi_avoid=lifecycle.TONSURE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=lifecycle.TONSURE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=lifecycle.TONSURE_TITHI_AVOID_AMAVASYA,
        # "Those to be avoided are..." — an imperative without a stated
        # consequence, which this module grades a penalty, not a veto.
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH5_TONSURE_TITHI_001",
        vara_good=lifecycle.TONSURE_VARA_GOOD,
        vara_avoid=lifecycle.TONSURE_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH5_TONSURE_VARA_001",
        paksha_preferred=lifecycle.TONSURE_PAKSHA_PREFERRED,
        paksha_exempt_in_paksha=lifecycle.TONSURE_PAKSHA_EXEMPT_IN_PAKSHA,
        paksha_rule_id="KP_CH5_TONSURE_PAKSHA_001",
        lagna_best=lifecycle.TONSURE_LAGNA_BEST,
        lagna_avoid=lifecycle.TONSURE_LAGNA_AVOID,
        lagna_rule_id="KP_CH5_TONSURE_LAGNA_001",
        unscored_dimensions=(
            "the 3rd, 5th or 7th year from birth or conception (p.37)",
            "the Utharayana requirement and the per-solar-month grading (p.37)",
            "the ban while the mother is pregnant (p.37), which no chart can answer",
            "the per-star effect table for all 27 asterisms (p.38)",
            "the caste-dependent exception to the malefic weekdays (p.38)",
            "night-time is barred and the 8th house must hold nothing but Venus (p.40)",
            "Ch. V states no karana rule for the tonsure, so karana is not judged here at all",
        ),
    ),
    "UPANAYANAM": ActivityRules(
        activity="UPANAYANAM",
        label_en="Upanayanam (the thread ceremony)",
        label_ta="உபநயனத்திற்கு (பூணூல் விழா)",
        chapter="VII",
        worksheet=_LIFECYCLE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH7_UPANAYANAM_NAKSHATRA_001",
                lifecycle.UPANAYANAM_NAKSHATRA_BEST,
                "named excellent for Upanayanam",
                "உபநயனத்திற்கு மிகச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=lifecycle.UPANAYANAM_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=lifecycle.UPANAYANAM_TITHI_BEST_SHUKLA,
        tithi_avoid=lifecycle.UPANAYANAM_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=lifecycle.UPANAYANAM_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=lifecycle.UPANAYANAM_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH7_UPANAYANAM_TITHI_001",
        karana_avoid=lifecycle.UPANAYANAM_KARANA_AVOID,
        karana_rule_id="KP_CH7_UPANAYANAM_KARANA_001",
        vara_good=lifecycle.UPANAYANAM_VARA_GOOD,
        vara_avoid=lifecycle.UPANAYANAM_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH7_UPANAYANAM_VARA_001",
        paksha_preferred=lifecycle.UPANAYANAM_PAKSHA_PREFERRED,
        paksha_exempt_in_paksha=lifecycle.UPANAYANAM_PAKSHA_EXEMPT_IN_PAKSHA,
        paksha_rule_id="KP_CH7_UPANAYANAM_PAKSHA_001",
        lagna_best=lifecycle.UPANAYANAM_LAGNA_BEST,
        lagna_avoid=lifecycle.UPANAYANAM_LAGNA_AVOID,
        lagna_rule_id="KP_CH7_UPANAYANAM_LAGNA_001",
        # The widest personal ban in the sourced doctrine: 11 of 27 counts, the
        # union of two passages in one chapter. Flagged rather than narrowed —
        # both are stated and neither is said to supersede the other. It is
        # personal-layer, so it can only ever thin one subject's results.
        janma_tara_prohibited=lifecycle.UPANAYANAM_JANMA_TARA_PROHIBITED,
        janma_tara_rule_id="KP_CH7_UPANAYANAM_JANMA_TARA_001",
        unscored_dimensions=(
            "the 5th or 8th year from birth or conception, and the caste age limits (pp.42-43)",
            "the Utharayana requirement (p.44)",
            "the Veda-lord strength requirement for the boy's own family (p.44)",
            "Jupiter and Venus must not be combust (p.44)",
            "the dark-fortnight tithi list, which differs from the bright one (p.45)",
            "the five named adverse quadrant yogas Spoorjitham, Sputitham, Rudhitham, "
            "Rundhram and Ugram (pp.50-51)",
            "the nine adverse nitya yogas and the sandhi periods listed beside Vishti (p.52)",
        ),
    ),
    "SEEMANTHAM": ActivityRules(
        activity="SEEMANTHAM",
        label_en="Seemantham (the baby shower)",
        label_ta="சீமந்தத்திற்கு (வளைகாப்பு)",
        chapter="XVII",
        worksheet=_LIFECYCLE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH17_SEEMANTHAM_NAKSHATRA_001",
                lifecycle.SEEMANTHAM_NAKSHATRA_BEST,
                "named excellent for Seemantham",
                "சீமந்தத்திற்கு மிகச் சிறந்ததெனக் கூறப்பட்ட",
            ),
            StarGroup(
                "KP_CH17_SEEMANTHAM_NAKSHATRA_002",
                lifecycle.SEEMANTHAM_NAKSHATRA_FALLBACK,
                "commended for Seemantham only by some astrologers, and only when the timing "
                "is unavoidable",
                "தவிர்க்க இயலாத சூழ்நிலையில் மட்டும் சிலரால் ஏற்கப்பட்ட",
                tier="MIDDLING",
            ),
        ),
        stars_exhaustive=lifecycle.SEEMANTHAM_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=lifecycle.SEEMANTHAM_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=lifecycle.SEEMANTHAM_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=lifecycle.SEEMANTHAM_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH17_SEEMANTHAM_TITHI_001",
        vara_good=lifecycle.SEEMANTHAM_VARA_GOOD,
        vara_avoid=lifecycle.SEEMANTHAM_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH17_SEEMANTHAM_VARA_001",
        lagna_best=lifecycle.SEEMANTHAM_LAGNA_BEST,
        lagna_avoid=lifecycle.SEEMANTHAM_LAGNA_AVOID,
        lagna_rule_id="KP_CH17_SEEMANTHAM_LAGNA_001",
        janma_tara_prohibited=lifecycle.SEEMANTHAM_JANMA_TARA_PROHIBITED,
        janma_tara_rule_id="KP_CH17_SEEMANTHAM_JANMA_TARA_001",
        unscored_dimensions=(
            "the 4th, 6th or 8th month of pregnancy, and the first-conception restriction (p.97)",
            "the benefic-ruled stellar quarter the star rule prefers (p.97)",
            "the same-page dispute that commends Chathurthi, Chathurdhasi and the Full-Moon "
            "when the Moon is well dignified (p.98)",
            "8th-house vacancy, and the kendra exception that cancels it (p.98)",
            "combustion is expressly waived for this rite (p.98) and is not scored either way",
            "Athimasam is barred (p.98)",
        ),
    ),
    "LYING_IN_CHAMBER": ActivityRules(
        activity="LYING_IN_CHAMBER",
        label_en="arranging the lying-in chamber",
        label_ta="பேறுகால அறையை ஏற்பாடு செய்வதற்கு",
        chapter="XVIII",
        worksheet=_LIFECYCLE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH18_LYING_IN_NAKSHATRA_001",
                lifecycle.LYING_IN_NAKSHATRA_BEST,
                "named best for arranging the lying-in chamber",
                "பேறுகால அறையை ஏற்பாடு செய்வதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=lifecycle.LYING_IN_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=lifecycle.LYING_IN_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=lifecycle.LYING_IN_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=lifecycle.LYING_IN_TITHI_AVOID_AMAVASYA,
        # "All Thithis except X are auspicious" — an exclusion, not an imperative.
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=lifecycle.LYING_IN_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH18_LYING_IN_TITHI_001",
        karana_avoid=lifecycle.LYING_IN_KARANA_AVOID,
        karana_rule_id="KP_CH18_LYING_IN_KARANA_001",
        vara_good=lifecycle.LYING_IN_VARA_GOOD,
        vara_avoid=lifecycle.LYING_IN_VARA_AVOID,
        vara_avoid_is_veto=True,
        vara_rule_id="KP_CH18_LYING_IN_VARA_001",
        lagna_best=lifecycle.LYING_IN_LAGNA_BEST,
        lagna_middling=lifecycle.LYING_IN_LAGNA_MIDDLING,
        lagna_avoid=lifecycle.LYING_IN_LAGNA_AVOID,
        lagna_rule_id="KP_CH18_LYING_IN_LAGNA_001",
        unscored_dimensions=(
            "the rite elected is the ARRANGING of the chamber, not the birth — Ch. XVIII says "
            "it should be done 'at the approach of the month of parturition' (p.99), and that "
            "month is not something the picker can see",
            _KARANA_TRANSITION_GAP,
            "Ch. XVIII states no house rule, no day-part and no personal rule at all, which is "
            "unusual for this book and is the reason this activity's gap list is short",
        ),
    ),
    # ═══ Ch. VI, VIII, X, XI, XII — the student's arc ═══════════════════════
    "VIDYARAMBHAM": ActivityRules(
        activity="VIDYARAMBHAM",
        label_en="Vidyarambham (learning the alphabet)",
        label_ta="வித்யாரம்பத்திற்கு (எழுத்தறிவித்தலுக்கு)",
        chapter="VI",
        worksheet=_LEARNING_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH6_VIDYARAMBHAM_NAKSHATRA_001",
                learning.VIDYARAMBHAM_NAKSHATRA_BEST,
                "named favourable for beginning the alphabet",
                "எழுத்தறிவிக்கத் தொடங்க உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=learning.VIDYARAMBHAM_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=learning.VIDYARAMBHAM_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=learning.VIDYARAMBHAM_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=learning.VIDYARAMBHAM_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=learning.VIDYARAMBHAM_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH6_VIDYARAMBHAM_TITHI_001",
        karana_avoid=learning.VIDYARAMBHAM_KARANA_AVOID,
        karana_rule_id="KP_CH6_VIDYARAMBHAM_KARANA_001",
        vara_good=learning.VIDYARAMBHAM_VARA_GOOD,
        vara_avoid=learning.VIDYARAMBHAM_VARA_AVOID,
        vara_rule_id="KP_CH6_VIDYARAMBHAM_VARA_001",
        paksha_preferred=learning.VIDYARAMBHAM_PAKSHA_PREFERRED,
        paksha_exempt_in_paksha=learning.VIDYARAMBHAM_PAKSHA_EXEMPT_IN_PAKSHA,
        paksha_rule_id="KP_CH6_VIDYARAMBHAM_TITHI_001",
        lagna_best=learning.VIDYARAMBHAM_LAGNA_BEST,
        lagna_middling=learning.VIDYARAMBHAM_LAGNA_MIDDLING,
        lagna_avoid=learning.VIDYARAMBHAM_LAGNA_AVOID,
        lagna_rule_id="KP_CH6_VIDYARAMBHAM_LAGNA_001",
        unscored_dimensions=(
            "the 5th year of the child, and the requirement to precede Upanayanam (p.41)",
            "Utharayana excluding the Aquarius solar month (p.41)",
            "Sunday and Monday are called 'pretty favourable' — a middling weekday tier the "
            "engine has no rung for, so they score neutral (p.42)",
            "forenoon and noon only (p.42)",
            "8th-house vacancy, and Mercury/Jupiter/Venus in the 5th (p.42)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    "EDUCATION_START": ActivityRules(
        activity="EDUCATION_START",
        label_en="starting formal education",
        label_ta="கல்வியைத் தொடங்குவதற்கு",
        chapter="VIII",
        worksheet=_LEARNING_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH8_EDUCATION_NAKSHATRA_001",
                learning.EDUCATION_NAKSHATRA_BEST,
                "named most fruitful for commencing education",
                "கல்வியைத் தொடங்க மிகவும் பயனுள்ளதெனக் கூறப்பட்ட",
            ),
            StarGroup(
                "KP_CH8_EDUCATION_NAKSHATRA_001",
                learning.EDUCATION_NAKSHATRA_MIDDLING,
                "listed as expressly neutral for education — named, but not among the fruitful",
                "கல்விக்கு நடுநிலையானதெனக் கூறப்பட்ட",
                tier="MIDDLING",
            ),
        ),
        stars_exhaustive=learning.EDUCATION_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=learning.EDUCATION_TITHI_BEST_IN_PAKSHA,
        tithi_avoid=learning.EDUCATION_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=learning.EDUCATION_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=learning.EDUCATION_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH8_EDUCATION_TITHI_001",
        vara_good=learning.EDUCATION_VARA_GOOD,
        vara_avoid=learning.EDUCATION_VARA_AVOID,
        vara_rule_id="KP_CH8_EDUCATION_VARA_001",
        lagna_best=learning.EDUCATION_LAGNA_BEST,
        lagna_middling=learning.EDUCATION_LAGNA_MIDDLING,
        lagna_avoid=learning.EDUCATION_LAGNA_AVOID,
        lagna_rule_id="KP_CH8_EDUCATION_LAGNA_001",
        unscored_dimensions=(
            "the five per-subject star lists for grammar, logic, astrology, the Sastras and "
            "medicine/archery (p.54) — the picker asks for a day, not a subject",
            "the per-weekday effect table, which calls Monday dulling and Sunday "
            "life-prolonging where the instruction sentence names neither (pp.54-55)",
            "Prathamai is credited here without its 'dark half only' qualifier (p.54)",
            "the ten forms of Saaraswatha Yoga and four of Vidhya-Yoga (pp.55-57)",
            "forenoon and noon only; Wednesday morning is called the best moment (p.55)",
            "8th-house vacancy, and a disputed 4th-house one (p.55)",
        ),
    ),
    "VEDA_STUDY": ActivityRules(
        activity="VEDA_STUDY",
        label_en="beginning Veda study",
        label_ta="வேத அத்யயனம் தொடங்குவதற்கு",
        chapter="XI",
        worksheet=_LEARNING_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH11_VEDA_STUDY_NAKSHATRA_001",
                learning.VEDA_STUDY_NAKSHATRA_BEST,
                "named favourable for beginning the Vedas",
                "வேத அத்யயனம் தொடங்க உகந்ததெனக் கூறப்பட்ட",
            ),
            StarGroup(
                "KP_CH11_VEDA_STUDY_NAKSHATRA_001",
                learning.VEDA_STUDY_NAKSHATRA_MIDDLING,
                "listed as expressly neutral for Veda study",
                "வேத அத்யயனத்திற்கு நடுநிலையானதெனக் கூறப்பட்ட",
                tier="MIDDLING",
            ),
        ),
        stars_exhaustive=learning.VEDA_STUDY_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=learning.VEDA_STUDY_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=learning.VEDA_STUDY_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=learning.VEDA_STUDY_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=learning.VEDA_STUDY_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH11_VEDA_STUDY_TITHI_001",
        vara_good=learning.VEDA_STUDY_VARA_GOOD,
        vara_avoid=learning.VEDA_STUDY_VARA_AVOID,
        vara_rule_id="KP_CH11_VEDA_STUDY_VARA_001",
        lagna_best=learning.VEDA_STUDY_LAGNA_BEST,
        lagna_middling=learning.VEDA_STUDY_LAGNA_MIDDLING,
        lagna_avoid=learning.VEDA_STUDY_LAGNA_AVOID,
        lagna_rule_id="KP_CH11_VEDA_STUDY_LAGNA_001",
        unscored_dimensions=(
            "Sapthami and Thrayodhasi are an expressly neutral tithi tier the flat shape "
            "cannot hold, so they fall through to unnamed-neutral (p.65)",
            "Pradhosham — Chathurthi, Sapthami or Thrayodhasi running past a stated point of "
            "the night, which is 'fatal to the study of the Vedas' (p.66)",
            "the Munvadhi and Yugadhi calendar days, and the four Sankramana days (p.67)",
            "the omen rules that suspend study for three days or six months (p.66)",
            "8th-house vacancy (p.65)",
        ),
    ),
    "MANTRA_INITIATION": ActivityRules(
        activity="MANTRA_INITIATION",
        label_en="initiation in a mantra",
        label_ta="மந்திர உபதேசம் பெறுவதற்கு",
        chapter="X",
        worksheet=_LEARNING_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH10_MANTRA_NAKSHATRA_001",
                learning.MANTRA_INITIATION_NAKSHATRA_BEST,
                "named most fruitful for beginning to learn a mantra",
                "மந்திரம் கற்கத் தொடங்க மிகவும் பயனுள்ளதெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=learning.MANTRA_INITIATION_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=learning.MANTRA_INITIATION_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=learning.MANTRA_INITIATION_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=learning.MANTRA_INITIATION_TITHI_AVOID_AMAVASYA,
        # "Avoid the Thithis, — ..." with no softening clause.
        tithi_avoid_is_veto=True,
        tithi_rule_id="KP_CH10_MANTRA_TITHI_001",
        vara_good=learning.MANTRA_INITIATION_VARA_GOOD,
        vara_avoid=learning.MANTRA_INITIATION_VARA_AVOID,
        vara_rule_id="KP_CH10_MANTRA_VARA_001",
        # Movable best, common middling, fixed rejected — the INVERSE of the
        # doctrine the other three learning chapters state three times over.
        lagna_best=learning.MANTRA_INITIATION_LAGNA_BEST,
        lagna_middling=learning.MANTRA_INITIATION_LAGNA_MIDDLING,
        lagna_avoid=learning.MANTRA_INITIATION_LAGNA_AVOID,
        lagna_rule_id="KP_CH10_MANTRA_LAGNA_001",
        unscored_dimensions=(
            "p.62 calls the janma / Anu-Jenma / Thri-Jenma triad BENEFICIAL, where six other "
            "chapters prohibit it. Recorded and deliberately not scored — the engine's "
            "janma-tara field is a prohibition set — and raised for the astrologer",
            "the Sankaranthi day is called beneficial (p.62), which no other chapter says",
            "the four Pithur-Masa months in which no mantra may be commenced, and the per-month "
            "effect table (p.61)",
            "the Siddha Chakra (pp.62-64) tests the devotee's NAME against the mantra's first "
            "letter — it selects a mantra, not a moment, and is out of scope for a day-scorer",
            "8th-house vacancy (p.61)",
        ),
    ),
    "SNAANA": ActivityRules(
        activity="SNAANA",
        label_en="the Samavarthanam bath (Snaana)",
        label_ta="சமாவர்த்தன ஸ்நானத்திற்கு",
        chapter="XII",
        worksheet=_LEARNING_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH12_SNAANA_NAKSHATRA_001",
                learning.SNAANA_NAKSHATRA_BEST,
                "named good for the Samavarthanam bath",
                "சமாவர்த்தன ஸ்நானத்திற்கு உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=learning.SNAANA_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=learning.SNAANA_TITHI_BEST_IN_PAKSHA,
        tithi_avoid=learning.SNAANA_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=learning.SNAANA_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=learning.SNAANA_TITHI_AVOID_AMAVASYA,
        # "Avoid Rikthai, Prathamai, Ashtami, Full-Moon and New-Moon days" —
        # the imperative form, matching Ch. XXI p.112.
        tithi_avoid_is_veto=True,
        tithi_rule_id="KP_CH12_SNAANA_TITHI_001",
        # Sunday is among the good days here and nowhere else in this doctrine.
        vara_good=learning.SNAANA_VARA_GOOD,
        vara_avoid=learning.SNAANA_VARA_AVOID,
        vara_rule_id="KP_CH12_SNAANA_VARA_001",
        lagna_best=learning.SNAANA_LAGNA_BEST,
        lagna_conditional=learning.SNAANA_LAGNA_CONDITIONAL,
        lagna_conditional_en="approved only when a benefic occupies the sign, which is not checked here",
        lagna_conditional_ta="ஒரு சுபகிரகம் அந்த ராசியில் இருந்தால் மட்டுமே ஏற்கப்படும் — அது இங்கு சரிபார்க்கப்படவில்லை",
        lagna_rule_id="KP_CH12_SNAANA_LAGNA_001",
        unscored_dimensions=(
            "Ch. XII's other half — the Vrutham — has no tables of its own: p.68 says its "
            "timing follows the tonsure's, and cloning TONSURE's rules under a second name "
            "would present one rule set as two independent confirmations",
            "Shashti is called favourable TO KINGS (p.68); the picker does not know who the "
            "subject is, so a rank-limited permission is not granted to everyone",
            "the requirement that the bath be done just prior to the marriage (p.68)",
            "8th-house vacancy (p.68)",
        ),
    ),
    # ═══ Ch. XX — harvest, in-gathering, spending the store ═════════════════
    "HARVEST": ActivityRules(
        activity="HARVEST",
        label_en="starting the harvest",
        label_ta="அறுவடை தொடங்குவதற்கு",
        chapter="XX",
        worksheet=_HARVEST_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH20_HARVEST_NAKSHATRA_001",
                harvest.HARVEST_NAKSHATRA_BEST,
                "named most favourable for starting to reap",
                "அறுவடை தொடங்க மிகவும் உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=harvest.HARVEST_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=harvest.HARVEST_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=harvest.HARVEST_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=harvest.HARVEST_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=harvest.HARVEST_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH20_HARVEST_TITHI_001",
        karana_avoid=harvest.HARVEST_KARANA_AVOID,
        karana_rule_id="KP_CH20_HARVEST_KARANA_001",
        vara_good=harvest.HARVEST_VARA_GOOD,
        vara_avoid=harvest.HARVEST_VARA_AVOID,  # empty — no adverse day is named
        vara_rule_id="KP_CH20_HARVEST_VARA_001",
        janma_tara_prohibited=harvest.HARVEST_JANMA_TARA_PROHIBITED,
        janma_tara_rule_id="KP_CH20_HARVEST_JANMA_TARA_001",
        unscored_dimensions=(
            "'signs belonging to benefics' (p.105) — deliberately not turned into a sign list, "
            "because that needs an ownership step the sentence does not print",
            "the three stated lagna-plus-star commencement pairings (p.105)",
            "Aries and Cancer for gathering fruit, and the bar on starting after nightfall (p.106)",
            "Jupiter in the 4th, which the text says redeems any rising sign (p.106)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    "HARVEST_INGATHERING": ActivityRules(
        activity="HARVEST_INGATHERING",
        label_en="bringing the crop in",
        label_ta="விளைச்சலைச் சேர்ப்பதற்கு",
        chapter="XX",
        worksheet=_HARVEST_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH20_INGATHERING_NAKSHATRA_001",
                harvest.INGATHERING_NAKSHATRA_BEST,
                "named best for gathering the crop in",
                "விளைச்சலைச் சேர்ப்பதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=harvest.INGATHERING_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=harvest.INGATHERING_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=harvest.INGATHERING_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=harvest.INGATHERING_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=harvest.INGATHERING_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH20_INGATHERING_TITHI_001",
        karana_avoid=harvest.INGATHERING_KARANA_AVOID,
        karana_rule_id="KP_CH20_INGATHERING_KARANA_001",
        # Saturday is among the four BEST here and Wednesday is only neutral —
        # an inversion of the pattern every samskara chapter states. Preserved.
        vara_good=harvest.INGATHERING_VARA_GOOD,
        vara_avoid=harvest.INGATHERING_VARA_AVOID,
        vara_rule_id="KP_CH20_INGATHERING_VARA_001",
        lagna_best=harvest.INGATHERING_LAGNA_BEST,
        lagna_middling=harvest.INGATHERING_LAGNA_MIDDLING,
        lagna_avoid=harvest.INGATHERING_LAGNA_AVOID,
        lagna_rule_id="KP_CH20_INGATHERING_LAGNA_001",
        unscored_dimensions=(
            "the lunar months Sravana and Badhrapadha are barred outright (p.106)",
            "Wednesday is expressly neutral — a middling weekday tier the engine has no rung "
            "for, so it scores as an unnamed day would (p.106)",
            "Saturn in the 4th as a benefic for this business (p.106)",
            "the seven named yogas including Dhanya-Parvatha, Dhanya-Meru and Dhanyarnava "
            "(pp.107-108)",
            "signs occupied, about to be occupied, or just vacated by a malefic (p.107)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    "GRAIN_EXPENDITURE": ActivityRules(
        activity="GRAIN_EXPENDITURE",
        label_en="drawing down the grain store",
        label_ta="தானியத்தைச் செலவிடுவதற்கு",
        chapter="XX",
        worksheet=_HARVEST_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_001",
                harvest.GRAIN_EXPENDITURE_NAKSHATRA_BEST,
                "named best for spending down the corn store",
                "தானியத்தைச் செலவிடுவதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
            StarGroup(
                "KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_002",
                harvest.GRAIN_EXPENDITURE_NAKSHATRA_MIDDLING,
                "called middling for spending corn",
                "தானியம் செலவிடுவதற்கு நடுத்தரமானதெனக் கூறப்பட்ட",
                tier="MIDDLING",
            ),
        ),
        prohibited_stars=harvest.GRAIN_EXPENDITURE_NAKSHATRA_PROHIBITED,
        prohibited_stars_rule_id="KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_002",
        # "Under no circumstances can grain be interfered with on these days" —
        # categorical, and the only star veto outside Annaprasana's.
        prohibited_stars_is_veto=True,
        stars_exhaustive=harvest.GRAIN_EXPENDITURE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=harvest.GRAIN_EXPENDITURE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=harvest.GRAIN_EXPENDITURE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=harvest.GRAIN_EXPENDITURE_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=harvest.GRAIN_EXPENDITURE_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH20_GRAIN_EXPENDITURE_TITHI_001",
        karana_avoid=harvest.GRAIN_EXPENDITURE_KARANA_AVOID,
        karana_rule_id="KP_CH20_GRAIN_EXPENDITURE_KARANA_001",
        # Friday is AVOIDED here — the only such reading in the sourced doctrine
        # — and Saturday is good. Both preserved.
        vara_good=harvest.GRAIN_EXPENDITURE_VARA_GOOD,
        vara_avoid=harvest.GRAIN_EXPENDITURE_VARA_AVOID,
        vara_rule_id="KP_CH20_GRAIN_EXPENDITURE_VARA_001",
        lagna_best=harvest.GRAIN_EXPENDITURE_LAGNA_BEST,
        lagna_middling=harvest.GRAIN_EXPENDITURE_LAGNA_MIDDLING,
        lagna_avoid=harvest.GRAIN_EXPENDITURE_LAGNA_AVOID,
        lagna_rule_id="KP_CH20_GRAIN_EXPENDITURE_LAGNA_001",
        unscored_dimensions=(
            "four asterisms — Hastha, Visakha, Anuradha and Purvashada — are named by neither "
            "tier on p.108, whose 'remaining asterisms' parenthetical lists only two of six; "
            "they take the ordinary unlisted penalty pending a clean page image",
            "the same page commends Rikthai, which it has just banned (p.109)",
            "the same page disputes its own avoidance of Friday (p.109)",
            "8th-house vacancy, upachaya malefics and angular benefics (p.109)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    # ═══ Ch. XIX & XXII — working the land, and eating its first crop ═══════
    "AGRICULTURE_START": ActivityRules(
        activity="AGRICULTURE_START",
        label_en="first setting foot on the land for the season's work",
        label_ta="நிலத்தில் வேளாண் பணியைத் தொடங்குவதற்கு",
        chapter="XIX",
        worksheet=_AGRICULTURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH19_AGRI_START_NAKSHATRA_001",
                agriculture.AGRICULTURE_START_NAKSHATRA_BEST,
                "named best for the owner's first entry onto the land",
                "நிலத்தில் முதன்முதலில் கால் பதிக்க உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=agriculture.AGRICULTURE_START_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=agriculture.AGRICULTURE_START_TITHI_BEST_IN_PAKSHA,
        tithi_avoid=agriculture.AGRICULTURE_START_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=agriculture.AGRICULTURE_START_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=agriculture.AGRICULTURE_START_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH19_AGRI_START_TITHI_001",
        # TUESDAY IS AUSPICIOUS and Friday is absent — an inversion of the
        # Mon/Wed/Thu/Fri set almost every other chapter states. Preserved.
        vara_good=agriculture.AGRICULTURE_START_VARA_GOOD,
        vara_avoid=agriculture.AGRICULTURE_START_VARA_AVOID,   # empty — none named
        vara_rule_id="KP_CH19_AGRI_START_VARA_001",
        unscored_dimensions=(
            "Navami, Dwithiyai and Dhasami are named only to be taken OUT of a list (p.100), so "
            "they score as unnamed days rather than as favoured or avoided ones",
            "the tithi sentence never reaches Purnima and never mentions Amavasya, so neither "
            "is ranked here where most chapters ban both",
            "'Some astrologers condemn Badhrai' (p.100) is an attributed dissent that "
            "contradicts the sentence beside it — Sapthami is Badhrai and is also favoured — "
            "so it is recorded and not applied",
            "Saturday is 'recommended by some' (p.100) and is likewise recorded, not applied",
            "Ch. XIX states no lagna-sign rule for entering the land; the sign rules on pp.100 "
            "and 101 both sit under the tillage heading and are not promoted here",
        ),
    ),
    "TILLAGE": ActivityRules(
        activity="TILLAGE",
        label_en="ploughing the field",
        label_ta="நிலத்தை உழுவதற்கு",
        chapter="XIX",
        worksheet=_AGRICULTURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH19_TILLAGE_NAKSHATRA_001",
                agriculture.TILLAGE_NAKSHATRA_BEST,
                "named beneficent for ploughing",
                "நிலத்தை உழ உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=agriculture.TILLAGE_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=agriculture.TILLAGE_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=agriculture.TILLAGE_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=agriculture.TILLAGE_TITHI_AVOID_AMAVASYA,
        # Three of the six carry a stated consequence and three do not; the flag
        # is one boolean, so the weaker "all Thithis except X are good" form
        # governs and the split is declared below.
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=agriculture.TILLAGE_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH19_TILLAGE_TITHI_001",
        lagna_best=agriculture.TILLAGE_LAGNA_BEST,
        lagna_middling=agriculture.TILLAGE_LAGNA_MIDDLING,
        lagna_avoid=agriculture.TILLAGE_LAGNA_AVOID,
        lagna_rule_id="KP_CH19_TILLAGE_LAGNA_001",
        paksha_preferred=agriculture.TILLAGE_PAKSHA_PREFERRED,
        paksha_exempt_in_paksha=agriculture.TILLAGE_PAKSHA_EXEMPT_IN_PAKSHA,
        paksha_rule_id="KP_CH19_TILLAGE_PAKSHA_001",
        unscored_dimensions=(
            "the chapter contradicts itself on the rising sign — p.100's 'Taurus, Virgo and "
            "Scorpio produce good' avoids neither Scorpio nor demotes Virgo, where p.101's "
            "partition does both. The partition is scored because p.101's own per-sign gloss "
            "sides with it; the opening sentence is recorded, not deleted",
            "the star count taken from the SUN's star (pp.101-102), including which favourable "
            "counts still afflict the bullocks or the landlord — the engine counts stars only "
            "from a subject's birth star",
            "Navami, Chathurthi and Chathurdhasi are the three excluded tithis that carry a "
            "stated consequence (p.101); the other three do not, and one flag cannot say so",
            "'The days of benefic planets produce good' and the Sun-held-sign clause (p.100), "
            "which contradicts p.101's avoidance of Leo and is conditional besides",
            "the four named first-ploughing yogas (p.102), the direction to plough east or "
            "north, and the furrow count",
            "no malefic may occupy the rising sign (p.101)",
            "Ch. XIX states no weekday and no karana rule for ploughing itself",
        ),
    ),
    "SOWING": ActivityRules(
        activity="SOWING",
        label_en="sowing seed",
        label_ta="விதைப்பதற்கு",
        chapter="XIX",
        worksheet=_AGRICULTURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH19_SOWING_NAKSHATRA_001",
                agriculture.SOWING_NAKSHATRA_BEST,
                "named most fruitful for sowing",
                "விதைப்பதற்கு மிகவும் பயனுள்ளதெனக் கூறப்பட்ட",
            ),
            StarGroup(
                "KP_CH19_SOWING_NAKSHATRA_001",
                agriculture.SOWING_NAKSHATRA_MIDDLING,
                "called middling for sowing",
                "விதைப்பதற்கு நடுத்தரமானதெனக் கூறப்பட்ட",
                tier="MIDDLING",
            ),
        ),
        stars_exhaustive=agriculture.SOWING_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=agriculture.SOWING_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=agriculture.SOWING_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=agriculture.SOWING_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=agriculture.SOWING_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH19_SOWING_TITHI_001",
        # Four karanas, and Sakunam is NOT one of them — see the data module.
        karana_avoid=agriculture.SOWING_KARANA_AVOID,
        karana_rule_id="KP_CH19_SOWING_KARANA_001",
        vara_good=agriculture.SOWING_VARA_GOOD,
        vara_avoid=agriculture.SOWING_VARA_AVOID,   # empty — see the gap below
        vara_rule_id="KP_CH19_SOWING_VARA_001",
        lagna_best=agriculture.SOWING_LAGNA_BEST,
        lagna_middling=agriculture.SOWING_LAGNA_MIDDLING,
        lagna_avoid=agriculture.SOWING_LAGNA_AVOID,
        lagna_rule_id="KP_CH19_SOWING_LAGNA_001",
        unscored_dimensions=(
            "the karana list here drops SAKUNAM, which every other karana passage in this "
            "doctrine names (p.103). Encoded as printed rather than completed from neighbours",
            "Sunday, Tuesday and Saturday are 'favourable only to a particular kind of "
            "agricultural work' (p.104) — a qualified permission, so they are left out of the "
            "avoid set and score as unnamed days",
            "the per-crop star lists for roots, flowers and fruit, and the ten single-crop "
            "stellar yogas (p.103) — the picker asks for a day, not for a crop",
            "the sowing day counted from the star VENUS occupies, in bands of 3/3/12/6/3 "
            "(pp.104-105)",
            "the seeds-and-days table, which pairs each seed type with a weekday AND that day's "
            "lord rising (p.104)",
            "Leo is best here and avoided for ploughing three pages earlier — both are scored "
            "as printed and the chapter is not made self-consistent",
            "8th-house vacancy and Venus in the 7th (p.104)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    "NEW_GRAIN_MEAL": ActivityRules(
        activity="NEW_GRAIN_MEAL",
        label_en="the first meal of the new grain",
        label_ta="புதிய தானியத்தை முதன்முதலில் உண்பதற்கு",
        chapter="XXII",
        worksheet=_AGRICULTURE_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH22_NEW_GRAIN_MEAL_NAKSHATRA_001",
                agriculture.NEW_GRAIN_MEAL_NAKSHATRA_BEST,
                "named most fruitful for the first meal of the new crop",
                "புதிய விளைச்சலை முதன்முதலில் உண்ண மிகவும் பயனுள்ளதெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=agriculture.NEW_GRAIN_MEAL_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_avoid=agriculture.NEW_GRAIN_MEAL_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=agriculture.NEW_GRAIN_MEAL_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=agriculture.NEW_GRAIN_MEAL_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_remainder_auspicious=agriculture.NEW_GRAIN_MEAL_TITHI_REMAINDER_IS_AUSPICIOUS,
        tithi_rule_id="KP_CH22_NEW_GRAIN_MEAL_TITHI_001",
        # Vishti alone — the chapter names no Sthira karana.
        karana_avoid=agriculture.NEW_GRAIN_MEAL_KARANA_AVOID,
        karana_rule_id="KP_CH22_NEW_GRAIN_MEAL_KARANA_001",
        # Three days, not four: Monday is absent where the samskara chapters
        # name it beside the other three.
        vara_good=agriculture.NEW_GRAIN_MEAL_VARA_GOOD,
        vara_avoid=agriculture.NEW_GRAIN_MEAL_VARA_AVOID,   # empty — none named
        vara_rule_id="KP_CH22_NEW_GRAIN_MEAL_VARA_001",
        lagna_best=agriculture.NEW_GRAIN_MEAL_LAGNA_BEST,
        lagna_middling=agriculture.NEW_GRAIN_MEAL_LAGNA_MIDDLING,
        lagna_avoid=agriculture.NEW_GRAIN_MEAL_LAGNA_AVOID,
        lagna_rule_id="KP_CH22_NEW_GRAIN_MEAL_LAGNA_001",
        unscored_dimensions=(
            "the page reverses itself on Pisces one clause later, on an attribution to "
            "Devaratha (p.114). The chapter's own avoidance stands and the dissent is recorded",
            "the three sub-rites for the season's first flowers, fruits and leaves (pp.114-115) "
            "each require exactly one sign — and they are the three signs this activity avoids, "
            "which is why they are kept separate rather than folded in",
            "the months of Ashada, Margasira and Magha are barred outright (p.115)",
            "the 9th and 10th houses must be unoccupied, and the Moon must not hold the 8th or "
            "12th (p.115)",
            _KARANA_TRANSITION_GAP,
        ),
    ),
    # ═══ Ch. XXIII & XXIV — wearing something new ═══════════════════════════
    "NEW_CLOTHES": ActivityRules(
        activity="NEW_CLOTHES",
        label_en="wearing new clothes",
        label_ta="புத்தாடை அணிவதற்கு",
        chapter="XXIII",
        worksheet=_ADORNMENT_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH23_NEW_CLOTHES_NAKSHATRA_001",
                adornment.NEW_CLOTHES_NAKSHATRA_BEST,
                "named best for putting on new clothes",
                "புத்தாடை அணிவதற்குச் சிறந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=adornment.NEW_CLOTHES_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=adornment.NEW_CLOTHES_TITHI_BEST_IN_PAKSHA,
        tithi_avoid=adornment.NEW_CLOTHES_TITHI_AVOID_IN_PAKSHA,
        tithi_avoid_purnima=adornment.NEW_CLOTHES_TITHI_AVOID_PURNIMA,
        tithi_avoid_amavasya=adornment.NEW_CLOTHES_TITHI_AVOID_AMAVASYA,
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH23_NEW_CLOTHES_TITHI_001",
        vara_good=adornment.NEW_CLOTHES_VARA_GOOD,
        vara_avoid=adornment.NEW_CLOTHES_VARA_AVOID,
        vara_rule_id="KP_CH23_NEW_CLOTHES_VARA_001",
        lagna_best=adornment.NEW_CLOTHES_LAGNA_BEST,
        lagna_avoid=adornment.NEW_CLOTHES_LAGNA_AVOID,
        lagna_rule_id="KP_CH23_NEW_CLOTHES_LAGNA_001",
        unscored_dimensions=(
            "the per-star effect table for all 27 asterisms (pp.115-116), which is carried as "
            "display copy rather than scored twice",
            "Sunday and Monday are called middling — a weekday tier the engine has no rung "
            "for, so they score neutral (p.116)",
            "Capricorn is graded softer in the per-sign gloss than in the rule that lists it "
            "as felicitous (pp.116-117)",
        ),
    ),
    "NEW_ORNAMENT": ActivityRules(
        activity="NEW_ORNAMENT",
        label_en="wearing a new gold ornament",
        label_ta="புது தங்க நகை அணிவதற்கு",
        chapter="XXIV",
        worksheet=_ADORNMENT_WORKSHEET,
        star_groups=(
            StarGroup(
                "KP_CH24_NEW_ORNAMENT_NAKSHATRA_001",
                adornment.NEW_ORNAMENT_NAKSHATRA_BEST,
                "named fruitful for first wearing a gold jewel",
                "புது தங்க நகையை முதன்முதலில் அணிவதற்கு உகந்ததெனக் கூறப்பட்ட",
            ),
        ),
        stars_exhaustive=adornment.NEW_ORNAMENT_NAKSHATRA_LIST_IS_EXHAUSTIVE,
        tithi_best=adornment.NEW_ORNAMENT_TITHI_BEST_IN_PAKSHA,
        # "The other Thithis should be avoided" closes the set — only the second
        # exhaustive tithi rule in the sourced doctrine, after ear-boring.
        tithi_exhaustive=adornment.NEW_ORNAMENT_TITHI_LIST_IS_EXHAUSTIVE,
        tithi_avoid_is_veto=False,
        tithi_rule_id="KP_CH24_NEW_ORNAMENT_TITHI_001",
        vara_good=adornment.NEW_ORNAMENT_VARA_GOOD,
        vara_avoid=adornment.NEW_ORNAMENT_VARA_AVOID,
        vara_rule_id="KP_CH24_NEW_ORNAMENT_VARA_001",
        lagna_best=adornment.NEW_ORNAMENT_LAGNA_BEST,
        lagna_avoid=adornment.NEW_ORNAMENT_LAGNA_AVOID,  # empty — none stated
        lagna_rule_id="KP_CH24_NEW_ORNAMENT_LAGNA_001",
        unscored_dimensions=(
            "the Full Moon is BEST for this activity where six other chapters ban it — scored "
            "as printed, and flagged here because it is the doctrine's sharpest tithi reversal",
            "Siddha and Amritha nitya yogas are called good (p.117); the engine reports the "
            "day's yoga as ungraded and does not credit it for any activity",
            "the Saturday-plus-Rohini pairing that ties making the jewel to wearing it (p.118)",
            "8th-house vacancy, upachaya malefics and angular benefics (p.117)",
        ),
    ),
}


# Every activity this registry can score. `muhurta_engine` unions this with the
# activities it handles by its own branch (MARRIAGE) to decide whether a day is
# judged on doctrine or reported as UNSOURCED.
REGISTERED_ACTIVITIES: frozenset[str] = frozenset(ACTIVITY_RULES)

# The rule tables whose ids the registry can emit, for `resolve_rule_source`.
RULE_SOURCE_TABLES = (
    samskara.RULE_SOURCES,
    treasure.RULE_SOURCES,
    lifecycle.RULE_SOURCES,
    learning.RULE_SOURCES,
    harvest.RULE_SOURCES,
    adornment.RULE_SOURCES,
    agriculture.RULE_SOURCES,
)

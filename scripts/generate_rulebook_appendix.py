"""Emit the rulebook's table appendix straight from the live calculation constants.

The external-review rulebook states rules in prose ("Gana, Yoni, Graha Maitri and
Vasya use fixed classical tables"). A reviewer cannot verify a table they cannot
see, and a hand-copied table in a doc drifts from the code the day after it is
written. So this script reads the constants the engine actually evaluates and
renders them as markdown.

Run it:

    python scripts/generate_rulebook_appendix.py

`tests/test_rulebook_appendix_sync.py` regenerates into memory and fails if the
committed doc differs, so the appendix cannot silently go stale.
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from app.calculations import _yoga_helpers as YH  # noqa: E402
from app.calculations import chart_strength as CS  # noqa: E402
from app.calculations import compatibility_intelligence as CI  # noqa: E402
from app.calculations import dasha as DA  # noqa: E402
from app.calculations import festivals as FE  # noqa: E402
from app.calculations import panchangam as PA  # noqa: E402
from app.calculations import porutham as PO  # noqa: E402
from app.calculations import transits as TR  # noqa: E402
from app.calculations import yoga_rules as YR  # noqa: E402
from app.data import kuligai_polarity as KU  # noqa: E402

OUTPUT_PATH = REPO_ROOT / "docs" / "VINAADI_RULEBOOK_TABLE_APPENDIX.md"

#: Corner cell of a directional matrix. The value carries **two** backslashes on
#: purpose: Markdown reads `\\` as an escaped backslash and renders one. Held here
#: rather than written inline because a backslash inside an f-string expression is a
#: syntax error before Python 3.12, and `pyproject.toml` declares
#: `requires-python = ">=3.11"`.
FROM_TO_HEADER = "From \\\\ To"

#: Weekday index used across the panchangam module is Python's `date.weekday()`
#: (Monday == 0). Rendered in almanac order, Sunday first.
WEEKDAY_ORDER: tuple[tuple[int, str], ...] = (
    (6, "Sunday"),
    (0, "Monday"),
    (1, "Tuesday"),
    (2, "Wednesday"),
    (3, "Thursday"),
    (4, "Friday"),
    (5, "Saturday"),
)

GRAHA_ORDER: tuple[str, ...] = (
    "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU",
)

#: Gana codes as keyed in `porutham.GANA_BY_NAKSHATRA` (1-based).
GANA_NAMES = {1: "Deva", 2: "Manushya", 3: "Rakshasa"}

#: Yoni codes as keyed in `porutham.YONI_BY_NAKSHATRA` (1-based).
YONI_NAMES = {
    1: "Horse", 2: "Elephant", 3: "Sheep", 4: "Serpent", 5: "Dog", 6: "Cat",
    7: "Rat", 8: "Cow", 9: "Buffalo", 10: "Tiger", 11: "Deer", 12: "Monkey",
    13: "Lion", 14: "Mongoose",
}

#: Rajju groups as keyed in `porutham._RAJJU_GROUP` — the period-9 "tent" cycle
#: Pada, Kati, Udara, Kanta, Sira, Kanta, Udara, Kati, Pada.
RAJJU_NAMES = {
    1: "Pada (foot)", 2: "Kati (waist)", 3: "Udara (stomach)",
    4: "Kanta (neck)", 5: "Sira (head)",
}


def _nak(index0: int) -> str:
    """`index0` is 0-based; nakshatra numbers in porutham are 1-based."""
    return f"{index0 + 1}. {PA.NAKSHATRA_NAMES[index0].title()}"


def _nak1(index1: int) -> str:
    return _nak(index1 - 1)


def _rasi(index1: int) -> str:
    return f"{index1}. {PA.RASI_NAMES[index1]}"


def _bullets(lines: list[str]) -> str:
    return "\n".join(f"- {line}" for line in lines)


def _table(header: list[str], rows: list[list[str]]) -> str:
    out = ["| " + " | ".join(header) + " |", "|" + "|".join(["---"] * len(header)) + "|"]
    out.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(out)


# --------------------------------------------------------------------------- #
# PAN-12  Amirdhadhi Yogam — the full 7 x 27 grid
# --------------------------------------------------------------------------- #
def section_amirdhadhi() -> str:
    header = ["Weekday"] + [str(n + 1) for n in range(27)]
    rows = [
        [name] + list(PA.AMIRDHADHI_YOGAM_TABLE[idx])
        for idx, name in WEEKDAY_ORDER
    ]
    legend = _bullets([
        f"`{code}` — {label}" for code, label in PA.AMIRDHADHI_YOGAM_LABELS.items()
    ])
    star_key = ", ".join(f"{n + 1}={PA.NAKSHATRA_NAMES[n].title()}" for n in range(27))
    weights = _bullets([
        "Amirtha `A` = +12", "Siddha `C` = +4", "Marana `M` = -16",
        "Prabalarishta `P` = -30 — Vinaadi muhurta weights (`PAN-13`), not classical numbers.",
    ])
    return f"""## `PAN-12` Amirdhadhi Yogam — full 7 x 27 grid

189 cells, exactly as the engine evaluates them. Columns are nakshatra numbers
1-27 in the standard order.

{_table(header, rows)}

**Legend.**

{legend}

**Nakshatra column key.** {star_key}

**Scoring weights applied to these classes (`PAN-13`, product):**

{weights}
"""


# --------------------------------------------------------------------------- #
# PAN-06 / PAN-07  daylight-eighths and Gowri
# --------------------------------------------------------------------------- #
def section_daylight_slots() -> str:
    rows = [
        [name, str(PA.RAHU_SLOT[idx]), str(PA.YAMA_SLOT[idx]), str(PA.KULIGAI_SLOT[idx])]
        for idx, name in WEEKDAY_ORDER
    ]
    return f"""## `PAN-06` Rahu Kalam / Yamagandam / Kuligai daylight slots

Sunrise-to-sunset daylight is divided into **eight equal parts**; the numbers
below are which part (1-8) each kalam occupies on each weekday.

{_table(["Weekday", "Rahu Kalam", "Yamagandam", "Kuligai"], rows)}
"""


def section_gowri() -> str:
    day_rows = [[name] + list(PA.GOWRI_DAY_TABLE[idx]) for idx, name in WEEKDAY_ORDER]
    night_rows = [[name] + list(PA.GOWRI_NIGHT_TABLE[idx]) for idx, name in WEEKDAY_ORDER]
    header = ["Weekday"] + [f"Slot {i + 1}" for i in range(8)]
    good = ", ".join(sorted(PA.GOWRI_GOOD_NAMES))
    return f"""## `PAN-07` Gowri Panchangam — day and night kala sequences

Eight slots across daylight, and eight across the night. These are **not** one
rotating 8-cycle; each weekday row is listed in full for that reason.

**Day (sunrise to sunset):**

{_table(header, day_rows)}

**Night (sunset to next sunrise):**

{_table(header, night_rows)}

Kalas treated as good (Nalla Neram candidates): **{good}**. All others are
caution kalas. Vinaadi additionally suppresses a nominally good kala that
overlaps Rahu Kalam / Yamagandam.
"""


# --------------------------------------------------------------------------- #
# PAN-08  Hora
# --------------------------------------------------------------------------- #
def section_hora() -> str:
    seq = " -> ".join(PA._HORA_SEQUENCE)
    return f"""## `PAN-08` / `MUH-07` Hora — one shared equal-hour implementation

There is a **single** hora implementation in the engine; the panchangam display
and the muhurta ranker read the same one. Both rules describe it, and both are
now marked `[VARIANT]` for that reason.

- Horas per day: **{PA._HORAS_PER_DAY}**, each exactly **{int(PA._HORA_DURATION.total_seconds() // 60)} minutes**.
- Anchor: true local Hindu sunrise (`PAN-01`), not midnight and not clock 06:00.
- Lord order (descending geocentric distance, the classical hora chain):
  `{seq}`.
- The first hora of a day belongs to that weekday's lord; successive weekdays
  therefore step five places along the chain (7 horas x 24 / 7).

**Why equal hours.** The Tamil almanac hora tables print whole-hour boundaries
and rely on the 6-1-8-3 mnemonic, which only holds if every hora is exactly
sixty minutes — the cycle has to land seven clock hours later each time. The
alternative twelve-unequal-day / twelve-unequal-night planetary hour convention
is authentic and in wide use elsewhere; it is not what Vinaadi calculates.
"""


# --------------------------------------------------------------------------- #
# PAN-03 / PAN-04  tithi, yoga, karana
# --------------------------------------------------------------------------- #
def section_tithi_yoga_karana() -> str:
    movable = ", ".join(PA.MOVABLE_KARANAS)
    return f"""## `PAN-03` / `PAN-04` Tithi, Yoga and Karana — the exact formulas

All three are computed from sidereal longitudes, normalised into `[0, 360)`
before division.

**Tithi** — `floor(((moon - sun) mod 360) / 12)`, yielding 30 tithis.
Paksha is Shukla for tithi 1-15 and Krishna for 16-30.

**Yoga** — `floor(((sun + moon) mod 360) / 13.3333)`, yielding 27 yogas. Note
this is the **sum** of the two longitudes, not the difference used for tithi.

**Karana** — half-tithi steps of 6 degrees of elongation, 60 per lunar month.
The sequence is **not** a plain 60-cycle: it is one fixed opening karana, then
seven movable karanas repeating eight times, then three fixed closing karanas.
Stating it as "6-degree half-tithi" alone is not enough to reproduce it, so:

| Index | Karana |
|---|---|
| 0 | Kimstughna (fixed opening) |
| 1-56 | the seven movable karanas, repeating: {movable} |
| 57 | Shakuni (fixed) |
| 58 | Chatushpada (fixed) |
| 59 | Naga (fixed) |

Vishti (Bhadra) is the movable karana treated as inauspicious.
"""


# --------------------------------------------------------------------------- #
# PAN-09  Abhijit
# --------------------------------------------------------------------------- #
def section_abhijit() -> str:
    return """## `PAN-09` Abhijit Muhurtham — formula and exclusion policy

The rulebook previously said "exposed as a midday timing factor where
applicable", which names neither the window nor what makes it inapplicable.

- **Window:** a fixed **solar noon +/- 24 minutes**, i.e. 48 minutes centred on
  local apparent noon. Solar noon is derived from the same ephemeris transit
  calculation as sunrise, so it tracks the equation of time and longitude within
  the timezone rather than assuming clock 12:00.
- **Exclusion:** **Wednesday**. On Wednesday the day is marked
  `abhijit_restricted` and the muhurta engine awards no Abhijit credit.
- **Declared simplification.** A fixed +/-24 minutes is the common clock-table
  convention. Some traditions instead scale Abhijit to one fifteenth of the
  actual daylight span, which makes it wider in summer and narrower in winter.
  Vinaadi uses the fixed window; this is a school choice, not an oversight, and
  it is the kind of thing a reviewer should rule on.
"""


# --------------------------------------------------------------------------- #
# PAN-11  Jeevan / Nethiram
# --------------------------------------------------------------------------- #
def section_jeevan_nethiram() -> str:
    jeevan = ", ".join(f"{k} = {v}" for k, v in PA.JEEVAN_LABELS.items())
    nethiram = ", ".join(f"{k} = {v}" for k, v in PA.NETHIRAM_LABELS.items())
    return f"""## `PAN-11` Jeevan / Nethiram — cutoffs, and their scoring reach

Both are derived from a **symmetric ring distance** `d` between the Sun's
nakshatra and the day's Moon nakshatra: `d = min(|a-b| mod 27, 27 - (|a-b| mod 27))`.

**Jeevan** — `d <= 1` -> 0; `d == 9` -> 0; `d <= 8` -> 0.5; otherwise 1.
Labels: {jeevan}.

**Nethiram** — `d <= 2` -> 0; `d <= 8` -> 1; otherwise 2.
Labels: {nethiram}.

**Scoring reach: none.** Both are strings on the panchangam snapshot, rendered on
the Calendar surface with an explanatory hint. Neither feeds daily score, muhurta
ranking, porutham, or any recommendation. Grep for `jeevan` / `nethiram` returns
only the calculation, the schema field, the service passthrough, and the display
name maps.

**Open item.** A 2026-08-10 live case (Chennai) disagrees with the Nethiram
cutoff: Sun in Ayilyam (10), Moon in Thiruvathirai (7), `d = 3`, table gives "one
eye", the reviewing astrologer said "blind". A single case underdetermines the
replacement, so the cutoff has deliberately not been guess-patched. Tracked in
`docs/ASTROLOGER_REVIEW_QUEUE.md`.
"""


# --------------------------------------------------------------------------- #
# POR-02..POR-08  the porutham tables
# --------------------------------------------------------------------------- #
def section_porutham_counts() -> str:
    dinam = ", ".join(str(n) for n in sorted(PO._DINAM_GOOD_COUNTS))
    rasi_adverse = ", ".join(str(n) for n in sorted(PO._RASI_ADVERSE_COUNTS))
    return f"""## `POR-02` / `POR-03` / `POR-05` count sets and directions

Direction of counting is the part that most often differs between lineages, so
each rule states its own direction explicitly.

| Rule | Direction of count | Pass condition |
|---|---|---|
| Dinam | girl's nakshatra -> boy's, inclusive 1-27 | count in {{{dinam}}} |
| Mahendra | girl's nakshatra counted **from the boy's**, inclusive | count in {{4, 7, 10, 13, 16, 19, 22, 25}} |
| Sthree Deergham | boy's nakshatra **from the girl's**, 0-based offset | offset > 6, i.e. inclusive count >= 8 |
| Rasi | woman's Moon rasi -> man's, inclusive 1-12 | same rasi, or count 7-12; counts {{{rasi_adverse}}} fail |

**Mahendra direction note.** The reference spec counts boy-from-girl. Outcomes
are identical here only because {{4, 7, 10, 13, 16, 19, 22, 25}} happens to be
closed under `c -> 29 - c` (the two directions around a 27-star ring sum to 29).
That is an accident of this set, not a general guarantee — locked by
`test_mahendra_good_set_symmetric_under_direction_reversal`.

**Sthree Deergham threshold.** Vinaadi uses the **lenient** >= 8. Some traditions
require >= 13 (half the circle). This is a declared school choice.

**Rasi exception clauses.** `RASI_EXCEPTIONS_ENABLED = {PO.RASI_EXCEPTIONS_ENABLED}`.
{PO.RASI_EXCEPTION_GAP}
"""


def section_gana() -> str:
    rows = [
        [_nak1(n), GANA_NAMES[PO.GANA_BY_NAKSHATRA[n]]]
        for n in range(1, 28)
    ]
    return f"""## `POR-04` Gana table

{_table(["Nakshatra", "Gana"], rows)}
"""


def section_yoni() -> str:
    rows = [[_nak1(n), YONI_NAMES[PO.YONI_BY_NAKSHATRA[n]]] for n in range(1, 28)]
    hostile = sorted(
        tuple(sorted(YONI_NAMES[y] for y in pair)) for pair in PO._YONI_HOSTILE
    )
    hostile_lines = _bullets([f"{a} vs {b}" for a, b in hostile])
    return f"""## `POR-04` Yoni table and hostile pairs

{_table(["Nakshatra", "Yoni"], rows)}

**Hostile (natural-enemy) pairs — these fail; same or any other combination passes:**

{hostile_lines}
"""


def section_vasya() -> str:
    rows = [
        [_rasi(r), ", ".join(_rasi(v) for v in sorted(PO._VASYA[r])) or "(none)"]
        for r in range(1, 13)
    ]
    return f"""## `POR-04` Vasya table

Read as: a person of the left-hand rasi is drawn to (vasya of) the rasis on the
right. Vinaadi passes the kuta when the relation holds in either direction, or
when both are the same rasi.

{_table(["Rasi", "Vasya to"], rows)}

Two rows were incomplete in an earlier revision and are now carried in full:
Viruchigam -> Kadagam/Kanni, and Magaram -> Mesham/Kumbham. Simmam -> Thulaam is
retained; the conflicting Simmam -> Magaram book row is deliberately not used.
"""


def section_graha_maitri() -> str:
    lords = sorted({lord for lord in PO.SIGN_LORD.values()})
    rows = []
    for a in lords:
        cells = []
        for b in lords:
            val = PO._GRAHA_RELATION.get((a, b))
            cells.append("-" if val is None else f"{val:g}")
        rows.append([a.title()] + cells)
    sign_lord_rows = [[_rasi(r), PO.SIGN_LORD[r].title()] for r in range(1, 13)]
    return f"""## `POR-04` Rasi Adhipathi / Graha Maitri

Rasi lords used by the kuta:

{_table(["Rasi", "Lord"], sign_lord_rows)}

Directional relation scores between the seven rasi lords — row is the viewer,
column the viewed. `1` friend, `0.5` neutral, `0` enemy.

{_table([FROM_TO_HEADER] + [lord.title() for lord in lords], rows)}

The kuta fails when either direction is `0`; a one-way enmity is enough to fail.
"""


def section_rajju() -> str:
    rows = [[_nak1(n), RAJJU_NAMES[PO._RAJJU_GROUP[n]]] for n in range(1, 28)]
    return f"""## `POR-06` Rajju groups

Same Rajju group **fails**. There is no eka-nakshatra exemption: two people born
under the same nakshatra share a Rajju group by definition and therefore fail.
The eka-nakshatra / bhinna-pada exception belongs to Nadi, not to Rajju.

{_table(["Nakshatra", "Rajju group"], rows)}
"""


def section_porutham_vedha() -> str:
    pairs = sorted(tuple(sorted(p)) for p in PO._VEDHA_PAIRS)
    rows = [[_nak1(a), _nak1(b)] for a, b in pairs]
    return f"""## `POR-07` Vedha pairs

Vedha is a hard concern. {len(pairs)} mutual pairs, each blocking in both
directions:

{_table(["Nakshatra", "Vedha with"], rows)}

Mrigashira, Chitra and Dhanishta form a mutual **three-star** group, which is why
they appear in more than one row. No nakshatra is left structurally exempt — an
earlier revision wrongly treated Chitra as having no Vedha partner, and
`test_rulebook_invariants.py` now asserts all three pairings of that trio fire.

`VEDHA_TABLE_UNVERIFIED = {PO.VEDHA_TABLE_UNVERIFIED}`. {PO.VEDHA_OPEN_QUESTION}
"""


def section_nadi() -> str:
    rows = [[_nak1(n), PO._NAKSHATRA_NADI[n].title()] for n in range(1, 28)]
    cycle = " -> ".join(PO._NADI_CYCLE)
    return f"""## `POR-08` Nadi

Assigned by the repeating cycle `{cycle}` across the 27 nakshatras.

{_table(["Nakshatra", "Nadi"], rows)}

Same Nadi is a dosha. Modes: `{", ".join(PO._NADI_PARIHARA_MODES)}` — resolved by
the caller from a feature flag, never by the calculation layer. A Nadi pass or
parihara **does not** cancel Rajju.
"""


def section_moon_harmony() -> str:
    rows = [
        [str(pos), CI._MOON_HARMONY_TABLE[pos], label]
        for pos, label in (
            (1, "same rasi"), (2, "dwirdwadasa"), (3, "upachaya"), (4, "kendra"),
            (5, "trikona"), (6, "shadashtaka"), (7, "samasaptama"), (8, "shadashtaka"),
            (9, "trikona"), (10, "kendra"), (11, "upachaya"), (12, "dwirdwadasa"),
        )
    ]
    return f"""## `POR-12` Moon-Moon positional grouping and its label mapping

The **positional grouping** is classical (dwirdwadasa 2/12, shadashtaka 6/8,
trikona 5/9, samasaptama 7, kendra 4/10, upachaya 3/11). The **verdict words**
are a Vinaadi presentation layer, split out as `POR-12a [PRODUCT]`.

{_table(["Inclusive count", "Vinaadi label", "Classical grouping"], rows)}

Symmetric by construction: the table is keyed on the shorter arc, so A-to-B and
B-to-A give the same label. The label feeds the emotional-compatibility subscore
as EXCELLENT 5, GOOD 4, MIXED 2, TENSE 0 — Vinaadi weights, `POR-12a`.
"""


# --------------------------------------------------------------------------- #
# STR / DOS
# --------------------------------------------------------------------------- #
def section_friendship() -> str:
    rows = []
    for a in GRAHA_ORDER:
        cells = []
        for b in GRAHA_ORDER:
            if a == b:
                cells.append("-")
            elif b in CS._NATURAL_FRIENDS.get(a, frozenset()):
                cells.append("F")
            elif b in CS._NATURAL_ENEMIES.get(a, frozenset()):
                cells.append("E")
            else:
                cells.append("N")
        rows.append([a.title()] + cells)
    return f"""## `STR-01` / `STR-02` Natural friendship — the live directional table

Row is the viewer, column the viewed. `F` friend, `E` enemy, `N` neutral.
Directional: read across the row for what that graha thinks.

{_table([FROM_TO_HEADER] + [g.title() for g in GRAHA_ORDER], rows)}

**Why this is `[VARIANT]`, not plain Parashari.** The table includes Rahu and
Ketu as friendship participants, which strict Parashari natural-friendship
tables do not. Venus-Rahu and Venus-Ketu are mutual friends here; Moon holds
both nodes as enemies (`STR-03`).

**Known asymmetries a reviewer should rule on.**

- Moon-Mercury: Moon holds Mercury a friend, Mercury holds Moon an enemy. This is
  the genuine classical asymmetry and is intentional.
- Ketu holds Rahu an enemy; Rahu does not list Ketu at all. The nodes are always
  180 degrees apart so this never affects a conjunction, but it does reach
  relationship read-outs.
- Ketu holds Mars a friend; Mars holds Ketu neither friend nor enemy.

**`STR-02` symmetrisation is a Vinaadi algorithm, not a table.** Where one
symmetric label is required: enemy in either direction -> enemy; friend in both
directions -> friend; otherwise neutral. It is marked `[PRODUCT]` because the
underlying doctrine is the directional table above, not this reduction.
"""


def section_sevvai() -> str:
    return f"""## `DOS-01` Sevvai (Chevvai / Kuja / Manglik) dosha — the full specification

The rulebook previously said "from the relevant reference", which is not a
specification. What the engine does:

**References checked — all three, independently:** Lagna, Moon, and Venus.
Mars's whole-sign house is counted from each; a hit from any one of the three
raises the condition, and each hit is recorded by name (`from_lagna`,
`from_moon`, `from_venus`) so the read-out can say which reference fired.

**House set (identical for all three references):**
{{{", ".join(str(h) for h in sorted(YH.TAMIL_SEVVAI_HOUSES))}}} — including the
1st, per the standard Tamil set (`docs/SEVVAIRAGU.MD` section 4.1).

**Gender-weighted high-attention houses** raise severity rather than presence:

- female: {{{", ".join(str(h) for h in sorted(YH.FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES))}}}
- male: {{{", ".join(str(h) for h in sorted(YH.MALE_HIGH_ATTENTION_SEVVAI_HOUSES))}}}

**Cancellation / mitigation factors, each worth one point:** Mars in own sign;
Mars exalted; Kadagam or Simmam Lagna (Mars yogakaraka — a major cancellation);
Mars as Lagna lord in the 1st or 2nd for Mesham/Viruchigam Lagna (major); benefic
association from {{{", ".join(sorted(YH.SEVVAI_BENEFIC_REDUCERS))}}}; and the
house-sign nivarthi table below. Two uncancelled charts cancel each other
(`_apply_mutual_sevvai_cancellation`).

**Nivarthi (house-specific sign exemption):**

{_table(["Mars house", "Exempt if Mars in rasi"], [[str(h), ", ".join(_rasi(r) for r in sorted(sigs))] for h, sigs in sorted(YH.HOUSE_SIGN_NIVARTHI.items())])}

**`DOS-02` Rahu/Ketu marriage attention houses:**
{{{", ".join(str(h) for h in sorted(YH.RAHU_KETU_MARRIAGE_HOUSES))}}}.
Sarpa-related houses: {{{", ".join(str(h) for h in sorted(YH.RAHU_KETU_SARPA_HOUSES))}}}.
"""


# --------------------------------------------------------------------------- #
# YOG-*  Per-yoga rule rows — the YOG-01 split
# --------------------------------------------------------------------------- #
def _yoga_activation_cell(rule) -> str:
    """What actually activates the card this rule reaches.

    Read from the merged activation table rather than from ``rule.key_planets``,
    because two rules can share one emitted code: `YOG-RY-02` declares no key
    grahas of its own but lands on the same `RAJA_YOGA` card as `YOG-RY-01`, and
    printing "none" against it would be false.
    """
    if not rule.yoga_name:
        return "— (not detected)"
    if rule.yoga_name.endswith("_CAUTION"):
        return "n/a — not scored"
    effective = YR.activation_key_planets().get(rule.yoga_name, [])
    if not effective:
        return "**none — dormant-capped**"
    cell = ", ".join(p.title() for p in effective)
    if not rule.key_planets:
        cell += " (via the shared card)"
    return cell


def section_yoga_rules() -> str:
    codes = {rule.yoga_name for rule in YR.YOGA_RULES if rule.yoga_name}
    index = _table(
        ["Rule", "Yoga", "Emitted code", "Detector", "Markers", "Activation grahas"],
        [
            [
                f"`{rule.rule_id}`",
                rule.name_en,
                f"`{rule.yoga_name}`" if rule.yoga_name else "— (not detected)",
                f"`{rule.detector}`",
                " ".join(f"`[{marker}]`" for marker in rule.markers),
                _yoga_activation_cell(rule),
            ]
            for rule in YR.YOGA_RULES
        ],
    )

    blocks: list[str] = []
    for rule in YR.YOGA_RULES:
        heading = f"#### `{rule.rule_id}` {rule.name_en}"
        if rule.name_ta:
            heading += f" ({rule.name_ta})"
        fields = [
            ["**Emitted as**", f"`{rule.yoga_name}`" if rule.yoga_name else "nothing — this row records a non-detection"],
            ["**Detector**", f"`{rule.detector}`"],
            ["**Markers**", " ".join(f"`[{marker}]`" for marker in rule.markers)],
            ["**Present when**", rule.present_when],
            ["**Strength**", rule.strength_rule],
            ["**Cancellation**", rule.cancellation],
            ["**Source**", rule.source],
            ["**Activation grahas**", _yoga_activation_cell(rule)],
        ]
        if rule.note:
            fields.append(["**Note**", rule.note])
        blocks.append(heading + "\n\n" + _table(["", ""], fields))

    return f"""## `YOG-*` Yoga detectors — one row per definition

**This section is the `YOG-01` split.** Until 2026-08-27 every yoga in the engine
sat behind a single rulebook ID, and the reviewing astrologer declined to sign
that block: twenty independent definitions cannot take one verdict, and Raja
Yoga alone has several legitimate classical formulations. Each definition below
now carries its own ID, presence test, strength ladder, cancellation set and
marker, so each can be marked **Correct / Incorrect / Incomplete / Variant**
individually.

Generated from `app/calculations/yoga_rules.py`, which is pinned to the emitted
yoga codes by `tests/test_yoga_rules.py` — a new yoga cannot ship without a row
here, and a row here cannot describe a yoga the engine does not emit.

**{len(YR.YOGA_RULES)} rules over {len(codes)} emitted codes**, from 20 detector
functions. Rules outnumber codes because `RAJA_YOGA` merges two independent
formulations onto one card and one row records a deliberate non-detection; codes
outnumber detectors because Pancha Mahapurusha emits five, the Chandra yogas
three and Kartari three.

**Scoring reach.** Every yoga reaches the reader as a card carrying a strength
band, its `conditions_met` list and an activation score 0-100
(`yoga_activation.yoga_activation_score`), and feeds the life-area and
prediction layers through that score. The three `YOG-NKC-*` nakshatra cautions
are the exception: display-only, no strength, no activation, no scoring reach.

**Reading "Activation grahas".** These are the grahas whose maha/antar dasha
raises a present yoga above the dormant rung. **"none — dormant-capped" means
the yoga's activation score can never exceed `round(strength_base × 0.45)`**, no
matter which dasha runs. That is a live behaviour, disclosed here rather than
hidden. Where the true key grahas are lagna-dependent (Raja, Dhana, Vipareetha)
the listed set is a `[PRODUCT]` approximation and the row says so.

### Index

{index}

### The definitions

{(chr(10) * 2).join(blocks)}
"""


# --------------------------------------------------------------------------- #
# DAS / GO
# --------------------------------------------------------------------------- #
def section_dasha() -> str:
    rows = [[lord.title(), str(years)] for lord, years in DA.DASHA_YEARS.items()]
    total = sum(DA.DASHA_YEARS.values())
    return f"""## `DAS-02` Vimshottari period lengths

{_table(["Lord", "Years"], rows)}

Total: **{total} years**, asserted by `test_rulebook_invariants.py`.
"""


def section_transit_vedha() -> str:
    rows = []
    for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
        entries = TR.VEDHA_TABLE.get(planet, {})
        cells = ", ".join(f"{good} blocked by {bad}" for good, bad in sorted(entries.items()))
        rows.append([planet.title(), cells])
    exempt = sorted(" / ".join(sorted(pair)) for pair in TR._VEDHA_EXEMPT_PAIRS)
    return f"""## `GO-05` Transit Vedha table

For a graha transiting the house on the left of each pair, the benefit is
cancelled when another graha simultaneously occupies the blocking house.
Houses are whole-sign counts from Janma Rasi.

{_table(["Graha", "good house -> blocking house"], rows)}

**Classical exemptions — these pairs never block each other:** {", ".join(exempt)}.
"""


def section_sani_cycles() -> str:
    murthi_rows = []
    seen: dict[str, list[int]] = {}
    for count, meta in TR.EZHARAI_SANI_MURTHI_BY_INGRESS_COUNT.items():
        seen.setdefault(meta["grade"], []).append(count)
    for grade, counts in seen.items():
        meta = TR.EZHARAI_SANI_MURTHI_BY_INGRESS_COUNT[counts[0]]
        murthi_rows.append([
            grade.title(), ", ".join(str(c) for c in sorted(counts)),
            meta["ta"], meta["en"],
        ])
    return f"""## `GO-06` / `GO-09` / `GO-10` / `GO-11` Sani cycles

| Cycle | Reference | Saturn positions |
|---|---|---|
| Ezharai Sani / Sade Sati | Janma Rasi (natal Moon) | 12, 1, 2 |
| Ardha Ashtama Sani | Janma Rasi | 4 |
| Ashtama Sani | Janma Rasi | 8 |
| Janma Sani | Janma Rasi | 1 |
| Kandaka Sani | Janma Rasi | 4, 7, 10 |

**`GO-10` is a declared lineage choice, not a locked foundation.** Kantaka /
Kandaka Sani is variously reckoned from Lagna, from Janma Rasi, or from Arudha
Lagna depending on lineage, and the house set is variously 1/4/7/10 or 1/4/8/10
or 4/7/10. **Ruled 2026-08-19 (doctrine A-1):** Vinaadi reckons it from the
Janma Rasi over 4/7/10 — the 1st is excluded because that position is Janma
Sani's — and every surface labels it "Kandaka Sani (from Janma Rasi)" /
"கண்டக சனி (ஜென்ம ராசி)" so the reference is never implied to be universal.

Note that Kandaka therefore **overlaps by design** with the Moon-reference
cycles above: Saturn in the 4th from the Janma Rasi is Ardha Ashtama Sani *and*
Kandaka Sani, and a reader in that position is told both names. Vinaadi
previously counted Kandaka from the Lagna specifically so that no such overlap
could occur; that tidiness was an engineering preference, not a source. The
score, however, is still applied once — one placement, one penalty.

**`GO-11` Murthi at Saturn's rasi ingress**, by the transiting Moon counted from
Janma Rasi:

{_table(["Grade", "Counts", "Tamil", "English"], murthi_rows)}
"""


def section_thresholds() -> str:
    combust_rows = [
        [planet.title(), f"{orbs['direct']:g}", f"{orbs['retrograde']:g}"]
        for planet, orbs in TR.COMBUST_ORBS.items()
    ]
    gandanta = _bullets([
        f"{lo:.4f} deg to {hi:.4f} deg" for lo, hi in TR.GANDANTA_RANGES
    ])
    return f"""## `GO-03` Combustion, sandhi and gandanta thresholds

The rulebook lists these as available flags without stating the numbers. They are:

**Combustion orbs (degrees of separation from the Sun):**

{_table(["Graha", "Direct", "Retrograde"], combust_rows)}

Cazimi orb: **{TR.CAZIMI_ORB:g} deg**. The Moon is deliberately absent from this
table — `GO-04` treats Moon-near-Sun as Amavasai rather than as combustion.

**Gandanta ranges (sidereal longitude), the water-fire junctions:**

{gandanta}
"""


# --------------------------------------------------------------------------- #
# MUH
# --------------------------------------------------------------------------- #
def section_kuligai() -> str:
    fav = _bullets(sorted(KU.FAVOURABLE))
    adv = _bullets(sorted(KU.ADVERSE))
    neu = _bullets(sorted(KU.NEUTRALISED)) or "- (none)"
    return f"""## `MUH-06` Kuligai polarity by activity

Kuligai **repeats** what is begun in it. The discriminator is not "is the act
auspicious" but "does repeating it add to a stock, or does it mean the first one
came undone". Source: Jothidam p.152 (the multiplying mechanism, and the
cremation case); owner ruling 2026-08-17 for the extension to every activity.
`KULIGAI_ACTIVITY_TABLE_UNVERIFIED = {KU.KULIGAI_ACTIVITY_TABLE_UNVERIFIED}`.

**Favourable — repetition adds:**

{fav}

**Adverse — repetition means the first came undone:**

{adv}

**Neutralised:**

{neu}

An unclassified activity returns `UNSPECIFIED`, which must never be read as
rejection — blanket exclusion is the defect EC-RULING-07 corrected.

**Two deliberate divergences, recorded rather than hidden.** Kalaprakasika lists
medical treatment among Gulika's favoured acts; under the Tamil repetition rule
it cannot be, since treatment recurring means illness recurring, so MEDICAL is
adverse here. SPIRITUAL is favourable by reasoning rather than a quoted line —
worship repeated is the point of worship, and the same source has devotees
performing abhisheka during Rahu Kalam (p.81) and recommends Rahu Kalam for
Amman worship (p.257).
"""


# --------------------------------------------------------------------------- #
# PAN-17
# --------------------------------------------------------------------------- #
def section_festival_coverage() -> str:
    years = ", ".join(str(y) for y in sorted(FE.GAZETTED_FESTIVAL_YEARS))
    return f"""## `PAN-17` Festival coverage boundary

Two engines produce festival rows, and they have different reach:

1. **Algorithmic** — tithi/nakshatra/solar-month rules evaluated from the
   ephemeris (Ekadashi with dashami-viddha handling, Pradosham, Sankatahara
   Chaturthi, Amavasai/Pournami, Karthigai, Sashti, and the solar-day yearly
   festivals). These work for **any** year, past or future.
2. **Gazetted / administrative rows** — government holiday dates and a small set
   of hardcoded Hindu dates that are administrative records rather than
   calculations. These exist for **{years} only**.

`GAZETTED_FESTIVAL_YEARS` names that boundary in code, and
`test_rulebook_invariants.py` asserts the doc and the constant agree, so the
limit cannot drift silently. For a year outside the covered range the calendar
shows the algorithmic set and no gazetted rows — thinner, never wrong.

**Release position.** Government-holiday coverage must be extended before the
product presents a year beyond the boundary as complete. This is tracked as the
2027 almanac item.
"""


# --------------------------------------------------------------------------- #
def build() -> str:
    parts = [
        """# Vinaadi rulebook — table appendix

**Generated file. Do not hand-edit.** Produced by
`scripts/generate_rulebook_appendix.py` directly from the constants the live
calculation modules evaluate, and kept in sync by
`tests/test_rulebook_appendix_sync.py`.

This is the companion to
[the external-review rulebook](VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md).
The rulebook states each rule; this file shows the table that rule actually runs
on, so a reviewer never has to verify a table they cannot see. Rule IDs match
between the two documents.

Nakshatra numbering is 1-27 in the standard order (Aswini = 1). Rasi numbering is
1-12 (Mesham = 1). Weekday rows are printed Sunday-first regardless of the
internal Monday-zero index.
""",
        section_amirdhadhi(),
        section_daylight_slots(),
        section_gowri(),
        section_hora(),
        section_tithi_yoga_karana(),
        section_abhijit(),
        section_jeevan_nethiram(),
        section_porutham_counts(),
        section_gana(),
        section_yoni(),
        section_vasya(),
        section_graha_maitri(),
        section_rajju(),
        section_porutham_vedha(),
        section_nadi(),
        section_moon_harmony(),
        section_friendship(),
        section_yoga_rules(),
        section_sevvai(),
        section_dasha(),
        section_transit_vedha(),
        section_sani_cycles(),
        section_thresholds(),
        section_kuligai(),
        section_festival_coverage(),
    ]
    return "\n\n---\n\n".join(part.strip() for part in parts) + "\n"


def main() -> None:
    OUTPUT_PATH.write_text(build(), encoding="utf-8", newline="\n")
    print(f"wrote {OUTPUT_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()

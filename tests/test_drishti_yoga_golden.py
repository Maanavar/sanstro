"""Golden diff surface for the two rulings that ship *only* against fixture diffs.

The astrologer's answers of 2026-08-28 attached a rollout condition to two of
them, and to no others:

* **p.245 fractional drishti** — *"Fold into PR-A2; roll out against
  golden-fixture diffs."*
* **the benefic set** (paksha-Moon, association-Mercury) — *"ship behind fixture
  diffs."*

**That condition could not be met when it was written.** `run_golden_validation`
covers ten modules — UTC conversion, rasi and nakshatra boundaries, D9,
vargottama, dasha balance, panchangam timing, the Sani cycle, chandrashtama,
family aggregation and safety text. **Not one of them touches an aspect or a
yoga.** So the two changes with the widest blast radius in the whole ruling set
were the two with no way to see what they moved. This file is that gate.

## What it is for, and what it is not

It is **not** a correctness test. Every literal below records what the engine
does *today*, before either ruling lands — including the things the rulings are
meant to change. A failure here is not a bug report; it is the diff, and the
job is to read it and decide whether every moved cell was meant to move.

Concretely, when fractional drishti lands, `ASPECT_TARGETS_FROM_MESHAM` **must**
change — the four grahas that today aspect only the 7th will gain graded sight
of the 3rd, 4th, 5th, 8th, 9th and 10th. When the benefic-set change lands, the
yoga tables **must** move on the charts whose benefics are waning Moon or
unassociated Mercury. A run that changed nothing would mean the change did not
take.

## Regenerating

Do not hand-edit a table to make a test pass. Re-derive it, paste it, and say in
the commit message which cells moved and why the ruling accounts for them:

    py -3 tests/test_drishti_yoga_golden.py    # prints both tables as literals

## Why these three charts

Chosen so the two pending changes have somewhere to show up, not for realism:

* `spread` — one graha per sign or close to it, so aspect changes are legible
  and few yogas collide;
* `clustered` — four grahas in one rasi, which is where conjunction-driven yogas
  (Budha Aditya, Chandra Mangala, Dhana) and the benefic-set question bite;
* `nodal` — Rahu with Jupiter and Ketu with the Sun, so the node rows relabelled
  `[PRODUCT]` on 2026-08-28 and Chandala's ruled split (Guru+Rahu only, with
  Guru+Ketu becoming its own `[VARIANT]` card) both have a witness.

All three are synthetic and deliberately regular. No birth data.

## One thing the fixture already shows

`ADHI_YOGA` **was** present on all three charts before `YOG-AD-01` landed
(2026-08-28) — the evidence behind that ruling ("≥ 2 of Guru/Sukran/Budhan =
present; 3 = full; grade by planets, not houses"). Firing on one benefic made
it near-universal, and a yoga that is always present carries no information.
The rule has since landed: none of the three charts shows Adhi any more, which
is exactly the tightening the ruling asked for — see
`test_adhi_yoga_no_longer_fires_on_every_chart_here` below.

## Status: item 7's per-yoga rows, item 6, and the benefic set have all landed

The seven per-yoga changes (`YOG-AD-01`, `YOG-CH-01`/`YOG-CH-02`, `YOG-DN-01`/
`YOG-DN-02`, `YOG-VS-01`, `YOG-KD-01`, `YOG-DR-01`/`YOG-DR-02`, `YOG-LK-01`)
were **not** gated on this file by the ruling — they were independently
testable and shipped first. `GOLDEN_YOGAS` was frozen **2026-08-28, after
item 7**, and has since been regenerated again to reflect fractional drishti
(`aspect_strength()` wired into `chart_strength.py`'s Bhava Bala and
`shadbala.py`'s Drik Bala) and the benefic-set change (`effective_natural_class()`
wired into Kartari/Amala/Adhi/Vasumati in `_yoga_detect.py`, the malefic/
benefic counts in `bhava_afflictions.py`, `chart_strength.py`'s occupant/
drishti scoring, `shadbala.py`'s Drik Bala and Paksha Bala, and
`propensities.py`'s benefic/malefic house-and-aspect helpers). On these three
synthetic charts the benefic-set change happens not to move any cell — Mercury
is either unassociated or malefic-associated on all three, and in each case
the houses where that would have mattered (Amala's 10th, Adhi's 6th/7th/8th)
are occupied by a different planet or fall short of the ≥2 threshold anyway —
so this file's own "must move" expectation from its earlier draft did not
hold on *these particular* fixtures; the wiring was verified directly against
`effective_natural_class()`'s output instead (see the commit this landed in).

Yoga/dosham *presence* correctly stayed on the poorna-only `aspects_house()`
API throughout (`_yoga_detect.py`, `_yoga_dosham.py`) — that is the ruling's
"presence requires poorna drishti" clause, not an oversight. A handful of
other `aspects_house()` call sites (`dasha_activation.py`, `chart_signature.py`,
`chart_explanation_service.py`, `_chart_planets.py`, the drishti-hemming
checks inside `bhava_afflictions.py`, and `propensities.py`'s own
`aspects_house` wrapper) were deliberately left on poorna-only sight too —
the ruling names no threshold for them, and widening a display/narrative or
prediction-signal call site to fractional sight was judged not worth the
added noise without its own read. `ASPECT_TARGETS_FROM_MESHAM` reflects
exactly this: it is the poorna-only target set, which item 6 never changes by
design (`aspect_target_rasis()` intentionally still returns only full-aspect
targets — see its docstring in `aspects.py`), so it stays frozen forever, not
just until this change landed.
"""
from __future__ import annotations

import pytest

from app.calculations.aspects import aspect_target_rasis
from app.calculations.yogas import detect_yogas_and_doshams

pytestmark = pytest.mark.no_db

#: (planets by rasi, lagna rasi, moon rasi). Synthetic; see the module docstring.
CHARTS: dict[str, tuple[dict[str, int], int, int]] = {
    "spread": (
        {"SUN": 1, "MOON": 4, "MARS": 7, "MERCURY": 2, "JUPITER": 10,
         "VENUS": 5, "SATURN": 8, "RAHU": 11, "KETU": 5},
        1, 4,
    ),
    "clustered": (
        {"SUN": 3, "MOON": 3, "MARS": 3, "MERCURY": 3, "JUPITER": 9,
         "VENUS": 4, "SATURN": 6, "RAHU": 12, "KETU": 6},
        3, 3,
    ),
    "nodal": (
        {"SUN": 6, "MOON": 12, "MARS": 2, "MERCURY": 6, "JUPITER": 12,
         "VENUS": 8, "SATURN": 1, "RAHU": 12, "KETU": 6},
        10, 12,
    ),
}

#: Frozen 2026-08-28, AFTER item 7's per-yoga rulings land, BEFORE the drishti
#: and benefic-set rulings land. (yoga code, is_present, strength) sorted by code.
GOLDEN_YOGAS: dict[str, tuple[tuple[str, bool, str], ...]] = {
    "clustered": (
        ("ADHI_YOGA", False, "WEAK"),
        ("AMALA_YOGA", False, "WEAK"),
        ("BHADRA_YOGA", True, "STRONG"),
        ("BUDHA_ADITYA_YOGA", True, "STRONG"),
        ("CHANDALA_KETU_YOGA", False, "WEAK"),
        ("CHANDALA_YOGA", False, "WEAK"),
        ("CHANDRA_MANGALA_YOGA", True, "STRONG"),
        ("DARIDRA_PROXY_YOGA", False, "WEAK"),
        ("DARIDRA_YOGA", False, "WEAK"),
        ("DHANA_SUPPORTIVE_YOGA", True, "PARTIAL"),
        ("DHANA_YOGA", True, "STRONG"),
        ("GAJA_KESARI_YOGA", True, "STRONG"),
        ("HAMSA_YOGA", True, "STRONG"),
        ("KARTARI_YOGA", False, "WEAK"),
        ("KEMADRUMA_YOGA", False, "WEAK"),
        ("LAKSHMI_YOGA", False, "WEAK"),
        ("MALAVYA_YOGA", False, "WEAK"),
        ("NEECHA_BHANGA_RAJA_YOGA", False, "WEAK"),
        ("PARIVARTANA_YOGA", False, "WEAK"),
        ("RAJA_YOGA", True, "STRONG"),
        ("RUCHAKA_YOGA", False, "WEAK"),
        ("SAKATA_YOGA", False, "WEAK"),
        ("SASA_YOGA", False, "WEAK"),
        ("SUNAPHA_YOGA", True, "PARTIAL"),
        ("VASUMATI_YOGA", False, "WEAK"),
        ("VIPAREETHA_RAJA_YOGA", False, "WEAK"),
    ),
    "nodal": (
        ("ADHI_YOGA", False, "WEAK"),
        ("AMALA_YOGA", False, "WEAK"),
        ("BHADRA_YOGA", False, "WEAK"),
        ("BUDHA_ADITYA_YOGA", True, "STRONG"),
        ("CHANDALA_KETU_YOGA", False, "WEAK"),
        ("CHANDALA_YOGA", True, "STRONG"),
        ("CHANDRA_MANGALA_YOGA", False, "WEAK"),
        ("DARIDRA_PROXY_YOGA", False, "WEAK"),
        ("DARIDRA_YOGA", False, "WEAK"),
        ("DHANA_SUPPORTIVE_YOGA", True, "PARTIAL"),
        ("DHANA_YOGA", False, "WEAK"),
        ("GAJA_KESARI_YOGA", True, "STRONG"),
        ("HAMSA_YOGA", False, "WEAK"),
        ("KARTARI_YOGA", False, "WEAK"),
        ("KEMADRUMA_YOGA", False, "WEAK"),
        ("LAKSHMI_YOGA", False, "WEAK"),
        ("MALAVYA_YOGA", False, "WEAK"),
        ("NEECHA_BHANGA_RAJA_YOGA", True, "PARTIAL"),
        ("PARIVARTANA_YOGA", True, "STRONG"),
        ("RAJA_YOGA", True, "STRONG"),
        ("RUCHAKA_YOGA", False, "WEAK"),
        ("SAKATA_YOGA", False, "WEAK"),
        ("SASA_YOGA", False, "WEAK"),
        ("SUNAPHA_YOGA", True, "PARTIAL"),
        ("VASUMATI_YOGA", True, "PARTIAL"),
        ("VIPAREETHA_RAJA_YOGA", False, "WEAK"),
    ),
    "spread": (
        ("ADHI_YOGA", False, "WEAK"),
        ("AMALA_YOGA", True, "PARTIAL"),
        ("BHADRA_YOGA", False, "WEAK"),
        ("BUDHA_ADITYA_YOGA", False, "WEAK"),
        ("CHANDALA_KETU_YOGA", False, "WEAK"),
        ("CHANDALA_YOGA", False, "WEAK"),
        ("CHANDRA_MANGALA_YOGA", False, "WEAK"),
        ("DARIDRA_PROXY_YOGA", False, "WEAK"),
        ("DARIDRA_YOGA", True, "STRONG"),
        ("DHANA_SUPPORTIVE_YOGA", False, "WEAK"),
        ("DHANA_YOGA", False, "WEAK"),
        ("GAJA_KESARI_YOGA", True, "STRONG"),
        ("HAMSA_YOGA", False, "WEAK"),
        ("KARTARI_YOGA", False, "WEAK"),
        ("KEMADRUMA_YOGA", False, "WEAK"),
        ("LAKSHMI_YOGA", False, "WEAK"),
        ("MALAVYA_YOGA", False, "WEAK"),
        ("NEECHA_BHANGA_RAJA_YOGA", True, "PARTIAL"),
        ("PARIVARTANA_YOGA", False, "WEAK"),
        ("RAJA_YOGA", True, "STRONG"),
        ("RUCHAKA_YOGA", False, "WEAK"),
        ("SAKATA_YOGA", False, "WEAK"),
        ("SASA_YOGA", False, "WEAK"),
        ("SUNAPHA_YOGA", True, "PARTIAL"),
        ("VASUMATI_YOGA", False, "WEAK"),
        ("VIPAREETHA_RAJA_YOGA", False, "WEAK"),
    ),
}

#: Frozen 2026-08-28, BEFORE fractional drishti. Rasis aspected by a graha
#: standing in Mesham (rasi 1), under today's exclusive special-aspect model.
#: Mesham is an arbitrary but fixed origin — the pattern rotates with the source.
ASPECT_TARGETS_FROM_MESHAM: dict[str, tuple[int, ...]] = {
    "SUN": (7,),
    "MOON": (7,),
    "MARS": (4, 7, 8),
    "MERCURY": (7,),
    "JUPITER": (5, 7, 9),
    "VENUS": (7,),
    "SATURN": (3, 7, 10),
    "RAHU": (5, 7, 9),
    "KETU": (5, 7, 9),
}

_GRAHAS = tuple(ASPECT_TARGETS_FROM_MESHAM)


def _yoga_rows(label: str) -> tuple[tuple[str, bool, str], ...]:
    planets, lagna, moon = CHARTS[label]
    yogas, _, _ = detect_yogas_and_doshams(planets, lagna_rasi=lagna, moon_rasi=moon)
    return tuple(sorted((y.name, y.is_present, y.strength) for y in yogas))


# ── the diff surface ────────────────────────────────────────────────────────

@pytest.mark.parametrize("label", sorted(CHARTS))
def test_yoga_surface_is_unchanged(label: str) -> None:
    """Every yoga's presence and strength on three fixed charts.

    Read a failure as a diff, not a defect. The benefic-set ruling is EXPECTED
    to move cells here; what must not happen is a cell moving without anyone
    noticing which one."""
    assert _yoga_rows(label) == GOLDEN_YOGAS[label]


def test_aspect_surface_is_unchanged() -> None:
    """Which rasis each graha aspects, under today's exclusive special aspects.

    p.245 says every planet aspects the 3rd, 4th, 5th, 8th, 9th and 10th at a
    fractional strength and that Mars, Jupiter and Saturn are merely the
    STRONGEST in their fraction — not the only ones casting it. Adopting that
    must widen four of these nine rows from a bare 7th. This literal is what
    makes that widening visible instead of ambient."""
    actual = {g: tuple(sorted(aspect_target_rasis(g, 1))) for g in _GRAHAS}
    assert actual == ASPECT_TARGETS_FROM_MESHAM


# ── properties that must survive both rulings ───────────────────────────────

def test_every_graha_aspects_the_seventh_before_and_after() -> None:
    """The one aspect claim no formulation disputes: *"All planets throw a full
    aspect to the 7th house."* Whatever fractional drishti does to the other six
    houses, a graha that stops aspecting its own 7th is a bug, not a diff."""
    for graha in _GRAHAS:
        for source in range(1, 13):
            seventh = (source - 1 + 6) % 12 + 1
            assert seventh in aspect_target_rasis(graha, source), (graha, source)


def test_aspect_pattern_rotates_with_the_source_rasi() -> None:
    """Aspects are counted from wherever the graha stands, so the target set must
    be the Mesham pattern rotated — never a table keyed on absolute rasi.

    This is the invariant that catches a fractional-drishti implementation that
    hardcodes house numbers instead of counting from the source."""
    for graha, targets in ASPECT_TARGETS_FROM_MESHAM.items():
        for source in range(1, 13):
            rotated = tuple(sorted((t - 1 + source - 1) % 12 + 1 for t in targets))
            assert tuple(sorted(aspect_target_rasis(graha, source))) == rotated, (
                f"{graha} from rasi {source}"
            )


def test_adhi_yoga_no_longer_fires_on_every_chart_here() -> None:
    """`YOG-AD-01` landed 2026-08-28 (">= 2 present; 3 = full; grade by planets,
    not houses"). Before it, Adhi fired on ONE of Guru/Sukran/Budhan in the
    6th/7th/8th from Chandran — present on all three fixtures here, which was
    the live evidence the ruling cited (a yoga always present tells a reader
    nothing).

    Inverted from `test_adhi_yoga_fires_on_every_chart_here`, per that test's
    own instruction, now that the tightening has shipped: at least one chart
    here must NOT show Adhi, or the tightening did not take."""
    rows_by_label = {
        label: dict((name, present) for name, present, _ in _yoga_rows(label))
        for label in CHARTS
    }
    assert not all(rows["ADHI_YOGA"] for rows in rows_by_label.values()), (
        "Adhi Yoga still fires on every fixture chart — YOG-AD-01's tightening "
        "did not take"
    )


if __name__ == "__main__":  # pragma: no cover — regeneration helper
    print("GOLDEN_YOGAS = {")
    for _label in sorted(CHARTS):
        print(f'    "{_label}": (')
        for _row in _yoga_rows(_label):
            print(f'        ("{_row[0]}", {_row[1]}, "{_row[2]}"),')
        print("    ),")
    print("}")
    print("ASPECT_TARGETS_FROM_MESHAM = {")
    for _g in _GRAHAS:
        print(f'    "{_g}": {tuple(sorted(aspect_target_rasis(_g, 1)))},')
    print("}")

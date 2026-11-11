"""Rule-source registry (Group D rulings §9.1; docs/GROUP_D_SPECS_2026-11-11.md §0.3).

One entry per rule a reading cites. A factor carries the entry's ``id``; the
entry says where the rule comes from and how far that source was checked.

Classification:

* ``classical_rule`` - the line was fetched and read in the source
  (spec §0.1). Only these may be tagged ``classical_rule`` on the wire.
* ``vendor_practice`` - documented in a vendor's published report, not a text.
  Ships at ``engine_inference`` (owner, OWNER-Q-D2).
* ``engine_inference`` - an AI-consolidated ruling the owner chose to build
  (2026-11-11), with no printed source checked. Describes and times, never
  grades, until the astrologer ratifies it.

``gaps`` records what the check could NOT confirm, so nobody upgrades a rule
on the strength of a citation that does not say what the rule needs.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Classification = Literal["classical_rule", "vendor_practice", "engine_inference"]
Tier = Literal["classical_rule", "engine_inference"]


@dataclass(frozen=True, slots=True)
class RuleSource:
    id: str
    classification: Classification
    title: str
    #: Book or document, as cited.
    source: str
    #: Edition / translator / publisher, when known. "" = not stated by the source.
    edition: str
    #: Chapter and verse, or page.
    locator: str
    school: str
    url: str
    checked_on: str
    gaps: tuple[str, ...] = ()

    @property
    def tier(self) -> Tier:
        return "classical_rule" if self.classification == "classical_rule" else "engine_inference"


PHALADEEPIKA_11_1 = RuleSource(
    id="PHALADEEPIKA_11_1",
    classification="classical_rule",
    title="A woman's horoscope: mangalya from the 8th, children from the 9th",
    source="Phaladeepika (Mantreswara)",
    edition="",
    locator="11.1",
    school="Parashari (South Indian)",
    url="https://www.siva.sh/phaladeepika/11/1",
    checked_on="2026-11-11",
    gaps=(
        "No translator is credited on the page.",
        "The English adds '(from the Lagna or the Moon whichever is stronger)'; no Moon word was "
        "found in the Sanskrit line, so the Moon reference may be the translator's gloss. The "
        "8th-from-Moon reading is therefore cited to the rulings (engine_inference), not to this verse.",
    ),
)

#: The same verse's exception: a malefic in a house it owns gives good results.
#: The rulings document left it out; the source check found it (spec §0.1).
PHALADEEPIKA_11_1_OWN_HOUSE = RuleSource(
    id="PHALADEEPIKA_11_1_OWN_HOUSE",
    classification="classical_rule",
    title="A malefic occupying a house it owns gives good results there",
    source=PHALADEEPIKA_11_1.source,
    edition="",
    locator="11.1",
    school=PHALADEEPIKA_11_1.school,
    url=PHALADEEPIKA_11_1.url,
    checked_on="2026-11-11",
    gaps=("Read for occupation. Extending it to a malefic's aspect on its own house is the engine's "
          "bhava_afflictions convention, not this verse.",),
)

BPHS_7_42 = RuleSource(
    id="BPHS_7_42",
    classification="classical_rule",
    title="Children from the 5th from Jupiter; spouse from the 7th from Venus",
    source="Brihat Parashara Hora Shastra",
    edition="",
    locator="7.42 (chapter numbering of the cited site)",
    school="Parashari",
    url="https://enjoylearningsanskrit.com/scriptures/parashara/chapter-7/verse-42/",
    checked_on="2026-11-11",
    gaps=(
        "Other editions number BPHS chapters differently.",
        "No translator is credited.",
        "The same verse gives the 8th/12th from Saturn for longevity and loss; not used (EC-RULING-06).",
    ),
)

PROKERALA_PORUTHAM_P17 = RuleSource(
    id="PROKERALA_PORUTHAM_P17",
    classification="vendor_practice",
    title="Dasa sandhi: last and first six months of a mahadasha; overlap after marriage",
    source="Prokerala, Tamil Jathaga Porutham sample report",
    edition="vendor sample, fetched 2026-11-11",
    locator="p.17",
    school="vendor practice",
    url="https://api.prokerala.com/reports/sample/porutham-tamil-en.pdf",
    checked_on="2026-11-11",
    gaps=("The sample's own couple has a 5.8-month window gap and is rated Satisfactory, which "
          "contradicts a window-gap reading (spec §0.2).",),
)

#: The AI-consolidated Group D rulings the owner ruled to build (2026-11-11).
GROUP_D_RULINGS_2026_11_11 = RuleSource(
    id="GROUP_D_RULINGS_2026_11_11",
    classification="engine_inference",
    title="Group D consolidated rulings (author not stated; AI-drafted)",
    source="docs/GROUP_D_SPECS_2026-11-11.md §0",
    edition="",
    locator="§0.3",
    school="",
    url="",
    checked_on="2026-11-11",
    gaps=("No printed source; not practitioner sign-off.",),
)

REGISTRY: dict[str, RuleSource] = {
    r.id: r
    for r in (
        PHALADEEPIKA_11_1,
        PHALADEEPIKA_11_1_OWN_HOUSE,
        BPHS_7_42,
        PROKERALA_PORUTHAM_P17,
        GROUP_D_RULINGS_2026_11_11,
    )
}


def tier_of(rule_id: str) -> Tier:
    """The wire tier a factor citing ``rule_id`` may carry."""
    return REGISTRY[rule_id].tier

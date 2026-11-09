"""The everyday-Tamil rewrite of 2026-11-07, held in place.

Every banned phrase here was live copy until that pass, and each one parsed,
survived the bilingual-coverage tests and still read wrong to a Tamil reader.

BLIND SPOT: this proves these exact phrases stayed gone. It cannot tell whether
any sentence sounds natural; a new calque in new words passes it. That judgement
needs a Tamil reader (see docs/TAMIL_EVERYDAY_VOICE_2026-11-07.md).
"""
from __future__ import annotations

import ast
import re
from datetime import date
from pathlib import Path

import pytest

from app.calculations.dasha import DashaPeriod, VimshottariTimeline
from app.calculations.display_names import dasa_stem_ta, fix_name_case_endings, name_stem_ta
from app.services import five_minute_reading_service as five
from app.services import one_minute_reading_service as one

pytestmark = pytest.mark.no_db

REWRITTEN = (
    "app/services/one_minute_reading_service.py",
    "app/services/five_minute_reading_service.py",
    "app/services/personal_palan.py",
    "app/services/nakshatra_content.py",
    "app/services/emotional_weather.py",
    "app/calculations/planet_conditions.py",
    "app/services/email_service.py",
    "app/services/daily_guidance_service.py",
)

# phrase -> what it wrongly says, so a failure explains itself.
BANNED = {
    "மீது நடக்கிறது": "the 'runs on' calque the 2026-08-12 pass ruled out",
    "விலை என்பது": "'where it costs you' as a price",
    "கோணல்": "'crooked', written for an angular (kendra) Saturn",
    "கட்டுப்பாடுகளை தவிர்": "'avoid restrictions', written for 'avoid commitments'",
    "நமனீய": "not a Tamil word",
    "கடக்கமான": "not a Tamil word",
    "அடக்கமின்மை": "'immodesty', written for 'stubbornness'",
    "அதிகமாக செலவழிக்கும்": "'overspending', written for 'over-giving'",
    "மனோநிலை": "the rest of the product says மனநிலை",
    "உராய்வு": "'friction' as physics",
    "உள் வேலை": "'inner work' word for word",
}


def _executable_strings(path: str) -> list[str]:
    """String constants that are not docstrings, so comments can name old defects."""
    tree = ast.parse(Path(path).read_text(encoding="utf-8"))
    docstrings = {
        id(node.body[0].value)
        for node in ast.walk(tree)
        if isinstance(node, ast.Module | ast.ClassDef | ast.FunctionDef | ast.AsyncFunctionDef)
        and node.body
        and isinstance(node.body[0], ast.Expr)
        and isinstance(node.body[0].value, ast.Constant)
    }
    return [
        node.value
        for node in ast.walk(tree)
        if isinstance(node, ast.Constant) and isinstance(node.value, str) and id(node) not in docstrings
    ]


@pytest.mark.parametrize("path", REWRITTEN)
def test_no_ruled_out_phrase_returns(path: str) -> None:
    found = [
        f"{phrase} ({why}): {text[:60]}"
        for text in _executable_strings(path)
        for phrase, why in BANNED.items()
        if phrase in text
    ]
    assert not found, found


@pytest.mark.parametrize("facet", ["nature", "gift", "shadow", "mechanism", "past_texture", "now_texture", "asks"])
def test_voice_facets_use_no_borrowed_em_dash(facet: str) -> None:
    """The 2026-09-17 ruling. `action` is exempt: its wording passed the owner's review."""
    for table in (one._VOICE, one._VOICE_THEM):
        for lord, voice in table.items():
            value = getattr(voice, facet)
            ta = value.ta if facet == "nature" else value[0]
            assert " — " not in ta, f"{lord}.{facet}: {ta}"


def test_a_family_members_reading_never_addresses_the_reader() -> None:
    """Row 62 and row 161 once shared a string, so a self line could land in both."""
    second_person = ("நீங்கள்", "உங்கள்", "உங்களுக்கு", "உங்களை")
    for lord, voice in one._VOICE_THEM.items():
        for facet in ("gift", "shadow", "mechanism", "past_texture", "now_texture", "asks", "action"):
            ta = getattr(voice, facet)[0]
            assert not any(word in ta for word in second_person), f"{lord}.{facet}: {ta}"
        for key, pair in voice.domain_flex.items():
            assert not any(word in pair[0] for word in second_person), f"{lord}.{key}: {pair[0]}"
    for table in (five._LAGNA_FACE_THEM, five._TOPIC_LENS_THEM):
        for key, pair in table.items():
            if key == "MARRIED_LIFE":
                continue
            assert not any(word in pair[0] for word in second_person), f"{key}: {pair[0]}"


# ── Dasa names: ராகு காலம் is the daily hour ─────────────────────────────────


def _period(lord: str, start: date, end: date, index: int) -> DashaPeriod:
    return DashaPeriod(
        level="maha", lord=lord, start_jd=0.0, end_jd=0.0,
        start_date=start, end_date=end, sequence_index=index,
    )


def _mars_then_rahu() -> VimshottariTimeline:
    mahas = (
        _period("MARS", date(2021, 5, 1), date(2028, 5, 1), 0),
        _period("RAHU", date(2028, 5, 1), date(2046, 5, 1), 1),
    )
    return VimshottariTimeline(
        opening_lord="MARS", balance_years_at_birth=7.0, opening_end_jd=0.0, mahadashas=mahas,
        current_mahadasha=mahas[0], current_antardasha=mahas[0], current_pratyantardasha=mahas[0],
        current_sookshmadasha=mahas[0], current_pranadasha=mahas[0],
    )


def test_a_rahu_dasa_is_never_called_rahu_kalam() -> None:
    """"ராகு காலம் தொடங்கும்" told a parent the daily inauspicious hour was starting.

    Astrologer ruling 2026-10-21 §10 said write ராகு தசை; the readings went on
    writing `{planet} காலம்` until the 2026-11-09 sign-off sheet put it in front
    of the owner. Checked on the two forward beats that name the NEXT lord,
    because that is where Rahu turns up after Mars.

    BLIND SPOT: these two beats only. The source scan below covers the f-strings;
    neither sees a dasa named in a table row written out by hand.
    """
    tl = _mars_then_rahu()
    as_of = date(2026, 11, 9)
    texts = [
        one._beat_years_ahead_for_a_child(timeline=tl, as_of=as_of, display_name="Kavitha").text.ta,
        one._beat_next_ten_years(timeline=tl, as_of=as_of, addressed_to="self").text.ta,
    ]
    for ta in texts:
        assert "ராகு தசை" in ta, ta
        assert "ராகு காலம்" not in ta, ta


@pytest.mark.parametrize("graha,stem", [("VENUS", "சுக்கிர"), ("SUN", "சூரிய"), ("MOON", "சந்திர"), ("RAHU", "ராகு")])
def test_dasa_names_take_the_almanac_stem(graha: str, stem: str) -> None:
    assert dasa_stem_ta(graha) == stem


_PLANET_THEN_KALAM = re.compile(r"\{(?:planet_ta|dasa_stem_ta)\([^)]*\)\}\s*\"?\s*f?\"?கால")


@pytest.mark.parametrize(
    "path",
    [
        "app/services/one_minute_reading_service.py",
        "app/services/five_minute_reading_service.py",
        "app/services/dasha_transition_service.py",
    ],
)
def test_no_reading_writes_a_planet_followed_by_kalam(path: str) -> None:
    src = Path(path).read_text(encoding="utf-8")
    assert not _PLANET_THEN_KALAM.findall(src), path
    assert "{next_lord} காலம்" not in src, path
    assert "{planet} காலம்" not in src, path


# ── Grammar the 2026-11-09 review caught on rendered readings ────────────────


@pytest.mark.parametrize(
    "name,stem",
    [("மூலம்", "மூல"), ("அனுஷம்", "அனுஷ"), ("ரிஷபம்", "ரிஷப"), ("துலாம்", "துலா"), ("ரோகிணி", "ரோகிணி"), ("கன்னி", "கன்னி")],
)
def test_a_star_or_sign_takes_its_joined_form(name: str, stem: str) -> None:
    """"அவர் மூலம் நட்சத்திரத்தில்" reads as two nouns; Tamil says மூல நட்சத்திரம்."""
    assert name_stem_ta(name) == stem


@pytest.mark.parametrize(
    "name,expected",
    [
        ("Divya", "Divya-வின் பலம்; Divya-வைத் தேடி"),
        ("Lakshmi", "Lakshmi-யின் பலம்; Lakshmi-யைத் தேடி"),
        ("Arun", "Arun-இன் பலம்; Arun-ஐத் தேடி"),
    ],
)
def test_a_name_takes_the_case_ending_its_last_sound_needs(name: str, expected: str) -> None:
    """"Divya-இன்" was in every family reading; Tamil says திவ்யாவின்.

    BLIND SPOT: Latin and Tamil final letters only. A name ending in a silent
    letter ("Ganesh") is read as a consonant, which is right; a name the user
    typed in another script gets the template's ending unchanged.
    """
    assert fix_name_case_endings(f"{name}-இன் பலம்; {name}-ஐத் தேடி", name) == expected


def test_no_reading_source_spells_janma_or_anusam_the_old_way() -> None:
    """Owner, 2026-11-09: one spelling each, ஜென்ம and அனுஷம்."""
    for path in REWRITTEN + ("app/calculations/display_names.py", "app/services/narrative_engine.py"):
        src = Path(path).read_text(encoding="utf-8")
        assert "ஜன்ம" not in src, path
        assert "அனுசம்" not in src, path

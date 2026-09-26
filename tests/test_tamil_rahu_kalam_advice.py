"""Tamil Rahu Kalam advice: one advisory sentence, almanac period-words.

Owner ruling 2026-09-17 (native review): a Tamil time carries a period-word
before the number (மதியம் 1:30), never "pm"; a panchangam counsels
(தவிர்ப்பது நல்லது), it does not command (தவிர்க்கவும்); and two surfaces
giving the same advice use one string.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.services import narrative_engine
from app.services.narrative_engine import format_clock_label, rahu_kalam_advice
from app.services.notification_service import build_morning_notification
from app.services.panchangam_card_service import _daily_guidance_line

pytestmark = pytest.mark.no_db

_LATIN_PERIOD = ("am", "pm", "AM", "PM")


def _assert_tamil_register(text: str) -> None:
    assert "தவிர்க்கவும்" not in text, text
    for token in _LATIN_PERIOD:
        assert f" {token}" not in text, text


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("04:59", "இரவு 4:59"),
        ("05:00", "காலை 5:00"),
        ("11:59", "காலை 11:59"),
        ("12:00", "மதியம் 12:00"),
        ("15:59", "மதியம் 3:59"),
        ("16:00", "மாலை 4:00"),
        ("18:59", "மாலை 6:59"),
        ("19:00", "இரவு 7:00"),
        ("00:05", "இரவு 12:05"),
    ],
)
def test_tamil_clock_buckets_match_the_web_formatter(value: str, expected: str) -> None:
    # Same edges as web/lib/format.test.ts.
    assert format_clock_label(value, "ta") == expected


def test_english_clock_label_is_unchanged() -> None:
    assert format_clock_label("13:30") == "1:30 pm"


def test_rahu_advice_is_the_web_catalog_sentence() -> None:
    advice = rahu_kalam_advice("13:42", "15:18")
    assert advice.ta == "ராகு காலம் மதியம் 1:42 – மதியம் 3:18 நேரத்தில் புதிய செயல்களைத் தவிர்ப்பது நல்லது."
    # Guard against the two copies drifting: the web catalog must still carry
    # the same Tamil template.
    catalog = (Path(__file__).resolve().parents[1] / "web" / "lib" / "dashboard-i18n.ts").read_text(encoding="utf-8")
    assert "`ராகு காலம் ${rangeTa} நேரத்தில் புதிய செயல்களைத் தவிர்ப்பது நல்லது.`" in catalog


@pytest.mark.parametrize(
    ("chandrashtama", "sani_type", "sani_active"),
    [
        (False, None, False),
        (True, None, False),
        (False, "ASHTAMA_SANI", True),
        (False, "EZHARAI_SANI_PHASE_1", True),
    ],
)
def test_caution_suggestion_speaks_in_one_advisory_register(
    chandrashtama: bool, sani_type: str | None, sani_active: bool
) -> None:
    text = narrative_engine.caution_suggestion(chandrashtama, sani_type, sani_active, "13:30", "15:00")
    _assert_tamil_register(text.ta)
    assert rahu_kalam_advice("13:30", "15:00").ta in text.ta
    assert rahu_kalam_advice("13:30", "15:00").en in text.en
    assert ".." not in text.ta and ".." not in text.en


def test_morning_notification_tamil_has_period_words_and_shared_rahu_line() -> None:
    payload = build_morning_notification(
        score_label="GOOD",
        nalla_neram_start="06:10",
        nalla_neram_end="07:40",
        rahu_start="13:30",
        rahu_end="15:00",
        nakshatra_name_ta="அஸ்வினி",
        nakshatra_name_en="Aswini",
    )
    _assert_tamil_register(payload["title"]["ta"])
    _assert_tamil_register(payload["body"]["ta"])
    assert "காலை 6:10 – காலை 7:40" in payload["title"]["ta"]
    assert payload["body"]["ta"].endswith(rahu_kalam_advice("13:30", "15:00").ta)
    assert "6:10 am-7:40 am" in payload["title"]["en"]
    assert payload["body"]["en"].endswith("Avoid Rahu Kalam, 1:30 pm-3:00 pm.")


def test_morning_notification_keeps_a_missing_slot_placeholder() -> None:
    payload = build_morning_notification(
        score_label="BALANCED",
        nalla_neram_start="-",
        nalla_neram_end="-",
        rahu_start="13:30",
        rahu_end="15:00",
        nakshatra_name_ta="அஸ்வினி",
        nakshatra_name_en="Aswini",
    )
    assert payload["title"]["ta"] == "இன்றைய நல்ல நேரம்: - – -"


def test_card_guidance_line_is_advisory() -> None:
    _assert_tamil_register(_daily_guidance_line(False)["ta"])

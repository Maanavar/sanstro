from app.services.nakshatra_content import build_nakshatra_perspective


def test_uthiradam_lens_mentions_discipline_and_patience():
    lens = build_nakshatra_perspective(21, "GOOD")
    assert "discipline" in lens.en.lower()
    assert "patience" in lens.en.lower()


def test_unknown_nakshatra_uses_default_lens():
    lens = build_nakshatra_perspective(999, "BALANCED")
    assert "calm" in lens.en.lower()
    assert "steady" in lens.en.lower()


def test_caution_label_adds_small_step_overlay():
    lens = build_nakshatra_perspective(4, "CAUTION")
    assert "small and stable steps" in lens.en.lower()


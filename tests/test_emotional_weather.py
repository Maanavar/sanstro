from app.services.emotional_weather import TransitPoint, compute_emotional_weather


def test_emotional_weather_saturn_moon_activation_is_heavy():
    result = compute_emotional_weather(
        natal_moon_longitude=100.0,
        natal_venus_longitude=250.0,
        lagna_rasi=1,
        transits={
            "SATURN": TransitPoint(absolute_longitude=101.5, rasi=4),
            "JUPITER": TransitPoint(absolute_longitude=20.0, rasi=1),
            "MARS": TransitPoint(absolute_longitude=210.0, rasi=8),
            "VENUS": TransitPoint(absolute_longitude=40.0, rasi=2),
            "RAHU": TransitPoint(absolute_longitude=310.0, rasi=11),
        },
    )
    assert result.tone == "heavy"
    assert result.physical_tendency == "low_energy"


def test_emotional_weather_venus_activation_is_calm():
    result = compute_emotional_weather(
        natal_moon_longitude=12.0,
        natal_venus_longitude=220.0,
        lagna_rasi=6,
        transits={
            "SATURN": TransitPoint(absolute_longitude=40.0, rasi=2),
            "JUPITER": TransitPoint(absolute_longitude=350.0, rasi=12),
            "MARS": TransitPoint(absolute_longitude=140.0, rasi=5),
            "VENUS": TransitPoint(absolute_longitude=220.2, rasi=9),
            "RAHU": TransitPoint(absolute_longitude=75.0, rasi=3),
        },
    )
    assert result.tone == "calm"
    assert result.best_use_of_day == "creative"


def test_emotional_weather_low_activation_defaults_to_steady():
    result = compute_emotional_weather(
        natal_moon_longitude=10.0,
        natal_venus_longitude=130.0,
        lagna_rasi=9,
        transits={
            "SATURN": TransitPoint(absolute_longitude=200.0, rasi=7),
            "JUPITER": TransitPoint(absolute_longitude=266.0, rasi=9),
            "MARS": TransitPoint(absolute_longitude=301.0, rasi=11),
            "VENUS": TransitPoint(absolute_longitude=42.0, rasi=2),
            "RAHU": TransitPoint(absolute_longitude=173.0, rasi=6),
        },
    )
    assert result.tone == "calm"
    assert result.physical_tendency == "steady"

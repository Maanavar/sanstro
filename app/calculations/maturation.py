from __future__ import annotations

from datetime import date

MATURATION_AGE: dict[str, int] = {
    "JUPITER": 16,
    "SUN": 22,
    "MOON": 24,
    "VENUS": 25,
    "MARS": 28,
    "MERCURY": 32,
    "SATURN": 36,
    "RAHU": 42,
    "KETU": 48,
}


def maturation_multiplier(planet: str, age_years: float) -> float:
    mat = MATURATION_AGE.get(planet, 30)
    if age_years < mat - 2:
        return 0.70
    if mat - 2 <= age_years <= mat + 2:
        return 1.10
    return 1.00


def maturation_status(planet: str, birth_date: date, on_date: date) -> dict:
    mat = MATURATION_AGE.get(planet, 30)
    age = (on_date - birth_date).days / 365.25
    is_matured = age >= mat
    years_to = max(0.0, mat - age) if not is_matured else None
    mult = maturation_multiplier(planet, age)

    if is_matured:
        label_ta = f"{planet} பலன் முழுமை பெற்றது (வயது {mat}+)"
        label_en = f"{planet} fully matured (age {mat}+)"
    else:
        label_ta = f"{planet} இன்னும் முதிர்வடையவில்லை ({years_to:.1f} ஆண்டுகள் மீதம்)"
        label_en = f"{planet} not yet matured ({years_to:.1f} yrs remaining)"

    return {
        "planet": planet,
        "maturation_age": mat,
        "current_age": round(age, 2),
        "is_matured": is_matured,
        "years_to_maturation": round(years_to, 2) if years_to is not None else None,
        "multiplier": mult,
        "label_ta": label_ta,
        "label_en": label_en,
    }


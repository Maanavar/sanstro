# P2-05 CLOSED, 2026-08-18. Divisional charts are surfaced in mobile/app/vargas/index.tsx
# and the jadhagam varga strip; the note had already recorded that and was never cleared.
from __future__ import annotations

from app.calculations.astro import navamsa_rasi_from_degree


def _norm(longitude: float) -> tuple[int, float]:
    lon = longitude % 360.0
    rasi = int(lon // 30.0) + 1
    deg = lon % 30.0
    return rasi, deg


def _add_signs(rasi: int, count: int) -> int:
    return ((rasi - 1 + count) % 12) + 1


def _map_divisional(
    planet_longitudes: dict[str, float],
    fn,
) -> dict[str, int]:
    return {planet: fn(longitude) for planet, longitude in planet_longitudes.items()}


def compute_d2(planet_longitudes: dict[str, float]) -> dict[str, int]:
    def _d2(lon: float) -> int:
        rasi, deg = _norm(lon)
        odd = (rasi % 2 == 1)
        first_half = deg < 15.0
        if odd:
            return 5 if first_half else 4
        return 4 if first_half else 5
    return _map_divisional(planet_longitudes, _d2)


def compute_d3(planet_longitudes: dict[str, float]) -> dict[str, int]:
    def _d3(lon: float) -> int:
        rasi, deg = _norm(lon)
        if deg < 10.0:
            return rasi
        if deg < 20.0:
            return _add_signs(rasi, 4)
        return _add_signs(rasi, 8)
    return _map_divisional(planet_longitudes, _d3)


def compute_d4(planet_longitudes: dict[str, float]) -> dict[str, int]:
    def _d4(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / 7.5), 3)
        return _add_signs(rasi, part * 3)
    return _map_divisional(planet_longitudes, _d4)


def compute_d7(planet_longitudes: dict[str, float]) -> dict[str, int]:
    step = 30.0 / 7.0

    def _d7(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 6)
        if rasi % 2 == 1:
            return _add_signs(rasi, part)
        return _add_signs(_add_signs(rasi, 6), part)
    return _map_divisional(planet_longitudes, _d7)


def compute_d10(planet_longitudes: dict[str, float]) -> dict[str, int]:
    def _d10(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / 3.0), 9)
        start = rasi if (rasi % 2 == 1) else _add_signs(rasi, 8)
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d10)


def compute_d12(planet_longitudes: dict[str, float]) -> dict[str, int]:
    def _d12(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / 2.5), 11)
        return _add_signs(rasi, part)
    return _map_divisional(planet_longitudes, _d12)


def compute_d16(planet_longitudes: dict[str, float]) -> dict[str, int]:
    step = 30.0 / 16.0
    movable = {1, 4, 7, 10}
    fixed = {2, 5, 8, 11}

    def _d16(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 15)
        if rasi in movable:
            start = 1
        elif rasi in fixed:
            start = 5
        else:
            start = 9
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d16)


def compute_d20(planet_longitudes: dict[str, float]) -> dict[str, int]:
    step = 1.5
    movable = {1, 4, 7, 10}
    fixed = {2, 5, 8, 11}

    def _d20(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 19)
        if rasi in movable:
            start = 1
        elif rasi in fixed:
            start = 9
        else:
            start = 5
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d20)


def compute_d24(planet_longitudes: dict[str, float]) -> dict[str, int]:
    step = 1.25

    def _d24(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 23)
        start = 5 if (rasi % 2 == 1) else 4
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d24)


def compute_d30(planet_longitudes: dict[str, float]) -> dict[str, int]:
    odd_segments = [
        (5.0, 1),   # Mars
        (5.0, 11),  # Saturn
        (8.0, 9),   # Jupiter
        (7.0, 3),   # Mercury
        (5.0, 7),   # Venus
    ]
    # Even signs: each lord's portion maps to the lord's OWN EVEN sign (BPHS
    # Trimsamsa), not a repeat of the odd-sign targets (WI-03).
    even_segments = [
        (5.0, 2),   # Venus  -> Taurus
        (7.0, 6),   # Mercury-> Virgo
        (8.0, 12),  # Jupiter-> Pisces
        (5.0, 10),  # Saturn -> Capricorn
        (5.0, 8),   # Mars   -> Scorpio
    ]

    def _d30(lon: float) -> int:
        rasi, deg = _norm(lon)
        table = odd_segments if (rasi % 2 == 1) else even_segments
        acc = 0.0
        for width, out_rasi in table:
            acc += width
            if deg < acc:
                return out_rasi
        return table[-1][1]
    return _map_divisional(planet_longitudes, _d30)


def compute_d40(planet_longitudes: dict[str, float]) -> dict[str, int]:
    step = 0.75

    def _d40(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 39)
        start = 1 if (rasi % 2 == 1) else 7
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d40)


def compute_d27(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Nakshatramsa/Bhamsa: not in this project's frozen spec. Standard Parashari
    # element-group rule (fire/earth/air/water quartets, each 90 deg apart) —
    # cross-check against a second source before using in scoring.
    step = 30.0 / 27.0
    fire = {1, 5, 9}
    earth = {2, 6, 10}
    air = {3, 7, 11}

    def _d27(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 26)
        if rasi in fire:
            start = 1
        elif rasi in earth:
            start = 4
        elif rasi in air:
            start = 7
        else:
            start = 10
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d27)


def compute_d45(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Akshavedamsa: not in this project's frozen spec. Standard Parashari rule —
    # movable signs start Aries, fixed start Leo, dual start Sagittarius.
    step = 30.0 / 45.0
    movable = {1, 4, 7, 10}
    fixed = {2, 5, 8, 11}

    def _d45(lon: float) -> int:
        rasi, deg = _norm(lon)
        part = min(int(deg / step), 44)
        if rasi in movable:
            start = 1
        elif rasi in fixed:
            start = 5
        else:
            start = 9
        return _add_signs(start, part)
    return _map_divisional(planet_longitudes, _d45)


def compute_d60(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Shashtiamsa: spec section 3.13. 60 divisions of 0 deg 30' each. Odd signs
    # count forward from their own rasi; even signs count backward. Previous
    # implementation ignored the natal rasi and always counted from Aries.
    step = 0.5

    def _d60(lon: float) -> int:
        rasi, deg = _norm(lon)
        index = min(int(deg / step), 59)
        if rasi % 2 == 1:
            return _add_signs(rasi, index)
        return _add_signs(rasi, -index)
    return _map_divisional(planet_longitudes, _d60)


def get_varga(
    division: int,
    planet_longitudes: dict[str, float],
) -> dict[str, int]:
    if division == 2:
        return compute_d2(planet_longitudes)
    if division == 3:
        return compute_d3(planet_longitudes)
    if division == 4:
        return compute_d4(planet_longitudes)
    if division == 7:
        return compute_d7(planet_longitudes)
    if division == 9:
        return _map_divisional(planet_longitudes, navamsa_rasi_from_degree)
    if division == 10:
        return compute_d10(planet_longitudes)
    if division == 12:
        return compute_d12(planet_longitudes)
    if division == 16:
        return compute_d16(planet_longitudes)
    if division == 20:
        return compute_d20(planet_longitudes)
    if division == 24:
        return compute_d24(planet_longitudes)
    if division == 27:
        return compute_d27(planet_longitudes)
    if division == 30:
        return compute_d30(planet_longitudes)
    if division == 40:
        return compute_d40(planet_longitudes)
    if division == 45:
        return compute_d45(planet_longitudes)
    if division == 60:
        return compute_d60(planet_longitudes)
    raise ValueError(f"Unsupported varga division: D{division}")

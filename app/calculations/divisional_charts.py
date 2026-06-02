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
    even_segments = [
        (5.0, 7),   # Venus
        (7.0, 3),   # Mercury
        (8.0, 9),   # Jupiter
        (5.0, 11),  # Saturn
        (5.0, 1),   # Mars
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


def compute_d60(planet_longitudes: dict[str, float]) -> dict[str, int]:
    step = 0.5

    def _d60(lon: float) -> int:
        _, deg = _norm(lon)
        part = min(int(deg / step), 59)
        return _add_signs(1, part)
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
    if division == 30:
        return compute_d30(planet_longitudes)
    if division == 40:
        return compute_d40(planet_longitudes)
    if division == 60:
        return compute_d60(planet_longitudes)
    raise ValueError(f"Unsupported varga division: D{division}")

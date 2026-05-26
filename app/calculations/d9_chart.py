from __future__ import annotations

from dataclasses import dataclass

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets


@dataclass(frozen=True, slots=True)
class D9Body:
    graha: str
    d9_rasi: int
    is_vargottama: bool


@dataclass(frozen=True, slots=True)
class D9Snapshot:
    jd_ut: float
    d9_lagna_rasi: int
    bodies: dict[str, D9Body]


def calculate_d9_chart(
    jd_ut: float,
    birth_latitude: float,
    birth_longitude: float,
) -> D9Snapshot:
    natal = calculate_sidereal_planets(jd_ut)
    lagna_degree = calculate_lagna_degree(jd_ut, birth_latitude, birth_longitude)
    d9_lagna_rasi = navamsa_rasi_from_degree(lagna_degree)

    bodies: dict[str, D9Body] = {}
    for graha, body in natal.bodies.items():
        d9_rasi = navamsa_rasi_from_degree(body.absolute_longitude)
        bodies[graha] = D9Body(
            graha=graha,
            d9_rasi=d9_rasi,
            is_vargottama=(body.rasi == d9_rasi),
        )

    return D9Snapshot(
        jd_ut=jd_ut,
        d9_lagna_rasi=d9_lagna_rasi,
        bodies=bodies,
    )

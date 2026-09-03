#!/usr/bin/env python3
"""Ingest a GeoNames-derived places dataset for offline birthplace search.

Owner ruling 2026-08-24 (B-006): birthplace lookup must be a bundled offline
dataset by default, not a per-query third-party geocoder call. This script
populates the `places` table (see `app/models/place.py`, migration
`mm6c7d8e9f0a`) from GeoNames' public dumps.

SCOPE (2026-08-24): Tamil Nadu only for this first cut, on explicit owner
instruction — "right now do only for Tamilnadu no other state no other
country, we can deal this later." `SCOPE_ADMIN1` below is the single place
that narrows it; widening later (rest of India, Sri Lanka, a global
population-floor safety net — all planned, just deferred) means adding
entries there and to `SOURCES`, not redesigning the pipeline.

  - IN.zip — India, EVERY populated place (feature class "P"), including
    unsurveyed villages with population=0, then filtered down to Tamil Nadu
    only via `SCOPE_ADMIN1`. No population floor within scope — that floor
    is exactly what the owner rejected `cities15000` for.
  - admin1CodesASCII.txt, countryInfo.txt — reference data joined in for
    display (state/province name, full country name).

Idempotent: upserts on `geoname_id` (GeoNames' own stable identifier), so
re-running after a source update just refreshes rows. Not run automatically
by dev.ps1 or CI — this is bulk reference data, not schema, and is run
manually against `vinaadi_dev` by whoever operates the ingestion.

Usage:
    python scripts/ingest_places.py                # download + ingest
    python scripts/ingest_places.py --skip-download # reuse cached downloads
    python scripts/ingest_places.py --dry-run       # parse only, no DB writes
"""
from __future__ import annotations

import argparse
import csv
import sys
import tempfile
import unicodedata
import zipfile
from pathlib import Path

import httpx
from sqlalchemy.dialects.postgresql import insert as pg_insert

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.place import Place  # noqa: E402

GEONAMES_BASE = "https://download.geonames.org/export/dump"

# (source file, filter to feature class "P" only)
# IN's dump contains every feature class (mountains, rivers, temples, ...) —
# always filtered to "P" (populated places) regardless of SCOPE_ADMIN1.
SOURCES: list[tuple[str, bool]] = [
    ("IN.zip", True),
]

# (country_code, admin1_code) pairs to keep; empty admin1_code = whole country.
# Tamil Nadu only, per owner instruction 2026-08-24. Widen this (and SOURCES,
# for LK.zip / cities500.zip) when the rest of India / diaspora work resumes.
SCOPE_ADMIN1: set[tuple[str, str]] = {("IN", "25")}  # IN.25 = Tamil Nadu

BATCH_SIZE = 2000


def _download(cache_dir: Path, filename: str) -> Path:
    dest = cache_dir / filename
    if dest.exists():
        print(f"  {filename}: cached ({dest.stat().st_size // 1024} KB)")
        return dest
    url = f"{GEONAMES_BASE}/{filename}"
    print(f"  {filename}: downloading from {url}")
    with httpx.stream("GET", url, timeout=60, follow_redirects=True) as resp:
        resp.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in resp.iter_bytes():
                f.write(chunk)
    print(f"  {filename}: {dest.stat().st_size // 1024} KB")
    return dest


def _extract_txt(zip_path: Path, cache_dir: Path) -> Path:
    """Extract the one data .txt from a GeoNames zip (readme.txt is also inside)."""
    stem = zip_path.stem  # "IN", "LK", "cities500"
    txt_path = cache_dir / f"{stem}.txt"
    if txt_path.exists():
        return txt_path
    with zipfile.ZipFile(zip_path) as zf:
        zf.extract(f"{stem}.txt", cache_dir)
    return txt_path


def _search_key(name: str) -> str:
    """ASCII-fold + lowercase, so a plain-ASCII query still matches diacritics."""
    folded = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    return folded.lower().strip()


def _load_admin1_names(cache_dir: Path) -> dict[str, str]:
    """admin1CodesASCII.txt: 'IN.25' -> name. Keyed by the raw 'CC.code' string."""
    path = cache_dir / "admin1CodesASCII.txt"
    out: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="\t"):
            if len(row) < 2:
                continue
            out[row[0]] = row[1]
    return out


def _load_country_names(cache_dir: Path) -> dict[str, str]:
    """countryInfo.txt: '#'-commented header/notes, then ISO -> ... -> Country name (col 4)."""
    path = cache_dir / "countryInfo.txt"
    out: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="\t"):
            if not row or row[0].startswith("#"):
                continue
            if len(row) < 5:
                continue
            out[row[0]] = row[4]
    return out


def _parse_places(
    txt_path: Path,
    filter_feature_class_p: bool,
    admin1_names: dict[str, str],
    country_names: dict[str, str],
) -> dict[int, dict]:
    """Parse one GeoNames dump into {geoname_id: row_dict}."""
    rows: dict[int, dict] = {}
    with open(txt_path, encoding="utf-8") as f:
        for line in csv.reader(f, delimiter="\t"):
            if len(line) < 19:
                continue
            geoname_id_str, name, _ascii, _alt, lat, lon, feat_class, _feat_code = line[0:8]
            country_code, _cc2, admin1_code = line[8], line[9], line[10]
            population_str, _elev, _dem, timezone = line[14], line[15], line[16], line[17]

            if filter_feature_class_p and feat_class != "P":
                continue
            if not name or not lat or not lon or not country_code:
                continue
            if (country_code, admin1_code) not in SCOPE_ADMIN1:
                continue

            try:
                geoname_id = int(geoname_id_str)
                population = int(population_str) if population_str else 0
            except ValueError:
                continue

            admin1_key = f"{country_code}.{admin1_code}" if admin1_code else ""
            rows[geoname_id] = {
                "geoname_id": geoname_id,
                "name": name,
                "search_key": _search_key(name),
                "admin1_name": admin1_names.get(admin1_key),
                "country_code": country_code,
                "country_name": country_names.get(country_code, country_code),
                "latitude": float(lat),
                "longitude": float(lon),
                "timezone": timezone or "UTC",
                "population": population,
            }
    return rows


def _upsert(all_rows: dict[int, dict], dry_run: bool) -> None:
    if dry_run:
        print(f"\nDry run: {len(all_rows)} unique places parsed, no DB writes.")
        for sample in list(all_rows.values())[:5]:
            print(f"  {sample['name']}, {sample['admin1_name']}, {sample['country_name']} "
                  f"({sample['latitude']}, {sample['longitude']}, {sample['timezone']})")
        return

    values = list(all_rows.values())
    db = SessionLocal()
    try:
        for i in range(0, len(values), BATCH_SIZE):
            batch = values[i : i + BATCH_SIZE]
            stmt = pg_insert(Place).values(batch)
            update_cols = {c: stmt.excluded[c] for c in batch[0] if c != "geoname_id"}
            stmt = stmt.on_conflict_do_update(index_elements=["geoname_id"], set_=update_cols)
            db.execute(stmt)
            print(f"  upserted {min(i + BATCH_SIZE, len(values))}/{len(values)}")
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"\nDone: {len(values)} places upserted.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--skip-download", action="store_true", help="reuse cached files in the cache dir")
    parser.add_argument("--dry-run", action="store_true", help="parse and report counts only, no DB writes")
    parser.add_argument(
        "--cache-dir",
        default=str(Path(tempfile.gettempdir()) / "vinaadi_places_ingest"),
        help="directory for downloaded/extracted GeoNames files",
    )
    args = parser.parse_args()

    cache_dir = Path(args.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    reference_files = ["admin1CodesASCII.txt", "countryInfo.txt"]
    source_files = [name for name, _ in SOURCES]

    if not args.skip_download:
        print("Downloading GeoNames source files...")
        for filename in [*source_files, *reference_files]:
            _download(cache_dir, filename)
    else:
        print("Skipping download, using cached files in", cache_dir)

    print("\nExtracting...")
    for filename in source_files:
        _extract_txt(cache_dir / filename, cache_dir)

    print("\nLoading reference data...")
    admin1_names = _load_admin1_names(cache_dir)
    country_names = _load_country_names(cache_dir)
    print(f"  {len(admin1_names)} admin1 regions, {len(country_names)} countries")

    print("\nParsing place dumps...")
    all_rows: dict[int, dict] = {}
    for filename, filter_p in SOURCES:
        stem = Path(filename).stem
        txt_path = cache_dir / f"{stem}.txt"
        parsed = _parse_places(txt_path, filter_p, admin1_names, country_names)
        print(f"  {filename}: {len(parsed)} populated places")
        all_rows.update(parsed)

    print(f"\n{len(all_rows)} unique places total (post-dedup by geoname_id).")
    _upsert(all_rows, args.dry_run)


if __name__ == "__main__":
    main()

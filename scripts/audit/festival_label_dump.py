"""Every festival label the engine prints, one "date<TAB>name" line each.

For before/after diffs of a rule change (rulings 2026-10-22 round two, §10
step 11). Point APP_ROOT at a copy of the tree to dump a baseline.

    docker cp scripts/audit/festival_label_dump.py vinaadi-dev-api:/tmp/
    docker exec vinaadi-dev-api python /tmp/festival_label_dump.py 2020 2045 > after.tsv
    docker exec -e APP_ROOT=/tmp/baseline vinaadi-dev-api python /tmp/festival_label_dump.py 2020 2045 > before.tsv
"""
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.environ.get("APP_ROOT", "/app"))

from app.services.panchangam_cache import calculate_daily_panchangam
from app.services.panchangam_service import _build_festivals

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707

y0, y1 = int(sys.argv[1]), int(sys.argv[2])
d = date(y0, 1, 1)
prev = calculate_daily_panchangam(d - timedelta(days=1), LAT, LON, TZ)
while d <= date(y1, 12, 31):
    snap = calculate_daily_panchangam(d, LAT, LON, TZ)
    for name in sorted({f.name for f in _build_festivals(snap, previous_day_snapshot=prev)}):
        print(f"{d.isoformat()}\t{name}")
    prev, d = snap, d + timedelta(days=1)

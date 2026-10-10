"""Capture the Story-view reading-budget fixture from the real engine.

Writes `web/components/chart-reading/__fixtures__/synthetic-readings.json`: a
trimmed dashboard bundle for two synthetic charts, read by
`story-reading-budget.test.tsx` (FTR-17). Two charts, so a chapter that happens
to run short for one chart cannot pass the gate alone.

Synthetic identities only. Runs as a pytest module so it reuses the `client`
fixture against the TEST database (never vinaadi_dev):

    $env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
    $env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
    .\\.venv\\Scripts\\python.exe -m pytest scripts\\capture_reading_fixture.py -p tests.conftest --no-cov -q

Not under `testpaths`, so the suite never collects it.
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "web/components/chart-reading/__fixtures__/synthetic-readings.json"
AS_OF = "2026-10-04"

PROFILES = [
    ("Synthetic A", "1991-07-22", "06:30:00", 13.0827, 80.2707),
    ("Synthetic B", "1984-02-11", "21:15:00", 9.9252, 78.1198),
]

CHART_KEYS = ["lagna", "planets", "yogas", "doshams", "ashtakavarga"]
PLANET_KEYS = ["d9Rasi", "graha", "houseFromLagna", "isCombust", "isRetrograde", "isVargottama",
               "nakshatra", "nakshatraName", "pada", "rasi", "strengthScore"]
DOSHAM_DROP = {"explanationHowEn", "explanationHowTa", "variantEn", "variantTa"}


def test_capture(client):
    out = []
    for name, d, t, lat, lon in PROFILES:
        profile = {
            "ownerUserId": "33333333-3333-3333-3333-333333333333",
            "displayName": name,
            "birthDateLocal": d,
            "birthTimeLocal": t,
            "birthPlace": "Synthetic, Tamil Nadu, India",
            "birthLatitude": lat,
            "birthLongitude": lon,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        }
        chart_id = client.post("/api/v1/birth-profiles", json=profile).json()["data"]["chartId"]
        r = client.get(f"/api/v1/charts/{chart_id}/dashboard-bundle", params={"date": AS_OF, "language": "ta-en"})
        assert r.status_code == 200, r.text[:300]
        data = r.json()["data"]
        chart = {k: data["chart"][k] for k in CHART_KEYS if k in data["chart"]}
        # Trim to what the panel reads. Story and Astrologer both prefer
        # explanation.yogaDosham, so the chart-level copies are never rendered.
        chart["yogas"], chart["doshams"] = [], []
        chart["planets"] = [{k: p[k] for k in PLANET_KEYS if k in p} for p in chart["planets"]]
        explanation = dict(data["explanation"])
        explanation.pop("bhavas", None)  # not rendered by this panel
        yd = dict(explanation["yogaDosham"])
        yd["yogas"] = [{k: v for k, v in y.items() if k != "peakWindow"} for y in yd["yogas"]]
        yd["doshams"] = [{k: v for k, v in x.items() if k not in DOSHAM_DROP} for x in yd["doshams"]]
        explanation["yogaDosham"] = yd
        explanation["chartId"] = "synthetic"
        out.append(
            {
                "name": name,
                "today": AS_OF,
                "chart": chart,
                "explanation": explanation,
                "transit": data.get("transit"),
                "sani": data.get("sani"),
                "peyarchiUpcoming": data.get("peyarchiUpcoming") or [],
            }
        )
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

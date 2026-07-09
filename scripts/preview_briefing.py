"""Preview the Track A synthesized daily briefing for a real dev chart.

READ-ONLY: loads one chart from whatever JOTHIDAM_DATABASE_URL points at,
flips the `daily_briefing_synth` flag *in this process only*, computes today's
guidance in memory, and prints the new `briefing` next to the current six-row
output. It never writes to the DB (panchangam is computed without the cache
session) and never commits — so it's safe to run against the dev DB.

    $env:PYTHONUTF8 = "1"; python scripts/preview_briefing.py
    $env:PYTHONUTF8 = "1"; python scripts/preview_briefing.py <chart_id>

This shows the exact text the Nova/Classic UI will render once the flag is on
for real — without touching the running server or its cache.
"""
from __future__ import annotations

import sys
from datetime import date

# Tamil-safe stdout on Windows consoles.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: S110 — best-effort; PYTHONUTF8=1 covers the rest
    pass

from sqlalchemy import select

from app.db.session import SessionLocal, engine
from app.models import Chart
from app.services.chart_service import load_persisted_chart_response
from app.services.daily_guidance_service import build_daily_guidance_response
from app.services.feature_flags import set_flag


def _rule(title: str) -> None:
    print("\n" + "=" * 78 + f"\n{title}\n" + "=" * 78)


def main() -> int:
    # Flip the flag for THIS process only. The running server is unaffected.
    set_flag("daily_briefing_synth", True)

    print(f"DB: {engine.url.render_as_string(hide_password=True)}")

    with SessionLocal() as session:
        chart_id_arg = sys.argv[1] if len(sys.argv) > 1 else None
        if chart_id_arg:
            chart = session.get(Chart, chart_id_arg)
        else:
            chart = session.execute(
                select(Chart)
                .where(Chart.status == "completed")
                .order_by(Chart.created_at.desc())
                .limit(1)
            ).scalar_one_or_none()

        if chart is None:
            print("No completed chart found. Pass a chart_id, or point "
                  "JOTHIDAM_DATABASE_URL at a DB that has one.")
            return 1

        snapshot = load_persisted_chart_response(session, chart.chart_id)
        # session omitted on purpose → panchangam computes without writing the cache.
        guidance = build_daily_guidance_response(snapshot, date.today()).data

    print(f"Chart: {chart.chart_id}   Date: {date.today()}   Label: {guidance.label}")

    _rule("BEFORE — six equal-weight rows (flag OFF)")
    r = guidance.reasons
    for name, bi in (
        ("summary", guidance.text),
        ("moonTransit", r.moon_transit),
        ("dashaSupport", r.dasha_support),
        ("panchangam", r.panchangam),
        ("gochar", r.gochar),
        ("personalCaution", r.personal_caution),
    ):
        print(f"[{name}] {bi.en}")

    _rule("AFTER — one synthesized briefing (flag ON)")
    if guidance.briefing is None:
        print("briefing is None — flag not applied? (unexpected)")
        return 1
    print("EN:", guidance.briefing.en)
    print()
    print("TA:", guidance.briefing.ta)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

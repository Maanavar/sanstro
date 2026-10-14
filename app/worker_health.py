"""Container health probe for the dedicated scheduler worker."""
from __future__ import annotations

import logging

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.scheduler_heartbeat_service import scheduler_is_healthy


def main() -> None:
    settings = get_settings()
    try:
        with SessionLocal() as session:
            healthy = scheduler_is_healthy(
                session,
                max_age_seconds=settings.scheduler_heartbeat_max_age_seconds,
            )
    except Exception:
        logging.getLogger(__name__).exception("scheduler heartbeat probe failed")
        raise SystemExit(1) from None
    raise SystemExit(0 if healthy else 1)


if __name__ == "__main__":
    main()

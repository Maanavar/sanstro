"""CI guard: the open-beta switch has two readers, and they must agree.

The server's `open_beta` setting lifts the caps (app/core/subscription.py).
`OPEN_BETA` in packages/shared/src/constants/launch.ts drives public copy that
renders with no signed-in user (pricing, upgrade prompts). If they drift, the
site either promises "everything free" while the server caps, or asks for money
the server is not charging — the exact contradiction GRW-05 removed.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.core.config import Settings

LAUNCH_TS = Path(__file__).resolve().parents[1] / "packages" / "shared" / "src" / "constants" / "launch.ts"


def _ts_open_beta() -> bool:
    match = re.search(r"export const OPEN_BETA\s*=\s*(true|false)\s*;", LAUNCH_TS.read_text(encoding="utf-8"))
    assert match, f"OPEN_BETA declaration not found in {LAUNCH_TS}"
    return match.group(1) == "true"


SITE_TS = LAUNCH_TS.with_name("site.ts")


@pytest.mark.no_db
def test_share_card_address_matches_the_site_constant() -> None:
    """GRW-04: the backend's share card printed vinaadi.ai while the web said
    vinaadi.com and mobile said vinaadi.app. One address, pinned both sides."""
    match = re.search(r'export const SITE_URL\s*=\s*"([^"]+)"', SITE_TS.read_text(encoding="utf-8"))
    assert match, f"SITE_URL declaration not found in {SITE_TS}"
    assert Settings.model_fields["public_site_url"].default == match.group(1)


@pytest.mark.no_db
def test_open_beta_default_matches_the_public_copy_constant() -> None:
    server_default = Settings.model_fields["open_beta"].default
    assert server_default == _ts_open_beta(), (
        "app/core/config.py `open_beta` default and launch.ts `OPEN_BETA` disagree. "
        "Ending (or starting) the beta is one change: flip both."
    )

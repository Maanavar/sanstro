"""Public site status: the maintenance banner and which features are paused.

Read by web and the app on load so a paused feature can say so up front
instead of failing on tap. Exempt from maintenance mode (app/middleware.py):
it is how a client learns that maintenance is on.
"""
from __future__ import annotations

from fastapi import APIRouter, Response
from pydantic import BaseModel

from app.core.kill_switch import KILL_SWITCHES, switch_is_on
from app.services.feature_flags import get_flag

router = APIRouter(tags=["site-status"])


class SiteBanner(BaseModel):
    en: str
    ta: str


class SiteStatusResponse(BaseModel):
    maintenance: bool
    #: None when no banner is set. If only one language is set, the other
    #: falls back to it rather than showing an empty banner.
    banner: SiteBanner | None
    #: Kill switches currently off, e.g. ["enable_ask_vinaadi"].
    paused: list[str]


@router.get("/site-status", response_model=SiteStatusResponse)
def site_status(response: Response) -> SiteStatusResponse:
    # Short public cache: flags reach every worker within seconds; a banner
    # may lag by the same order.
    response.headers["Cache-Control"] = "public, max-age=15"
    en = str(get_flag("maintenance_banner_en") or "").strip()
    ta = str(get_flag("maintenance_banner_ta") or "").strip()
    banner = SiteBanner(en=en or ta, ta=ta or en) if (en or ta) else None
    return SiteStatusResponse(
        maintenance=bool(get_flag("maintenance_mode")),
        banner=banner,
        paused=[name for name in KILL_SWITCHES if not switch_is_on(name)],
    )

from __future__ import annotations

import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.newsletter_subscriber import NewsletterSubscriber

log = logging.getLogger(__name__)
router = APIRouter()

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class NewsletterSubscribeRequest(BaseModel):
    email: str
    source: str = "web_home"


@router.post("/newsletter", tags=["public"])
def subscribe_newsletter(
    body: NewsletterSubscribeRequest,
    session: Session = Depends(get_db),
) -> dict:
    """Capture an email address for the Vinaadi newsletter (P4-10)."""
    email = body.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Invalid email address.")

    try:
        session.add(NewsletterSubscriber(email=email, source=body.source[:64]))
        session.commit()
    except IntegrityError:
        # An existing address is deliberately indistinguishable from a fresh
        # subscription, including when two requests race to insert it.
        session.rollback()
    except Exception:
        session.rollback()
        log.exception("newsletter_subscribe_error")
        # `from None`: the original error is already in the log above and must
        # not leak to the client.
        raise HTTPException(
            status_code=500, detail="Could not save subscription."
        ) from None

    return {"success": True}

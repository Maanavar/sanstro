"""The one place that answers "may this user read this chart?".

Before this module the answer lived in six copies of `_assert_chart_owner`, one
per router, and the cost was not the duplication — it was that a rule living in
six places is a rule nobody can check. Two things had already happened:

1. **`app/api/muhurta.py` never got one.** Its `_current_user` was
   underscore-prefixed (deliberately unused) and neither `find_best_muhurta_slots`
   nor `list_muhurtham_naals` takes a `user_id`, so nothing downstream re-checked.
   Any authenticated user with a chart UUID could read another user's output from
   `GET /charts/{chart_id}/muhurta` and `/muhurtham-naals`. A live IDOR, and it is
   exactly the shape a missing sixth copy takes: nothing is *wrong* in muhurta.py,
   something is *absent*, and absence does not show up in a diff.

2. **`journal.py`'s copy had drifted**, which the reuse audit that found (1)
   recorded as "identical bodies". It was missing the `deleted_at` check — so a
   chart whose birth profile had been soft-deleted stayed readable through that
   route — and it answered 403 where the other five answer 404, leaking chart
   existence to a non-owner. Neither is visible when you read the copy on its own;
   both are obvious the moment the six sit in one place.

So this function is the superset of all six, and the two callers that wanted a
narrower return type keep working because ignoring a returned tuple is free.

**404 before 403, always.** A missing chart and a chart belonging to someone else
must be indistinguishable to a non-owner, or the 403 becomes an oracle for "this
UUID exists". That is why the ownership comparison is the *last* check and why a
soft-deleted profile is a 404 rather than a 403.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import BirthProfile, Chart
from app.models.user import User


def assert_chart_owner(
    session: Session, chart_id: UUID, current_user: User
) -> tuple[Chart, BirthProfile]:
    """Return the chart and its profile, or raise 404/403.

    Callers that only need the authorisation may discard the return value.
    """
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found."
        )
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return chart, profile

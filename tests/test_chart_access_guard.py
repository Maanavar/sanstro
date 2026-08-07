"""One rule, 52 routes, and a test that fails when route 53 forgets it.

`_assert_chart_owner` used to be six copies, one per router. The cost was never
the duplicated lines — it was that a rule living in six places is a rule nobody
can check, and two things had already gone wrong by the time anyone counted:

- **`muhurta.py` and `share_card.py` never got a copy.** Both took an
  authenticated user and never used it (`muhurta`'s was even named
  `_current_user`), and neither service takes an owner argument, so nothing
  downstream re-checked. Any signed-in user with a chart UUID could read another
  user's muhurta slots, ranked wedding dates, and daily share card.
- **`journal.py`'s copy had drifted.** It skipped the `deleted_at` check and
  answered 403 where the rest answer 404.

Both failure modes are invisible in a diff of the file that has them, which is
what this file is for. The behavioural test proves the guard works on the routes
that were broken; the structural test makes the *absence* of a guard a test
failure rather than something you have to notice.
"""
from __future__ import annotations

import importlib
import inspect
from uuid import UUID

import pytest

from app.core.auth import get_current_user
from app.core.chart_access import assert_chart_owner
from app.db.session import SessionLocal
from app.main import app
from app.models.subscription import Subscription
from app.models.user import User

OTHER_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
OTHER_USER_EMAIL = "intruder@jothidam.test"


# ── How each router answers "may this user read this chart?" ─────────────────
#
# TWO PATTERNS ARE ALLOWED AND MIXING THEM WAS THE PROBLEM. Either the router
# calls `assert_chart_owner` before reaching the service, or it passes the
# owner's id into a service that filters on it. Both are correct; what is not
# correct is nobody knowing which a given router uses, because then "this one has
# no guard" and "this one is guarded further down" look identical from here.
#
# So each module declares its choice. A new `{chart_id}` router fails
# `test_every_chart_id_route_declares_how_it_checks_ownership` until it appears
# below, which forces the decision to be made by a person rather than by
# omission.
ROUTER_GUARD = "router-guard"
SERVICE_SCOPE = "service-scope"

#
# `app.api.journal` IS DELIBERATELY ABSENT. It guards a chart_id too, but takes it
# from a request *body* (`POST /journal`) rather than a path segment, so the route
# enumeration below cannot see it — and a registry that listed it would fail the
# staleness check for a module that is doing nothing wrong. It gets its own test
# instead, `test_the_journal_router_guards_its_body_supplied_chart_id`, which is
# also the honest record that this file's structural half covers path params only.
# A future router taking chart_id from a body is NOT protected by the enumeration.
_CHART_ROUTE_OWNERSHIP: dict[str, str] = {
    "app.api.charts": ROUTER_GUARD,
    "app.api.daily_guidance": ROUTER_GUARD,
    "app.api.numerology": ROUTER_GUARD,
    "app.api.remedies": ROUTER_GUARD,
    "app.api.transits": ROUTER_GUARD,
    # Added 2026-08-07. Both had an unused authenticated user and no downstream
    # check — see the module docstring.
    "app.api.muhurta": ROUTER_GUARD,
    "app.api.share_card": ROUTER_GUARD,
    # These pass `current_user.user_id` into a service that filters on it.
    # Verified individually, not assumed: `life_event_log_service._assert_owner`,
    # `annual_wrapped`'s `owner_user_id` argument, `ask_vinaadi`'s inline
    # `profile.owner_user_id != current_user.user_id`, and
    # `predictions._load_chart_context`.
    "app.api.annual_wrapped": SERVICE_SCOPE,
    "app.api.ask_vinaadi": SERVICE_SCOPE,
    "app.api.life_areas": SERVICE_SCOPE,
    "app.api.life_events": SERVICE_SCOPE,
    "app.api.life_event_log": SERVICE_SCOPE,
    "app.api.predictions": SERVICE_SCOPE,
}


def _chart_id_routes() -> list[tuple[str, str, str]]:
    """(method, path, module) for every live route with a `{chart_id}` segment.

    Read off the app rather than from a hand-kept list, which is the only way a
    route added tomorrow reaches this test.
    """
    rows: list[tuple[str, str, str]] = []
    for route in app.routes:
        path = getattr(route, "path", "")
        if "{chart_id}" not in path:
            continue
        for method in sorted(getattr(route, "methods", None) or []):
            if method in {"GET", "POST", "PATCH", "PUT", "DELETE"}:
                rows.append((method, path, route.endpoint.__module__))
    return rows


def test_there_are_chart_id_routes_to_check():
    """The other tests here are vacuous if the enumeration silently returns [].

    An import shuffle or a router that stops being mounted would empty
    `_chart_id_routes()` and turn every assertion below green.
    """
    assert len(_chart_id_routes()) > 40


def test_every_chart_id_route_declares_how_it_checks_ownership():
    """Route 53 fails this until someone decides which pattern it uses.

    This is the test that would have caught `muhurta.py` and `share_card.py` on
    the day they were written. Not by reading their code — by noticing that two
    modules serving `{chart_id}` had never said how they authorise.
    """
    modules = {module for _, _, module in _chart_id_routes()}
    undeclared = modules - set(_CHART_ROUTE_OWNERSHIP)
    assert not undeclared, (
        f"{undeclared} serve a {{chart_id}} route without declaring how they check "
        "ownership. Add each to _CHART_ROUTE_OWNERSHIP in this file, and make sure "
        "the declaration is true."
    )
    stale = set(_CHART_ROUTE_OWNERSHIP) - modules
    assert not stale, f"_CHART_ROUTE_OWNERSHIP names modules with no chart route: {stale}"


@pytest.mark.parametrize(
    "module_name",
    sorted(m for m, pattern in _CHART_ROUTE_OWNERSHIP.items() if pattern == ROUTER_GUARD),
)
def test_router_guard_modules_use_the_shared_guard(module_name: str):
    """A declaration nobody implements is worse than no declaration.

    Identity, not name: `assert_chart_owner` is imported under the private alias
    `_assert_chart_owner` in the six routers that already had one, so that the
    call sites did not have to change. This checks the object, so re-growing a
    seventh local copy under the same name fails here.
    """
    module = importlib.import_module(module_name)
    bound = [
        value
        for value in vars(module).values()
        if value is assert_chart_owner
    ]
    assert bound, (
        f"{module_name} declares {ROUTER_GUARD} but does not import "
        "app.core.chart_access.assert_chart_owner. Either import it or change the "
        "declaration."
    )


def test_the_journal_router_guards_its_body_supplied_chart_id():
    """The one router the path enumeration structurally cannot reach.

    Its own copy of the rule was the drifted one — missing the `deleted_at`
    check, so a chart whose birth profile had been soft-deleted stayed readable
    through it, and answering 403 rather than 404 for a profile that is not there.
    Both are fixed by using the shared guard; this pins that it keeps using it.
    """
    import app.api.journal as journal

    assert any(value is assert_chart_owner for value in vars(journal).values()), (
        "app.api.journal no longer imports the shared guard. It takes chart_id from a "
        "request body, so nothing else in this file will notice."
    )


@pytest.mark.parametrize(
    "module_name",
    sorted(m for m, pattern in _CHART_ROUTE_OWNERSHIP.items() if pattern == SERVICE_SCOPE),
)
def test_service_scope_modules_hand_the_user_to_the_service(module_name: str):
    """The weaker half of the pair, and honest about being weaker.

    This cannot prove the *service* filters — only that the router passes the
    identity along, which is the necessary condition and the part that regresses.
    A router that stops passing `current_user.user_id` has silently become
    `muhurta.py`, and that is the transition worth catching.
    """
    source = inspect.getsource(importlib.import_module(module_name))
    assert "current_user.user_id" in source, (
        f"{module_name} declares {SERVICE_SCOPE} but never passes "
        "current_user.user_id anywhere. It is now unguarded."
    )


# ── The behavioural half ─────────────────────────────────────────────────────


@pytest.fixture()
def other_users_chart(client, birth_profile_payload_factory):
    """A chart owned by the test user, then a client authenticated as somebody else.

    Returns the chart id. The `client` fixture's dependency override is swapped
    rather than a second client built, because the override is what decides who
    the request is from.
    """
    created = client.post(
        "/api/v1/birth-profiles",
        json=birth_profile_payload_factory(display_name="Meena Synthetic"),
    )
    assert created.status_code == 200, created.text
    chart_id = created.json()["data"]["chartId"]

    with SessionLocal() as session:
        with session.begin():
            uid = UUID(OTHER_USER_ID)
            session.add(User(user_id=uid, email=OTHER_USER_EMAIL))
            session.flush()
            session.add(Subscription(user_id=uid, tier="premium", status="active"))

    intruder = User(user_id=UUID(OTHER_USER_ID), email=OTHER_USER_EMAIL)
    app.dependency_overrides[get_current_user] = lambda: intruder
    return chart_id


# Every route below is driven with VALID parameters on purpose. A route that 422s
# on a missing query param would pass a "not 200" assertion while proving
# nothing about ownership, which is the trap in testing this generically — so the
# assertion is that the answer is specifically 403, and the parameters are real.
_DRIVEABLE_ROUTES: list[tuple[str, str, dict]] = [
    # The two that were unguarded, and the reason this file exists.
    ("GET", "/api/v1/charts/{chart_id}/muhurta",
     {"activity": "MARRIAGE", "dateFrom": "2027-01-01", "dateTo": "2027-01-31"}),
    ("GET", "/api/v1/charts/{chart_id}/muhurtham-naals", {"year": 2027}),
    ("GET", "/api/v1/charts/{chart_id}/share-card", {"type": "DAILY_VIBE"}),
    # Controls: already guarded, and they keep this test honest — if the fixture
    # or the override stopped working, these would fail too, so a green run on
    # the three above means something.
    ("GET", "/api/v1/charts/{chart_id}", {}),
    ("GET", "/api/v1/charts/{chart_id}/summary", {}),
    ("GET", "/api/v1/charts/{chart_id}/gochar/current", {"date": "2026-08-07"}),
    ("GET", "/api/v1/charts/{chart_id}/gemstone-advice", {}),
    ("GET", "/api/v1/charts/{chart_id}/daily-guidance", {"date": "2026-08-07"}),
]


@pytest.mark.parametrize("method,path,params", _DRIVEABLE_ROUTES)
def test_another_users_chart_is_refused(
    client, other_users_chart, method: str, path: str, params: dict
):
    response = client.request(
        method, path.format(chart_id=other_users_chart), params=params
    )
    assert response.status_code == 403, (
        f"{method} {path} answered {response.status_code} to a non-owner: "
        f"{response.text[:400]}"
    )


def test_the_guard_answers_404_before_403_for_a_chart_that_does_not_exist(
    client, other_users_chart
):
    """A 403 on an unknown UUID would confirm the UUID exists.

    The ordering inside `assert_chart_owner` is the whole point of it being one
    function: a missing chart and someone else's chart have to be
    indistinguishable to a non-owner, and that is only checkable if the checks
    happen in one place.
    """
    missing = "cccccccc-cccc-cccc-cccc-cccccccccccc"
    response = client.get(f"/api/v1/charts/{missing}/share-card", params={"type": "DAILY_VIBE"})
    assert response.status_code == 404, response.text

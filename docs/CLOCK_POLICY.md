# Infrastructure clock policy

**Status:** ratified implementation policy (2026-10-12)
**Code owner:** `app/core/clock.py`

Vinaadi treats three time-domain values as different types even when Python can
represent more than one of them with `date` or `datetime`:

1. A **UTC instant** identifies one point on the timeline. Delivery due times,
   claim leases, retry times, expiry times, generated timestamps and cache TTLs
   use aware UTC datetimes.
2. A **local civil day** is derived from one UTC instant plus one named IANA
   timezone. Notification quiet hours, daily activity and location-dependent
   current-day cache invalidation use this type.
3. A **date-only astrology input** is a requested calendar date. It is not
   converted to midnight UTC. Panchangam, dasha, transit and other astrology
   calculations retain their explicit date semantics and sunrise doctrine.

## Account day and month

Ask Vinaadi quotas and the app-activity streak use the named
`ACCOUNTING_TIMEZONE_NAME`, currently `Asia/Kolkata`. A quota day changes at
00:00 in that zone; a quota month begins on day one under the same policy.

This is account/commercial state, not birth-place astrology. It must remain
stable when a user travels, edits a current location, changes a birth profile,
or crosses a DST boundary. Vinaadi has no immutable per-account billing
timezone today. Borrowing a mutable profile timezone would let the same account
gain or lose a reset by editing or switching profiles. If a true account
timezone is introduced later, migrating existing usage periods requires an
explicit product and data-migration decision; do not silently change this
constant.

**Telling the reader when it resets.** `GET /ask-vinaadi/daily-status` carries
`resetsAt`, the UTC instant the next quota day begins (or the next month, for
a monthly allowance). Web and mobile name that instant in the reader's own
clock through `packages/shared/src/askAllowance.ts`. Neither client says
"tomorrow" on its own: under this policy, a New York reader's day turns over
at 14:30 the same afternoon. Because the copy reads the server's instant, a
change to this constant changes the copy too. Decided 2026-10-12: keep the
stable Kolkata day and state the reset time, rather than introduce an account
timezone. That remains available, through the decision described above, if a
paying market ever needs a local-midnight reset.

Admin daily quota counts use the same accounting date as enforcement. Analytics
windows that measure elapsed time continue to use UTC instants.

## Location-dependent behavior

- Notification smart silence and per-local-day push caps follow the user's
  effective daily-location timezone. Delivery due, claim, retry and expiry
  comparisons remain UTC instants.
- Chart and daily-snapshot omitted-date defaults follow the chart owner's or
  explicitly requested location timezone. They are astrology inputs, not the
  account quota date.
- A current-location edit invalidates derived `DailyScore` rows from the
  **earlier** of the old and new local dates at the same instant. This prevents
  a date-line crossing from leaving a stale row reachable in either location.
  Natal input corrections invalidate every derived day. Audience-only changes
  invalidate from the effective local day.
- Panchangam cache freshness, stored timestamps and expiry use UTC instants;
  the requested Panchangam date remains date-only. Sunrise conventions are not
  part of this infrastructure policy and are unchanged.

## Injection rule

Infrastructure code accepts a keyword-only `Clock` and defaults it to
`SYSTEM_CLOCK`. One operation passes the same clock through all of its reads so
it cannot straddle midnight in tests or during a request. Tests use a frozen
clock; application code does not monkeypatch `datetime` or depend on the host's
local timezone. `utc_now()` rejects a naive injected datetime.

New quota, notification, current-day cache or expiry logic must take the clock
through this seam. Do not call `date.today()` for infrastructure state.

## Deliberate classification of remaining wall-clock reads

The Phase 4 sweep changed the quota reads in `ask_vinaadi_usage_service.py`, the
matching admin quota summaries, chart/daily-snapshot defaults, notification
delivery/expiry, Panchangam cache TTLs, birth-profile cache invalidation and the
activity streak. Remaining `date.today()` calls in calculation, prediction,
public-tool, validation and export modules are date-only astrology/default or
document-generation inputs, not quota/expiry state. They were deliberately not
mass-replaced: some lack a user location, and inventing an infrastructure
timezone would change astrology semantics. They should move only when the
owning API supplies an explicit calculation timezone or date.

Security-token expiry code already compares aware UTC instants and has its own
rotation/expiry test boundary. It is not converted to a civil day. Future work
may route those instants through `Clock` when deterministic token-expiry tests
need that seam; that is not permission to turn token expiries into dates.

## Invalid timezones at the edge

Where a civil date is derived from a caller-supplied timezone before any other
work (`/daily-snapshot?tz=`), an unknown zone is a **422**, not a 500. The date
cannot be computed without it, and it is the caller's input.

## Verification and known limits

`tests/test_clock_boundaries_db.py` drives a frozen clock through the real call
sites against Postgres: an exhausted quota that resets at 18:30Z (Kolkata
midnight), a westward-to-eastward date-line move, an audience change on the
UTC+14 side of the date line, and an audience change just after New York's
spring-forward. Controls run on 2026-10-12: with `local_date` replaced by the
host's `date.today()` (the pre-fix behaviour) **4 of 5 fail**; the fifth is a
no-change control that passes under both by design. With the move cutoff taken
from the new place only, exactly the date-line case fails. The DST case does
not discriminate a UTC-date implementation (UTC is already Mar 9 at that
instant) — it guards against a fixed standard offset only.

`tests/test_clock_policy.py` pins the clock immediately before and after Kolkata
midnight/month rollover, demonstrates that two saved timezones can disagree on
the civil date without changing the quota period, covers New York's 23-hour DST
day, and checks date-line cache invalidation. Notification tests pin due and
expiry instants. Existing quota, outbox, Panchangam, profile, chart, admin and
streak suites exercise compatibility.

The pre-fix quota implementation used the API host's `date.today()`. The
midnight and month tests therefore represent behavior that changes when the
host is not on Kolkata time. The saved-timezone and DST cases define and defend
the chosen invariants; they do not claim the old quota code used a profile
timezone. The tests do not simulate host clock skew, tzdata deployment drift,
or a future account-timezone migration.

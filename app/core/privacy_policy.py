"""The privacy policy version users consent to, and what "still consented" means.

DPDP Act 2023 §6 requires a specific, informed, unambiguous consent action before
collecting personal data. "Informed" is about the *text* the user agreed to, so a
bare timestamp is not enough: it records that somebody clicked on a date, not
what they were shown. Both halves are stored on the user.

## Bumping the version

Raise ``CURRENT_POLICY_VERSION`` when the policy changes in a way a reasonable
person would want to re-consent to — a new recipient of their data, a new purpose,
a new retention rule. Every user whose stored version is older is then asked
again, on their next authenticated request, without being locked out.

Do **not** bump it for a typo fix or a rewording that changes no substance. The
prompt has a cost: shown too often it becomes something people click past, which
is the opposite of informed consent.

The value is a plain year-month string rather than a hash of the page, and that
is deliberate. A hash changes when the markup changes, so a CSS class rename
would re-prompt every user in the system.
"""
from __future__ import annotations

from datetime import datetime

# Bumped 2026-09-03: the policy gained the Ask Vinaadi / Anthropic PBC
# data-processor disclosure required by DPDP §9. That names a new recipient of
# user data outside India, which is squarely the kind of change consent is *for*.
CURRENT_POLICY_VERSION = "2026-09"


def consent_is_current(consent_given_at: datetime | None, consent_policy_version: str | None) -> bool:
    """Has this user consented, to the policy that is live now?

    False for both of the cases that matter and are easy to conflate:

    - never consented (registered before consent was recorded at all), and
    - consented to an older version.

    Callers get one boolean because the product response is identical — show the
    consent panel — and because a caller that had to distinguish them would
    eventually forget one.
    """
    if consent_given_at is None:
        return False
    return consent_policy_version == CURRENT_POLICY_VERSION


def consent_required_for(user: object) -> bool:
    """Should this user be shown the consent panel?

    Takes ``object`` and reads the columns with ``getattr`` rather than typing the
    parameter as ``User``: this module lives in ``app.core`` and importing
    ``app.models`` from here would invert the dependency direction for the sake of
    two attribute reads.

    The defaults matter as much as the lookup. A user object that somehow lacks
    these attributes reads as *not consented* and is asked — the fail-safe
    direction, since the opposite silently skips the ask.
    """
    return not consent_is_current(
        getattr(user, "consent_given_at", None),
        getattr(user, "consent_policy_version", None),
    )

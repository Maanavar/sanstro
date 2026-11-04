"""Every place Vinaadi keeps a person's data, and what erasure does to each (spec L5).

`TABLE_STORES` covers the database: one entry per (table, relationship to the
person). Each names the rows that are the person's (`where`, SQL with `:uid`),
what erasure does to them, how long they are kept, and what an export shows.
`EXTERNAL_STORES` covers processors outside the database; none of them is
erased through an API this app holds keys for, so each carries the manual step
and erasure lists it in its result and audit row.

Erasure runs `TABLE_STORES` in order, so a child table comes before the parent
its `where` reads through, and `users` comes last.

tests/test_privacy_erasure.py fails when a table that references `users`
(directly, through another table, or by a `*user_id` column without a foreign
key) has no entry here. That is the check that keeps this list whole; adding a
model is not finished until it has an entry.

What erasure does:
- delete — the rows go.
- detach — the rows stay and `detach_set` removes what ties them to the person:
  accounting records (orders, subscriptions; their payments and refunds stay
  untouched under `keep`), other people's rows that named this person, and the
  audit log (actor nulled, target rewritten to the erasure pseudonym, which the
  append-only trigger allows and nothing else).
- keep — the rows hold nothing personal once their parents are detached; they
  are counted so the audit row shows they were seen, and exported.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Erase = Literal["delete", "detach", "keep"]

#: The person's charts and family vaults, for the tables that hang off them.
_CHARTS = (
    "(SELECT c.chart_id FROM charts c JOIN birth_profiles b ON b.birth_profile_id = c.birth_profile_id"
    " WHERE b.owner_user_id = :uid)"
)
_PROFILES = "(SELECT birth_profile_id FROM birth_profiles WHERE owner_user_id = :uid)"
_VAULTS = "(SELECT family_vault_id FROM family_vaults WHERE owner_user_id = :uid)"
_ORDERS = "(SELECT id FROM orders WHERE user_id = :uid)"
_SUBSCRIPTIONS = "(SELECT subscription_id FROM subscriptions WHERE user_id = :uid)"
_PAYMENTS = f"(SELECT id FROM payments WHERE order_id IN {_ORDERS} OR subscription_id IN {_SUBSCRIPTIONS})"  # noqa: S608 — constants

#: Retention wording reused below. D-13 periods are pending legal review.
_UNTIL_ERASED = "Until the account is erased."
_ACCOUNTING = "Kept as an accounting record, detached from the person (period: pending the CA's answer)."


@dataclass(frozen=True)
class TableStore:
    key: str
    table: str
    holds: str
    where: str
    erase: Erase
    retention: str
    #: SET clause for `detach`.
    detach_set: str | None = None
    #: False: not exported (credentials, recomputable derivations, other people's rows).
    export: bool = True
    #: Columns left out of the export (secrets, hashes).
    export_exclude: frozenset[str] = frozenset()
    #: When set, the only columns exported.
    export_only: tuple[str, ...] | None = None


@dataclass(frozen=True)
class ExternalStore:
    key: str
    holds: str
    #: What a person must do after erasure; listed in the audit row.
    erase_step: str
    retention: str


_DERIVED = "Recomputable from the birth details; not exported."

TABLE_STORES: tuple[TableStore, ...] = (
    # ── Rows that point at another of the person's rows: before their parents.
    TableStore(
        "interpretation_outputs", "interpretation_outputs", "Generated readings for the person's charts and family.",
        f"chart_id IN {_CHARTS} OR family_vault_id IN {_VAULTS}", "delete", _UNTIL_ERASED,
    ),
    TableStore("chart_planets", "chart_planets", "Planet positions of the person's charts.",
               f"chart_id IN {_CHARTS}", "delete", _UNTIL_ERASED, export=False),
    TableStore("dasha_periods", "dasha_periods", "Dasha timeline of the person's charts.",
               f"chart_id IN {_CHARTS}", "delete", _UNTIL_ERASED, export=False),
    TableStore("varga_positions", "varga_positions", "Divisional chart positions.",
               f"chart_id IN {_CHARTS}", "delete", _UNTIL_ERASED, export=False),
    TableStore("peyarchi_alerts", "peyarchi_alerts", "Transit alerts for the person's charts.",
               f"chart_id IN {_CHARTS}", "delete", _UNTIL_ERASED, export=False),
    TableStore("prediction_log", "prediction_log", "Predictions made for the person's charts.",
               f"chart_id IN {_CHARTS}", "delete", _UNTIL_ERASED),
    TableStore("user_life_events", "user_life_events", "Life events the person recorded.",
               f"chart_id IN {_CHARTS}", "delete", _UNTIL_ERASED),
    TableStore("user_contexts", "user_contexts", "Life situation the person described.",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("user_goals", "user_goals", "Goals the person set.", "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("journal_entries", "journal_entries", "The person's journal.",
               "owner_user_id = :uid", "delete", "As the person's journal retention setting, or until erased."),
    TableStore("retrospective_entries", "retrospective_entries", "Past events the person recorded.",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("numerology_name_sessions", "numerology_name_sessions", "Names the person tried in numerology.",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("daily_scores", "daily_scores", "Daily scores for the person's birth profiles.",
               f"birth_profile_id IN {_PROFILES}", "delete", _UNTIL_ERASED, export=False),
    TableStore("charts", "charts", "The person's computed charts.",
               f"birth_profile_id IN {_PROFILES}", "delete", _UNTIL_ERASED),
    TableStore("family_daily_scores", "family_daily_scores", "Family day scores.",
               f"family_vault_id IN {_VAULTS}", "delete", _UNTIL_ERASED, export=False),
    TableStore("relationship_alerts", "relationship_alerts", "Alerts between family members.",
               f"vault_id IN {_VAULTS}", "delete", _UNTIL_ERASED),
    TableStore("birth_profiles", "birth_profiles", "Birth date, time and place (encrypted at rest).",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("family_members", "family_members", "Family members the person added, with their birth details.",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("family_vaults", "family_vaults", "The person's family groups.",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore(
        "notification_deliveries", "notification_deliveries", "Delivery attempts of the person's notifications.",
        "notification_id IN (SELECT notification_id FROM notifications WHERE user_id = :uid)", "delete",
        _UNTIL_ERASED, export=False,
    ),
    TableStore("notifications", "notifications", "Notifications sent to the person.",
               "user_id = :uid", "delete", _UNTIL_ERASED),
    # ── Rows that point straight at the account.
    TableStore("user_preferences", "user_preferences", "App preferences.",
               "owner_user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore(
        "user_notification_preferences", "user_notification_preferences", "Notification settings and push token.",
        "owner_user_id = :uid", "delete", _UNTIL_ERASED, export_exclude=frozenset({"fcm_device_token"}),
    ),
    TableStore(
        "consent_records", "consent_records",
        "Consent answers per purpose: what was agreed, to which notice version, when, in which language, from which IP.",
        "user_id = :uid", "delete", _UNTIL_ERASED,
    ),
    TableStore("user_streaks", "user_streaks", "Visit streak.", "user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("life_focus_events", "life_focus_events", "Life areas the person focused on.",
               "user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("ask_vinaadi_usage", "ask_vinaadi_usage", "Daily Ask Vinaadi question counts.",
               "user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore(
        "porutham_shares", "porutham_shares", "Porutham results the person shared by link.",
        "owner_user_id = :uid", "delete", "Until the link expires or the account is erased.",
        export_exclude=frozenset({"token_hash"}),
    ),
    TableStore(
        "device_tokens", "device_tokens", "Push tokens of the person's devices.",
        "user_id = :uid", "delete", _UNTIL_ERASED, export_exclude=frozenset({"fcm_token"}),
    ),
    TableStore("feedback", "feedback", "Feedback and reviews the person wrote.",
               "user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("entitlements", "entitlements", "Trials, purchases and grants.",
               "user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("credit_ledger", "credit_ledger", "Bought and spent credits.",
               "user_id = :uid", "delete", _UNTIL_ERASED),
    TableStore("refresh_tokens", "refresh_tokens", "Signed-in sessions.",
               "user_id = :uid", "delete", "Until expiry or erasure.", export_exclude=frozenset({"token_hash"})),
    TableStore("password_reset_tokens", "password_reset_tokens", "Password reset links (hashed).",
               "user_id = :uid", "delete", "Until used or expired.", export=False),
    TableStore("admin_mfa_credentials", "admin_mfa_credentials", "Admin authenticator secret.",
               "user_id = :uid", "delete", _UNTIL_ERASED, export=False),
    TableStore("admin_recovery_codes", "admin_recovery_codes", "Admin recovery codes (hashed).",
               "user_id = :uid", "delete", _UNTIL_ERASED, export=False),
    TableStore(
        "newsletter_subscribers", "newsletter_subscribers", "Newsletter sign-up under the account's email.",
        "lower(email) = (SELECT lower(email) FROM users WHERE user_id = :uid)", "delete", _UNTIL_ERASED,
    ),
    # ── Accounting records: kept, detached. Payments and refunds carry no
    # personal field; they are reached through the order or subscription, so
    # they are counted (and exported) before those are detached.
    TableStore("payments", "payments", "Payments the person made.",
               f"order_id IN {_ORDERS} OR subscription_id IN {_SUBSCRIPTIONS}", "keep", _ACCOUNTING),
    TableStore("refunds", "refunds", "Refunds of the person's payments.",
               f"payment_id IN {_PAYMENTS}", "keep", _ACCOUNTING),
    TableStore("orders", "orders", "One-time purchases.", "user_id = :uid", "detach", _ACCOUNTING,
               detach_set="user_id = NULL"),
    TableStore("subscriptions", "subscriptions", "Premium subscriptions.", "user_id = :uid", "detach", _ACCOUNTING,
               detach_set="user_id = NULL"),
    TableStore(
        "webhook_events", "webhook_events", "Payment-provider events resolved to the account.",
        "resolved_user_id = :uid OR provider_app_user_id = :uid_text", "detach",
        "Kept with the accounting records, detached.",
        detach_set="resolved_user_id = NULL, provider_app_user_id = NULL",
    ),
    # ── Other people's rows that name this person: the name goes, the row stays.
    TableStore(
        "family_members.managed_by", "family_members", "Another account's family member this person managed.",
        "managed_by_user_id = :uid AND owner_user_id <> :uid", "detach", "The owner's.",
        detach_set="managed_by_user_id = NULL", export=False,
    ),
    TableStore("entitlements.granted_by", "entitlements", "Grants this person made as an admin.",
               "granted_by = :uid", "detach", "The recipient's.", detach_set="granted_by = NULL", export=False),
    TableStore("runtime_settings.updated_by", "runtime_settings", "Settings this person last changed as an admin.",
               "updated_by_user_id = :uid", "detach", "Kept.", detach_set="updated_by_user_id = NULL", export=False),
    TableStore("runtime_setting_changes.actor", "runtime_setting_changes", "Setting changes this person made.",
               "actor_user_id = :uid", "detach", "Kept.", detach_set="actor_user_id = NULL", export=False),
    TableStore(
        "admin_audit_log.actor", "admin_audit_log", "Admin actions this person took.",
        "actor_user_id = :uid", "detach", "3 years (D-13, pending legal).",
        detach_set="actor_user_id = NULL, actor_email = NULL", export=False,
    ),
    TableStore(
        "admin_audit_log.target", "admin_audit_log", "Admin actions taken on this account.",
        "target_type = 'user' AND target_id = :uid_text", "detach",
        "3 years (D-13, pending legal), under the erasure pseudonym.",
        detach_set="target_id = :pseudonym", export_only=("action", "outcome", "created_at"),
    ),
    # ── The account itself: last.
    TableStore(
        "users", "users",
        "Email, sign-in, consent stamp, 18+ declaration, first-touch source, referral code, "
        "last-seen day with the client and language it used.",
        "user_id = :uid", "delete", _UNTIL_ERASED, export_exclude=frozenset({"hashed_password", "token_version"}),
    ),
)

EXTERNAL_STORES: tuple[ExternalStore, ...] = (
    ExternalStore(
        "posthog", "Web analytics events under the account id (posthog.identify).",
        "Delete the person in PostHog (Persons → search the account id → Delete person and events).",
        "PostHog project retention.",
    ),
    ExternalStore(
        "sentry", "Mobile error reports tagged with the account id.",
        "Delete the account id's events in Sentry, or let them age out.", "Sentry plan retention.",
    ),
    ExternalStore(
        "anthropic", "Ask Vinaadi questions and chart context sent to the model.",
        "Nothing this app can request; the provider's API logs age out on its own schedule.",
        "Provider's API log retention.",
    ),
    ExternalStore(
        "email_provider", "Delivery logs of emails sent to the address.",
        "Remove the address from the SMTP provider's suppression and log views if it offers one.",
        "Provider's log retention.",
    ),
    ExternalStore(
        "zoho_desk", "Support tickets from the address.",
        "Search Zoho Desk by the email and delete or anonymise the tickets.", "Until deleted.",
    ),
    ExternalStore(
        "razorpay", "Payer contact details on Razorpay's side of each payment.",
        "None: Razorpay keeps them as a regulated payment record.", "Razorpay's statutory retention.",
    ),
    ExternalStore(
        "app_store_subscription", "An App Store / Play subscription bought in the mobile app.",
        "Tell the person to cancel it in the store: the store keeps billing whatever happens here.",
        "The store's.",
    ),
)


def registered_tables() -> frozenset[str]:
    return frozenset(store.table for store in TABLE_STORES)

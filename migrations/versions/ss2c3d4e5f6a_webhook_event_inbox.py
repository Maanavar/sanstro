"""Webhook event inbox, and a subscription identity that is actually an identity

A05 (2026-10-07). Additive: one new table, two new nullable columns, two new
indexes. No backfill and no data rewrite.

WHY NO BACKFILL IS NEEDED, checked rather than assumed
------------------------------------------------------
The implementation guide cautions that a uniqueness migration should come only
after inspecting and resolving duplicate existing rows with a reviewed policy.
That caution presumes rows exist. `subscriptions` was inspected before this was
written:

    SELECT count(*), count(DISTINCT user_id) FROM subscriptions;  -> 0, 0
    users with more than one subscription row                      -> 0

So there is nothing to deduplicate, nothing to reinterpret, and no honest value
to backfill into the new columns. That is also why `provider_subscription_id`
could be *corrected* in place rather than renamed around: the webhook handler
had been writing `product_id` into it, and with zero rows no stored value is
being redefined.

WHAT THE NEW COLUMNS ARE FOR
----------------------------
`provider_product_id`      — the SKU, which is what `provider_subscription_id`
                             wrongly held. A product is not a subscription.
`provider_event_timestamp` — `event_timestamp_ms` of the most recent event
                             applied to the row. The ordering guard: without
                             it, a late-arriving older expiration deactivated a
                             renewed subscription, because the handler had no
                             way to know the event described an earlier moment.

Both nullable, because a row written before an event carried a timestamp has no
value to state and NULL is what "unknown" says.

THE UNIQUE CONSTRAINT IS THE IDEMPOTENCY GUARANTEE
--------------------------------------------------
`uq_webhook_events_provider_event_id` is not an optimisation. RevenueCat
documents that a retry reuses the same event `id`, so duplicate delivery is a
contract guarantee; a prior SELECT would let two concurrent deliveries both
pass, and only the database can arbitrate. The handler relies on the conflict,
not on a check.

`ix_subscriptions_provider_subscription` is deliberately NOT unique. Making it
unique would be the right end state and is a decision about provider
guarantees this migration does not presume: a store can reissue an
`original_transaction_id` across environments (sandbox vs production), and
being wrong about that would reject real events at the database layer. The
handler already looks up by it and falls back to the owning account.

Reversible. `downgrade()` drops the index, the columns and the table, losing
only the inbox history and the ordering guard's state.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "ss2c3d4e5f6a"
down_revision = "rr1b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "webhook_events",
        sa.Column("webhook_event_id", sa.Uuid(), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("event_id", sa.Text(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("event_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("provider_app_user_id", sa.Text(), nullable=True),
        sa.Column("resolved_user_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        # JSONB, not JSON: it is queried during reconciliation ("which
        # unresolved events name this product"), and JSON has no useful
        # operators or indexes for that.
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("webhook_event_id"),
        sa.UniqueConstraint("provider", "event_id", name="uq_webhook_events_provider_event_id"),
    )
    op.create_index(
        "ix_webhook_events_resolved_user_id", "webhook_events", ["resolved_user_id"], unique=False
    )
    # Operators ask "what is stuck or unreconciled", which is a scan over
    # status ordered by arrival.
    op.create_index(
        "ix_webhook_events_status_created", "webhook_events", ["status", "created_at"], unique=False
    )

    op.add_column("subscriptions", sa.Column("provider_product_id", sa.Text(), nullable=True))
    op.add_column(
        "subscriptions",
        sa.Column("provider_event_timestamp", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_subscriptions_provider_subscription",
        "subscriptions",
        ["provider", "provider_subscription_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_subscriptions_provider_subscription", table_name="subscriptions")
    op.drop_column("subscriptions", "provider_event_timestamp")
    op.drop_column("subscriptions", "provider_product_id")
    op.drop_index("ix_webhook_events_status_created", table_name="webhook_events")
    op.drop_index("ix_webhook_events_resolved_user_id", table_name="webhook_events")
    op.drop_table("webhook_events")

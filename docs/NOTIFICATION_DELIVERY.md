# Notification delivery runbook

Vinaadi stores the in-app notification intent in `notifications` and one
external delivery per selected channel in `notification_deliveries`. Intent
creation and external I/O are separate transactions: a provider is never called
until the intent has committed.

## Guarantee and expiry

- Delivery is **at least once while the intent is live**.
- Every new intent has a deterministic `logical_key` and an `expires_at`.
- Daily guidance, dasha-transition, and Pirantha Naal pushes expire at the end
  of the recipient's local civil day.
- Expired work is marked `expired` and is never sent externally. The intent
  remains visible in the in-app inbox.
- FCM and SMTP do not expose a compatible idempotency key. If a provider accepts
  a request and the worker dies before the outcome commit, claim recovery can
  send a duplicate. The system deliberately states this residual ambiguity; it
  does not claim exactly-once delivery.

## State model

`pending`/`retry` deliveries are atomically claimed in bounded batches with
`FOR UPDATE SKIP LOCKED`. A committed `claimed` row has an expiry. A later worker
may recover it after that expiry. The claim token fences a stale worker from
overwriting the newer owner's result.

Terminal states are `delivered`, `expired`, `suppressed`, `failed_permanent`,
and `exhausted`. Push and email advance independently, so a delivered push is
not repeated merely because email needs a retry. Transient failures use bounded
exponential backoff with deterministic jitter and stop after five attempts.

## Operational checks

The dedicated scheduler runs `notification_outbox` every minute. Investigate:

```sql
SELECT status, count(*)
FROM notification_deliveries
GROUP BY status
ORDER BY status;

SELECT min(next_attempt_at) AS oldest_due_retry
FROM notification_deliveries
WHERE status IN ('pending', 'retry');

SELECT delivery_id, notification_id, channel, attempt_count, last_error_code,
       next_attempt_at, claim_expires_at
FROM notification_deliveries
WHERE status IN ('exhausted', 'failed_permanent')
ORDER BY updated_at DESC
LIMIT 100;
```

An old `claimed` row is recoverable after `claim_expires_at`; do not manually
rewrite it while a worker may still be running. Replaying an exhausted delivery
is an operator decision: confirm the intent is still relevant and not expired,
then reset only that delivery to `retry` with a reviewed `next_attempt_at`.
Never bulk-replay historical `queued` or `failed` notification rows created
before the outbox migration.

# SEC-1 · Secret custody — architecture ruling

**Date:** 2026-09-03
**Status:** **RULED — approved with changes.** Supersedes the "blocked on a human
choice" note in [`P2_BACKLOG_HANDOFF.md`](P2_BACKLOG_HANDOFF.md) §8 and
[`PRODUCTION_EDGE.md`](PRODUCTION_EDGE.md) §4.
**Decision owner:** repository owner.

SEC-1 was the sixth and only unshipped part of P1-5. It was held open on the
grounds that the implementation is determined by the deployment target. That is
still true of the *destination*, but it was hiding a set of controls that do not
depend on the target at all and should have been done already. This document
records the ruling, corrects two premises that were wrong when it was made, and
lists the work in the order it should happen.

---

## 1. The ruling

> Vinaadi will not deploy HashiCorp Vault at the current scale. While deployed as
> a single Docker Compose installation, secrets will be removed from generic
> `.env` distribution and granted only to services that require them, preferably
> through file-mounted Compose secrets. `JOTHIDAM_ENCRYPTION_KEYS` is classified
> as a persistent data-encryption root secret and must have independent escrow,
> version retention, documented rotation and tested database-restore recovery.
>
> When Vinaadi moves to a supported cloud runtime, secret custody will migrate to
> the provider's managed Secret Manager/KMS using workload identity rather than
> static cloud credentials. Encryption-key retirement must be coordinated with
> database backup retention; no historical key may be destroyed while a retained
> backup may still require it.
>
> Application configuration should support `*_FILE` secret sources rather than
> converting mounted secrets back into environment variables.

**Offline encryption-key escrow and a tested restore are an S0 pre-launch
blocker**, not a security improvement to schedule later.

---

## 2. Two problems, not one

"Secret management" conflates two things with different answers:

- **Distribution** — getting a value into a process without leaving a plaintext
  file readable by everything on the box. Applies to all eight secrets. Real but
  bounded benefit.
- **Custody** — ensuring one irreplaceable key survives, carries version history,
  and has restricted, auditable access. Applies to exactly one secret.

Most of the value in SEC-1 is custody. Almost all of the machinery people reach
for (Vault, orchestrators) is distribution. That mismatch is why this item sat
open: the expensive options solve the cheaper half of the problem.

---

## 3. Secret classification

Controls are strongest for Class A, not uniformly heavy for everything.

| Class | Vinaadi secrets | Lifecycle | Primary requirement |
|---|---|---|---|
| **A — Data encryption** | `JOTHIDAM_ENCRYPTION_KEYS` / `JOTHIDAM_ENCRYPTION_KEY` | preserve indefinitely → version → rotate without losing decryptability | Durability, version retention, recovery, restricted access |
| **B — Authentication / signing** | `JOTHIDAM_JWT_SECRET`, `JOTHIDAM_ADMIN_API_KEY`, `JOTHIDAM_REVENUECAT_WEBHOOK_SECRET` | compromise → revoke → replace | Rotation + access control |
| **C — External service credentials** | `POSTGRES_PASSWORD` (inside `JOTHIDAM_DATABASE_URL`), `JOTHIDAM_ANTHROPIC_API_KEY`, `JOTHIDAM_SMTP_USER` / `..._PASS`, `JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON` | compromise → revoke at issuer → replace | Easy revocation + rotation |

Class B and C are recoverable by definition. Rotating `JOTHIDAM_JWT_SECRET` logs
everyone out; that is the entire cost. Class A has no reset path — the rows stay
in the database as ciphertext and there is no flow that recovers them.

---

## 4. Corrections to the analysis this ruling was made against

Recorded so the next reader does not inherit a premise that was already wrong.

| Claimed | Actually |
|---|---|
| Secrets are injected into `api`, `worker` **and `web`** | Wrong. [`docker-compose.app.yml:127-133`](../docker-compose.app.yml) gives `web` only `NODE_ENV`, `API_BASE_URL`, `TRUSTED_PROXY_HOPS_BEFORE_WEB`. No secret reaches the web container. |
| "Why does every container receive every secret?" | Narrower than stated. `worker` receives `JOTHIDAM_JWT_SECRET` and `JOTHIDAM_ADMIN_API_KEY` while running only the APScheduler loop ([`app/worker.py`](../app/worker.py)). `api` legitimately needs all of them. |
| Per-service least privilege is a compose change | Not only. `_require_strong_secrets_in_production` in [`app/core/config.py:140-143`](../app/core/config.py) requires `jwt_secret` and `admin_api_key` in production **unconditionally**, so a worker started without them refuses to boot. The validator has to become process-aware first. |
| "Every option ends at 'the process has the value in its environment'" | Rejected by this ruling. See §6. |
| The rotation script's completion proves migration | It does not. See §8. |
| "Every option ends at the env var" implies `Settings` needs no change | `Settings` needs a small, deliberate change to accept `*_FILE`. That is a security abstraction, not a config refactor. |

---

## 5. Stage 1 — now, independent of any deployment target

None of this is blocked on choosing a cloud. All of it should exist before launch.

### 5.1 Escrow the encryption key (S0 blocker)

Two independent recovery copies, neither co-located with the database backups:

```
PRIMARY          the running deployment's secret store
RECOVERY COPY A  password-manager emergency vault
RECOVERY COPY B  encrypted offline recovery package, stored separately
```

The anti-pattern to avoid explicitly: the key and the database backup on the same
host. That combination makes the encryption decorative against exactly the threat
it exists for.

Maintain a key register recording, **never the key material itself**:

```
key ID
creation date
activation date
retirement date
fingerprint / checksum
last recovery-test date
```

### 5.2 Per-service secret grants

Move from `.env` interpolation into `environment:` to file-backed Compose
secrets granted per service. Use a `file:` source — Compose also accepts an
`environment:` source for secrets, which would defeat the purpose.

Prerequisite, now met: the production secret validator is process-aware
(`JOTHIDAM_PROCESS_ROLE`, defaulting to `api` so an unset role demands *more*),
which is what lets the worker drop `JWT_SECRET` / `ADMIN_API_KEY` (§4).

**As built.** The base `docker-compose.app.yml` no longer hands the worker either
Class B secret. The file-backed path is `docker-compose.secrets.yml`, layered on
top:

```
docker compose -f docker-compose.app.yml -f docker-compose.secrets.yml up -d
```

One thing that had to change to make the overlay usable: the base file's
`${JOTHIDAM_JWT_SECRET:?…}` guards are gone. Compose interpolates each file at
load time, *before* overlays merge, so a `:?` in the base file fires even when
the overlay is supplying that value from `/run/secrets` — which would have forced
the plaintext to stay in `.env`, defeating the whole overlay. Nothing is lost:
`app/core/config.py` refuses to boot in production without them, and unlike
compose it knows about the `_FILE` channel and about roles. The failure moves
from `compose up` to a container that exits immediately with a named error.

Applied matrix:

| Secret | api | worker | web |
|---|---|---|---|
| `JOTHIDAM_DATABASE_URL` | ✓ | ✓ | ✗ |
| `JOTHIDAM_ENCRYPTION_KEYS` | ✓ | ✓ | ✗ |
| `JOTHIDAM_JWT_SECRET` | ✓ | ✗ **removed** | ✗ |
| `JOTHIDAM_ADMIN_API_KEY` | ✓ | ✗ **removed** | ✗ |
| `JOTHIDAM_ANTHROPIC_API_KEY` | ✓ | ✓ if a job calls it | ✗ |
| `JOTHIDAM_REVENUECAT_WEBHOOK_SECRET` | ✓ | ✗ | ✗ |
| `JOTHIDAM_SMTP_PASS` | ✓ | ✓ if a job sends mail | ✗ |

### 5.3 What Compose secrets do and do not buy

They do not encrypt anything. A `file:`-backed Compose secret is a bind mount, so
the host still holds plaintext at `./secrets/<name>`. What changes is the exposure
path:

```
.env today                        Compose secret
──────────                        ──────────────
host .env (broad perms)           restricted host file
  → compose interpolation           → read-only mount
  → container environment           → /run/secrets/<name>
  → docker inspect                  → application
  → /proc/<pid>/environ
  → application
```

The value leaves `docker inspect` and the process environment, file permissions
can be tightened, and grants become per-service. It gives you nothing on
rotation, audit, or backup — which is why §5.1 is the part that actually matters.

### 5.4 Controls worth more than "no secrets on disk"

There is no regulatory requirement forcing secrets off disk here, and imposing
one would buy architecture without moving the dominant risks. These move them:

```
no secrets in Git
no secrets baked into Docker images
no broad container distribution
no secrets in logs
restricted host access
off-host backups
durable key escrow
versioned rotation
tested recovery
```

---

## 6. `*_FILE` support — the interface change

The earlier analysis asserted that every option ends with the value in the
process environment and that `Settings` therefore needs no change. **That is
rejected.** Exporting a mounted secret back into the environment puts it into
`/proc/<pid>/environ` and discards the containment that mounting it earned:

```
secret store → /run/secrets/key → entrypoint exports ENV → Python     (worse)
secret store → /run/secrets/key → Python reads the file              (better)
```

Support both forms. `JOTHIDAM_ENCRYPTION_KEYS` continues to work; so does
`JOTHIDAM_ENCRYPTION_KEYS_FILE=/run/secrets/jothidam_keys`.

**Implementation note that matters:** a free-standing `get_secret()` helper does
not reach `Settings`, and `settings.encryption_key` would keep reading the plain
env var. This belongs as a `model_validator(mode="before")` on `Settings` that,
for any field, fills the value from `<JOTHIDAM_FIELD>_FILE` when that path is
set. Ordinary non-secret configuration stays in environment variables.

**As built** (`_load_file_backed_secrets` in `app/core/config.py`):

- Any field, not just secrets — `JOTHIDAM_<FIELD>_FILE` works for all of them.
  Only the model's own fields; a stray `FOO_FILE` in the environment is not ours
  to interpret.
- Contents are whitespace-stripped. `echo key > file` is how these get written,
  and a Fernet key with a newline on the end is not a Fernet key.
- An unreadable path and an **empty file** both fail at boot, naming the variable
  and the path. A zero-byte secret file is a mount that did not work; booting on
  it defers the failure to first use, which for the encryption key means writing
  rows under a key nobody holds.
- Setting both channels to **different** values is refused — there is no rule
  anyone would guess about which wins. Identical values are allowed, because that
  is what a half-finished migration looks like.
- No error message contains key material. See the second defect in §11.

`app/core/encryption.py` and its `MultiFernet` contract need no change either
way — `configured_keys()` reads `settings`, not `os.environ`.

---

## 7. Stage 2 — managed secret service, once hosting is final

The architectural win is not the secret database. It is the bootstrap chain:

```
workload  ──(short-lived machine identity)──►  cloud IAM  ──►  Secret Manager / KMS
```

No long-lived credential is needed to retrieve another credential. Cost is not a
factor at this scale — AWS Secrets Manager is ~$0.40/secret/month plus API usage,
GCP Secret Manager includes six active versions free and is ~$0.06/version/month
after. Topology decides this, not price.

**The VPS caveat holds.** If Vinaadi stays on a generic VPS (Hetzner,
DigitalOcean) and reaches out to AWS Secrets Manager, the box needs a static
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — a bootstrap secret replacing the
one being removed. You still gain central rotation, version management, access
logs, IAM policy and less persistent secret material on the host, but the root
credential problem is relocated, not solved. On a single self-hosted VPS, prefer
Compose secrets plus strong offline escrow (§5) over adding a cloud secret
manager for its own sake.

**Vault is out at this scale.** It is a security system that must itself be
secured: storage, backups, availability, authentication, policies, TLS, recovery
keys, upgrades, monitoring, incident response — and its own unseal/recovery keys
inherit exactly the escrow problem being solved. Revisit when there are several
production environments, multiple engineering teams, hundreds of secrets, dynamic
credentials, PKI issuance, short-lived DB credentials, or cross-cloud workloads.

---

## 8. Rotation — four stages, and the missing VERIFY

The three-step process in [`app/core/encryption.py`](../app/core/encryption.py)
is correct as far as it goes. It becomes four:

```
1. ADD         Add K2 while K1 remains usable.
2. SWITCH      K2 becomes the encryption key for all new writes.
3. RE-ENCRYPT  Migrate K1 ciphertext → K2.
4. VERIFY + RETIRE
               Prove no record requires K1. Back up. Only then retire K1.
```

Stages 1 and 2 are the same deploy today, because `MultiFernet` encrypts with
index 0 and `JOTHIDAM_ENCRYPTION_KEYS` is newest-first. Keeping them named
separately is still worth it — it makes "did new writes actually switch?" a
question with an answer.

### VERIFY does not exist yet and needs code

`scripts/rotate_encryption_key.py` calls `rotate_bytes` on every non-null value
and increments a counter per rewrite. It has **no per-key accounting**: it cannot
distinguish a row already under K2 from one migrated K1→K2, and `MultiFernet.rotate`
succeeds silently under any configured key. Its closing line — "It is now safe to
drop the old key" — is therefore an assumption, not a finding.

A verification pass must build a **single-key** `Fernet(K2)` (not the `MultiFernet`)
and attempt `decrypt()` on each stored value, counting failures. Only that answers
the retirement question. Target output:

```
Total encrypted fields scanned:     184,212
Already K2:                          28,901
Migrated K1 → K2:                   155,311
Unreadable:                               0
Still requiring K1:                       0
```

Retirement is permitted only on `Still requiring K1 == 0`, and only after a backup
taken at that point.

The column list in `ENCRYPTED_COLUMNS` is already guarded — `tests/test_encryption_rotation.py`
asserts it matches model metadata plus the hand-encrypted columns — so the
verification pass should reuse that list rather than growing a second one.

### Retiring a key is not destroying it

The rule that was missing entirely:

```
old key retention  >=  old database backup retention
```

Retiring K1 from active decryption is not the same act as destroying K1. A
database backup taken before the rotation still contains K1 ciphertext; restoring
it after K1 has been destroyed produces an unreadable database. If backups are
retained 90 days, K1 stays in restricted archival escrow for at least 90 days
past the rotation, then is destroyed on a dated, recorded action.

### Key identity

`JOTHIDAM_ENCRYPTION_KEYS` uses array position as key identity. It works, and it
is not worth changing before launch. Architecturally, explicit key IDs are
stronger:

```json
{ "active": "v3", "keys": { "v3": "…", "v2": "…", "v1": "…" } }
```

The application still flattens this to `[v3, v2, v1]` internally. The gain is that
`encrypted_with=v3` becomes loggable without logging key material, and a future
ciphertext format of `v3:<fernet-token>` would remove trial decryption entirely.
Recorded as a direction, not a task.

---

## 9. Threat model — stated plainly

The docstring in `app/core/encryption.py` already says this and the privacy-facing
copy must not overstate it.

**Field-level encryption protects well against:**

```
database-only compromise
a stolen SQL dump
a misplaced database snapshot
backup exposure
a storage administrator without application-key access
```

**It does not protect against:**

```
root compromise of the application host
remote code execution inside the API process
malicious code running with application privileges
a debug dump containing plaintext
an authorised application user abusing decryption
```

The key lives in the environment of the process that holds the data. Anyone who
owns that process owns both.

### Envelope encryption — the eventual upgrade

Not a launch item, recorded as the destination:

```
KMS master key ──encrypts──► per-record data key ──encrypts──► sensitive field
```

The database stores `encrypted_data` and `encrypted_data_key`; the master key
never leaves KMS. This is materially stronger custody than holding a raw master
key in application config, and AWS KMS / Cloud KMS / Key Vault are built for it.
Revisit alongside Stage 2, never as a reason to delay launch.

---

## 10. Go-live checklist replacement

The single line `[ ] JOTHIDAM_ENCRYPTION_KEY is set and backed up securely` is
replaced in [`launch/GO_LIVE_CHECKLIST.md`](launch/GO_LIVE_CHECKLIST.md) by the
S0 block:

```
[ ] Encryption key escrow exists in >= 2 independent locations
[ ] Database backup exists
[ ] Encryption key and DB backup are NOT stored together
[ ] Restore procedure has been tested end to end
[ ] A restored encrypted birth profile decrypts successfully
[ ] A restored journal entry decrypts successfully
[ ] Old-key recovery has been tested after a rotation
```

A backup that has never been restored is an assumption, not a backup.

---

## 11. Work items

| # | Item | Stage | Status |
|---|---|---|---|
| 1 | Encryption-key escrow, two independent copies + key register | 1 (S0) | **Open — owner only.** Acts on real key material on the production host. |
| 2 | Restore test: restore a backup, decrypt a birth profile and a journal entry | 1 (S0) | **Open — owner only.** Needs item 1 and a real backup. |
| 3 | Replace the go-live checklist line with the S0 block (§10) | 1 | **Done** — `089ab8d` |
| 4 | `*_FILE` support on `Settings` via `model_validator(mode="before")` | 1 | **Done** — §6 |
| 5 | Make the production secret validator process-aware so the worker can drop Class B secrets | 1 | **Done** — §5.2 |
| 6 | File-backed Compose secrets with per-service grants (§5.2) | 1 | **Done** — `docker-compose.secrets.yml` |
| 7 | VERIFY pass in `rotate_encryption_key.py`: single-key `Fernet(K2)` decrypt census | 1 | **Done** — §8 |
| 8 | Document key-retention ≥ backup-retention in `DATA_PROTECTION.md` | 1 | **Done** |
| 9 | Migrate custody to the provider's Secret Manager/KMS with workload identity | 2 | Open — hosting decision |
| 10 | Explicit key IDs; envelope encryption via KMS | later | Open — after item 9 |

Items 1, 2 and 7 are the ones that prevent permanent data loss. Items 4–6 reduce
exposure breadth. Item 9 is the only one that genuinely needed the hosting answer,
which is why holding all of SEC-1 behind it was the wrong call.

**Items 1 and 2 are the whole remaining S0 surface.** Nothing in the code can
substitute for them: the verify pass proves a rotation is complete, and the
per-service grants narrow who holds what, but neither puts a second copy of the
key somewhere the production host's disk failure cannot reach.

### Two defects found while building Stage 1

Both pre-existing, neither in the ruling, both fixed here:

- **The `scaled` compose profile could not boot in production at all.** The
  worker service sets `JOTHIDAM_ENVIRONMENT=production`, the image carries no
  `.env`, so `cookie_secure` defaulted false and the production check rejected
  it — a cookie setting blocking a process that serves no cookies. Found by
  asking which secrets the worker legitimately needs. Pinned by
  `test_worker_boots_in_production_without_cookie_secure`.
- **Every config failure printed the secrets it was given.** Pydantic converts a
  `ValueError` raised inside a validator into a `ValidationError` carrying
  `input_value=` — the whole settings dict. So a misconfigured production boot
  wrote every secret that *was* set into the log, at exactly the moment an
  operator would be pasting that log somewhere. Config failures now raise
  `RuntimeError`, which pydantic propagates untouched. Pinned by
  `test_production_secret_error_does_not_echo_the_values`.

---

## Related

- [`PRODUCTION_EDGE.md`](PRODUCTION_EDGE.md) §4–5 — the original write-up
- [`P2_BACKLOG_HANDOFF.md`](P2_BACKLOG_HANDOFF.md) §8 — SEC-1's backlog entry
- [`DATA_PROTECTION.md`](DATA_PROTECTION.md) — rotation procedure
- [`app/core/encryption.py`](../app/core/encryption.py) — key ownership, `MultiFernet` contract
- [`scripts/rotate_encryption_key.py`](../scripts/rotate_encryption_key.py) — re-encryption pass
- [`launch/GO_LIVE_CHECKLIST.md`](launch/GO_LIVE_CHECKLIST.md) — §5 production secrets

# Vinaadi Admin Console — Full Implementation Spec

**Branch target:** `harden/admin-full-control`  
**Base branch:** `main`  
**Last updated:** 2026-06-16

---

## Context for the implementing agent

This document is a complete, self-contained implementation plan for the Vinaadi AI
admin console. Every section specifies exact file paths, code patterns, schema
shapes, and acceptance criteria. Follow each phase in order; do not skip phases.

### Repo root (Windows, PowerShell)

```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

All relative paths in this document are relative to that root.

### Existing admin foundation (do not change these)

| File | What it does |
|---|---|
| `app/core/auth.py` | `get_admin_user` dependency — requires valid JWT **and** `X-Admin-Key` header |
| `app/api/admin.py` | `GET /admin/stats`, `DELETE /admin/users/{id}/data`, `POST /admin/run-peyarchi-refresh` |
| `app/api/feedback.py` | `GET /feedback` (admin), `PATCH /feedback/{id}/reward` (admin) |
| `app/api/qa.py` | Admin-only QA golden test endpoints |
| `web/components/admin-console.tsx` | Frontend console — 4 tabs: Overview, Feedback, Operations, Privacy |
| `web/app/admin/page.tsx` | Next.js route that renders `AdminConsole` |
| `app/core/config.py` | `admin_api_key`, `enable_admin_data_delete` settings |
| `app/main.py` | All routers registered here |

### Auth pattern (copy exactly)

Every new admin endpoint must use this dependency signature:

```python
from app.core.auth import get_admin_user
from app.models.user import User
from fastapi import Depends

@router.get("/admin/something")
def my_endpoint(_: User = Depends(get_admin_user)) -> MyResponse:
    ...
```

### Frontend fetch pattern (copy exactly)

All frontend admin API calls must use the existing `adminFetchJson` helper already
defined in `web/components/admin-console.tsx` lines 64–99. Do not create a separate
fetch utility.

```typescript
const result = await adminFetchJson<MyType>("/api/v1/admin/my-endpoint", adminKey);
```

### Shell commands

Use PowerShell. Chain with `;` not `&&`. Set encoding before Python:

```powershell
$env:PYTHONIOENCODING = "utf-8"; $env:PYTHONUTF8 = "1"
```

---

## Phase 1 — User Management

**Goal:** Give admin full visibility and control over user accounts.

### 1.1 — DB migration: add suspension fields to `users` table

**File to create:** `alembic/versions/<timestamp>_add_user_suspension.py`

Use `alembic revision --autogenerate -m "add_user_suspension"` then verify the
generated migration adds exactly these two columns. If autogenerate misses them,
write them manually:

```python
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.add_column("users", sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("suspension_reason", sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "is_suspended")
```

Apply to test DB:

```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
alembic upgrade head
```

### 1.2 — Update User model

**File:** `app/models/user.py`

Add two fields after `goal_track`:

```python
is_suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
suspension_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
```

Add `from sqlalchemy import Boolean, Text` to imports.

### 1.3 — Enforce suspension at login

**File:** `app/core/auth.py`

In `get_current_user`, after the user is resolved (after line 105), add:

```python
if user.is_suspended:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Account suspended. Contact support.",
    )
```

### 1.4 — New admin user-management endpoints

**File:** `app/api/admin.py` — append to existing file after `run_peyarchi_refresh_now`.

#### Schemas to add

```python
class UserSummary(BaseModel):
    user_id: str
    email: str | None
    user_mode: str
    is_suspended: bool
    suspension_reason: str | None
    birth_profile_count: int
    chart_count: int
    created_at: str

class UserListResponse(BaseModel):
    total: int
    items: list[UserSummary]
    page: int
    page_size: int

class UserDetail(UserSummary):
    family_vault_count: int
    family_member_count: int
    feedback_count: int
    ask_vinaadi_usage_today: int
    subscription_tier: str | None
    subscription_status: str | None

class SuspendRequest(BaseModel):
    suspend: bool
    reason: str | None = None
```

#### Endpoints to add

```python
@router.get("/users", response_model=UserListResponse, summary="List all users (paginated)")
def list_users(
    page: int = 1,
    page_size: int = 50,
    search: str | None = None,
    suspended_only: bool = False,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> UserListResponse:
    """
    Returns paginated user list. Optional filters:
    - search: partial match on email (case-insensitive ILIKE)
    - suspended_only: if true, return only suspended accounts
    """
    from sqlalchemy import func, or_, select
    from app.models import BirthProfile, Chart

    q = select(User)
    if search:
        q = q.where(User.email.ilike(f"%{search}%"))
    if suspended_only:
        q = q.where(User.is_suspended.is_(True))

    total = session.execute(select(func.count()).select_from(q.subquery())).scalar_one()

    users = session.execute(
        q.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    items = []
    for u in users:
        bp_count = session.execute(
            select(func.count()).where(BirthProfile.owner_user_id == u.user_id)
        ).scalar_one()
        chart_count = session.execute(
            select(func.count(Chart.chart_id))
            .join(BirthProfile, Chart.birth_profile_id == BirthProfile.birth_profile_id)
            .where(BirthProfile.owner_user_id == u.user_id)
        ).scalar_one()
        items.append(UserSummary(
            user_id=str(u.user_id),
            email=u.email,
            user_mode=u.user_mode,
            is_suspended=u.is_suspended,
            suspension_reason=u.suspension_reason,
            birth_profile_count=bp_count,
            chart_count=chart_count,
            created_at=u.created_at.isoformat() if u.created_at else "",
        ))

    return UserListResponse(total=total, items=items, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserDetail, summary="Get full detail for one user")
def get_user_detail(
    user_id: UUID,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> UserDetail:
    from sqlalchemy import func, select
    from app.models import BirthProfile, Chart, FamilyVault, FamilyMember, Feedback, Subscription
    from app.models.ask_vinaadi_usage import AskVinaadiUsage
    from datetime import date

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    bp_count = session.execute(select(func.count()).where(BirthProfile.owner_user_id == user_id)).scalar_one()
    chart_count = session.execute(
        select(func.count(Chart.chart_id))
        .join(BirthProfile, Chart.birth_profile_id == BirthProfile.birth_profile_id)
        .where(BirthProfile.owner_user_id == user_id)
    ).scalar_one()
    vault_count = session.execute(select(func.count()).where(FamilyVault.owner_user_id == user_id)).scalar_one()
    member_count = session.execute(select(func.count()).where(FamilyMember.owner_user_id == user_id)).scalar_one()
    feedback_count = session.execute(select(func.count()).where(Feedback.user_id == user_id)).scalar_one()
    ask_today = session.execute(
        select(func.count()).where(
            AskVinaadiUsage.user_id == user_id,
            func.date(AskVinaadiUsage.created_at) == date.today(),
        )
    ).scalar_one()

    sub = session.execute(
        select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.created_at.desc())
    ).scalars().first()

    return UserDetail(
        user_id=str(user.user_id),
        email=user.email,
        user_mode=user.user_mode,
        is_suspended=user.is_suspended,
        suspension_reason=user.suspension_reason,
        birth_profile_count=bp_count,
        chart_count=chart_count,
        family_vault_count=vault_count,
        family_member_count=member_count,
        feedback_count=feedback_count,
        ask_vinaadi_usage_today=ask_today,
        subscription_tier=sub.tier if sub else None,
        subscription_status=sub.status if sub else None,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


@router.patch("/users/{user_id}/suspend", summary="Suspend or unsuspend a user account")
def suspend_user(
    user_id: UUID,
    body: SuspendRequest,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> dict:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_suspended = body.suspend
    user.suspension_reason = body.reason if body.suspend else None
    session.commit()
    return {"user_id": str(user_id), "is_suspended": user.is_suspended, "suspension_reason": user.suspension_reason}
```

### 1.5 — Frontend: Users tab

**File:** `web/components/admin-console.tsx`

#### Types to add (top of file, with existing types)

```typescript
type UserSummary = {
  user_id: string;
  email: string | null;
  user_mode: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  birth_profile_count: number;
  chart_count: number;
  created_at: string;
};

type UserListResponse = {
  total: number;
  items: UserSummary[];
  page: number;
  page_size: number;
};

type UserDetail = UserSummary & {
  family_vault_count: number;
  family_member_count: number;
  feedback_count: number;
  ask_vinaadi_usage_today: number;
  subscription_tier: string | null;
  subscription_status: string | null;
};
```

#### Tab ID update

Change `AdminTab` type from:
```typescript
type AdminTab = "overview" | "feedback" | "operations" | "privacy";
```
to:
```typescript
type AdminTab = "overview" | "users" | "feedback" | "operations" | "privacy";
```

Add tab entry in the `tabs` array after `"overview"`:
```typescript
{ id: "users", label: "Users" },
```

#### State to add (in AdminConsole component, with existing state)

```typescript
const [userList, setUserList] = useState<UserListResponse | null>(null);
const [userSearch, setUserSearch] = useState("");
const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
const [suspendReason, setSuspendReason] = useState("");
const [userPage, setUserPage] = useState(1);
```

#### Handler functions to add

```typescript
async function loadUsers(key: string, page = 1, search = "") {
  setLoading(true);
  setError(null);
  try {
    const params = new URLSearchParams({ page: String(page), page_size: "50" });
    if (search) params.set("search", search);
    const data = await adminFetchJson<UserListResponse>(
      `/api/v1/admin/users?${params}`,
      key,
    );
    setUserList(data);
    setUserPage(page);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

async function loadUserDetail(key: string, userId: string) {
  setLoading(true);
  setError(null);
  try {
    const data = await adminFetchJson<UserDetail>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}`,
      key,
    );
    setUserDetail(data);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

async function toggleSuspend(key: string, userId: string, suspend: boolean) {
  setLoading(true);
  setError(null);
  try {
    await adminFetchJson(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/suspend`,
      key,
      {
        method: "PATCH",
        body: JSON.stringify({ suspend, reason: suspend ? suspendReason || null : null }),
      },
    );
    setSuspendReason("");
    await loadUserDetail(key, userId);
    await loadUsers(key, userPage, userSearch);
    setStatus(suspend ? "User suspended." : "User reinstated.");
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
```

#### Effect to add (load users when tab becomes active)

Add this alongside the existing `useEffect` for `adminKey`:

```typescript
useEffect(() => {
  if (!adminKey || activeTab !== "users") return;
  void loadUsers(adminKey, 1, userSearch);
}, [adminKey, activeTab]);
```

#### JSX panel to add (inside the unlocked section, alongside existing tab panels)

```tsx
{activeTab === "users" ? (
  <section className="admin-section" aria-labelledby="users-title">
    <div className="admin-section__header">
      <div>
        <h2 id="users-title">User Management</h2>
        <p>{numberLabel(userList?.total)} registered users.</p>
      </div>
    </div>
    <form
      className="admin-search-row"
      onSubmit={(e) => { e.preventDefault(); void loadUsers(adminKey, 1, userSearch); }}
    >
      <input
        className="admin-input"
        type="search"
        placeholder="Search by email..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
      />
      <button className="admin-button" type="submit" disabled={loading}>Search</button>
      <button
        className="admin-button admin-button--quiet"
        type="button"
        onClick={() => { setUserSearch(""); void loadUsers(adminKey, 1, ""); }}
      >
        Clear
      </button>
    </form>

    {userDetail ? (
      <div className="admin-user-detail">
        <div className="admin-section__header">
          <h3>{userDetail.email ?? userDetail.user_id}</h3>
          <button className="admin-button admin-button--quiet" type="button" onClick={() => setUserDetail(null)}>
            Close
          </button>
        </div>
        <div className="admin-metrics">
          {[
            { label: "Mode", value: userDetail.user_mode },
            { label: "Profiles", value: userDetail.birth_profile_count },
            { label: "Charts", value: userDetail.chart_count },
            { label: "Vaults", value: userDetail.family_vault_count },
            { label: "Members", value: userDetail.family_member_count },
            { label: "Feedback", value: userDetail.feedback_count },
            { label: "Asks today", value: userDetail.ask_vinaadi_usage_today },
            { label: "Subscription", value: userDetail.subscription_tier ?? "None" },
            { label: "Sub status", value: userDetail.subscription_status ?? "—" },
          ].map((row) => (
            <div className="admin-metric" key={row.label}>
              <span>{row.label}</span>
              <strong>{typeof row.value === "number" ? numberLabel(row.value) : row.value}</strong>
            </div>
          ))}
        </div>
        <div className="admin-suspend-section">
          <h4>{userDetail.is_suspended ? "Account is SUSPENDED" : "Account is active"}</h4>
          {userDetail.suspension_reason && <p>Reason: {userDetail.suspension_reason}</p>}
          {userDetail.is_suspended ? (
            <button
              className="admin-button"
              type="button"
              onClick={() => void toggleSuspend(adminKey, userDetail.user_id, false)}
              disabled={loading}
            >
              Reinstate account
            </button>
          ) : (
            <div className="admin-suspend-form">
              <input
                className="admin-input"
                type="text"
                placeholder="Suspension reason (optional)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
              <button
                className="admin-button admin-button--danger"
                type="button"
                onClick={() => void toggleSuspend(adminKey, userDetail.user_id, true)}
                disabled={loading}
              >
                Suspend account
              </button>
            </div>
          )}
        </div>
      </div>
    ) : (
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Mode</th>
            <th>Profiles</th>
            <th>Charts</th>
            <th>Status</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(userList?.items ?? []).map((u) => (
            <tr key={u.user_id} className={u.is_suspended ? "admin-row--suspended" : ""}>
              <td>{u.email ?? <em>anonymous</em>}</td>
              <td>{u.user_mode}</td>
              <td>{numberLabel(u.birth_profile_count)}</td>
              <td>{numberLabel(u.chart_count)}</td>
              <td>
                <span className={`admin-badge ${u.is_suspended ? "admin-badge--danger" : "admin-badge--ok"}`}>
                  {u.is_suspended ? "Suspended" : "Active"}
                </span>
              </td>
              <td>{formatDateTimeLabel(u.created_at)}</td>
              <td>
                <button
                  className="admin-button admin-button--quiet"
                  type="button"
                  onClick={() => void loadUserDetail(adminKey, u.user_id)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    {(userList?.total ?? 0) > 50 && !userDetail && (
      <div className="admin-pagination">
        <button
          className="admin-button admin-button--quiet"
          type="button"
          disabled={userPage <= 1 || loading}
          onClick={() => void loadUsers(adminKey, userPage - 1, userSearch)}
        >
          Previous
        </button>
        <span>Page {userPage} of {Math.ceil((userList?.total ?? 0) / 50)}</span>
        <button
          className="admin-button admin-button--quiet"
          type="button"
          disabled={userPage * 50 >= (userList?.total ?? 0) || loading}
          onClick={() => void loadUsers(adminKey, userPage + 1, userSearch)}
        >
          Next
        </button>
      </div>
    )}
  </section>
) : null}
```

### 1.6 — CSS additions for Phase 1

**File:** `web/app/admin/admin.css`

Append these styles:

```css
/* User management table */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.admin-table th,
.admin-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--admin-border);
}
.admin-table th {
  color: var(--admin-muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-row--suspended td {
  opacity: 0.55;
}
.admin-badge--ok { background: #d1fae5; color: #065f46; }
.admin-badge--danger { background: #fee2e2; color: #991b1b; }
.admin-search-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.admin-search-row .admin-input { flex: 1; }
.admin-user-detail { padding: 1rem; border: 1px solid var(--admin-border); border-radius: 0.5rem; margin-bottom: 1rem; }
.admin-suspend-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--admin-border); }
.admin-suspend-form { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.admin-pagination { display: flex; gap: 1rem; align-items: center; justify-content: center; padding: 1rem 0; }
```

### 1.7 — Acceptance criteria

- `GET /api/v1/admin/users` returns paginated list with correct counts
- `GET /api/v1/admin/users?search=foo` filters by email
- `GET /api/v1/admin/users/{id}` returns full detail including subscription
- `PATCH /api/v1/admin/users/{id}/suspend` with `{"suspend": true, "reason": "spam"}` sets `is_suspended=true`
- A suspended user who tries to log in receives HTTP 403 "Account suspended"
- Frontend Users tab shows table, search, view drawer, suspend/reinstate buttons

---

## Phase 2 — Analytics Dashboard

**Goal:** Time-series metrics for growth and feature-usage decisions. No new
models — queries run against existing tables.

### 2.1 — New analytics router

**File to create:** `app/api/admin_analytics.py`

```python
"""Admin analytics endpoints — aggregate queries, no new models required."""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.db.session import get_db
from app.models import BirthProfile, Chart, FamilyVault, User
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.user import User

router = APIRouter(prefix="/admin/analytics", tags=["admin"])


class DailyCount(BaseModel):
    date: str
    count: int


class DailyMetrics(BaseModel):
    new_users: list[DailyCount]
    active_users: list[DailyCount]   # users who generated any chart or guidance
    days: int


class FeatureUsage(BaseModel):
    charts_total: int
    family_vaults_total: int
    ask_vinaadi_total: int
    ask_vinaadi_today: int
    birth_profiles_total: int
    as_of: str


class RetentionCohort(BaseModel):
    cohort_week: str        # ISO week start date (Monday)
    cohort_size: int
    retained_d7: int
    retained_d30: int


class RetentionReport(BaseModel):
    cohorts: list[RetentionCohort]


@router.get("/daily", response_model=DailyMetrics, summary="New signups and active users per day (last N days)")
def get_daily_metrics(
    days: int = 30,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> DailyMetrics:
    days = max(1, min(days, 90))
    since = datetime.now(UTC) - timedelta(days=days)

    # New users per day
    new_users_rows = session.execute(
        select(
            func.date(User.created_at).label("d"),
            func.count(User.user_id).label("n"),
        )
        .where(User.created_at >= since)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    ).all()

    # Active users per day: users who created a chart
    active_rows = session.execute(
        select(
            func.date(Chart.created_at).label("d"),
            func.count(func.distinct(BirthProfile.owner_user_id)).label("n"),
        )
        .join(BirthProfile, Chart.birth_profile_id == BirthProfile.birth_profile_id)
        .where(Chart.created_at >= since)
        .group_by(func.date(Chart.created_at))
        .order_by(func.date(Chart.created_at))
    ).all()

    return DailyMetrics(
        new_users=[DailyCount(date=str(r.d), count=r.n) for r in new_users_rows],
        active_users=[DailyCount(date=str(r.d), count=r.n) for r in active_rows],
        days=days,
    )


@router.get("/features", response_model=FeatureUsage, summary="Overall feature usage counts")
def get_feature_usage(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> FeatureUsage:
    def count(model):
        return session.execute(select(func.count()).select_from(model)).scalar_one()

    ask_today = session.execute(
        select(func.count()).where(func.date(AskVinaadiUsage.created_at) == date.today())
    ).scalar_one()

    return FeatureUsage(
        charts_total=count(Chart),
        family_vaults_total=count(FamilyVault),
        ask_vinaadi_total=count(AskVinaadiUsage),
        ask_vinaadi_today=ask_today,
        birth_profiles_total=count(BirthProfile),
        as_of=datetime.now(UTC).isoformat(),
    )


@router.get("/retention", response_model=RetentionReport, summary="Weekly cohort retention (D7, D30)")
def get_retention(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> RetentionReport:
    """
    Groups users by the ISO week they signed up, then counts how many
    created at least one chart 7+ days later (D7) and 30+ days later (D30).
    Only returns cohorts old enough to have observable D7/D30 windows.
    """
    now = datetime.now(UTC)
    cutoff_d7 = now - timedelta(days=7)
    cutoff_d30 = now - timedelta(days=30)

    rows = session.execute(
        select(
            func.date_trunc("week", User.created_at).label("cohort_week"),
            func.count(User.user_id).label("cohort_size"),
        )
        .where(User.created_at <= cutoff_d7)
        .group_by(func.date_trunc("week", User.created_at))
        .order_by(func.date_trunc("week", User.created_at).desc())
        .limit(12)
    ).all()

    cohorts: list[RetentionCohort] = []
    for row in rows:
        week_start: datetime = row.cohort_week
        week_end = week_start + timedelta(days=7)

        # Users in cohort
        cohort_user_ids = session.execute(
            select(User.user_id).where(
                User.created_at >= week_start,
                User.created_at < week_end,
            )
        ).scalars().all()

        if not cohort_user_ids:
            continue

        def active_count(after: datetime) -> int:
            return session.execute(
                select(func.count(func.distinct(BirthProfile.owner_user_id)))
                .join(Chart, Chart.birth_profile_id == BirthProfile.birth_profile_id)
                .where(
                    BirthProfile.owner_user_id.in_(cohort_user_ids),
                    Chart.created_at >= after,
                )
            ).scalar_one()

        d7 = active_count(week_start + timedelta(days=7)) if week_start + timedelta(days=7) <= now else 0
        d30 = active_count(week_start + timedelta(days=30)) if week_start + timedelta(days=30) <= now else 0

        cohorts.append(RetentionCohort(
            cohort_week=week_start.date().isoformat(),
            cohort_size=row.cohort_size,
            retained_d7=d7,
            retained_d30=d30,
        ))

    return RetentionReport(cohorts=cohorts)
```

### 2.2 — Register analytics router

**File:** `app/main.py`

Add import after existing admin import:
```python
from app.api.admin_analytics import router as admin_analytics_router
```

Add to `create_app()` after `app.include_router(admin_router, ...)`:
```python
app.include_router(admin_analytics_router, prefix=settings.api_v1_prefix)
```

### 2.3 — Frontend: Analytics tab

**File:** `web/components/admin-console.tsx`

Add `"analytics"` to `AdminTab` type and add `{ id: "analytics", label: "Analytics" }` to the `tabs` array after `"users"`.

#### Types to add

```typescript
type DailyCount = { date: string; count: number };
type DailyMetrics = { new_users: DailyCount[]; active_users: DailyCount[]; days: number };
type FeatureUsage = {
  charts_total: number;
  family_vaults_total: number;
  ask_vinaadi_total: number;
  ask_vinaadi_today: number;
  birth_profiles_total: number;
  as_of: string;
};
type RetentionCohort = { cohort_week: string; cohort_size: number; retained_d7: number; retained_d30: number };
type RetentionReport = { cohorts: RetentionCohort[] };
```

#### State to add

```typescript
const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);
const [featureUsage, setFeatureUsage] = useState<FeatureUsage | null>(null);
const [retention, setRetention] = useState<RetentionReport | null>(null);
```

#### Handler to add

```typescript
async function loadAnalytics(key: string) {
  setLoading(true);
  setError(null);
  try {
    const [daily, features, ret] = await Promise.all([
      adminFetchJson<DailyMetrics>("/api/v1/admin/analytics/daily?days=30", key),
      adminFetchJson<FeatureUsage>("/api/v1/admin/analytics/features", key),
      adminFetchJson<RetentionReport>("/api/v1/admin/analytics/retention", key),
    ]);
    setDailyMetrics(daily);
    setFeatureUsage(features);
    setRetention(ret);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
```

#### Effect to add

```typescript
useEffect(() => {
  if (!adminKey || activeTab !== "analytics") return;
  void loadAnalytics(adminKey);
}, [adminKey, activeTab]);
```

#### JSX panel — Analytics tab

```tsx
{activeTab === "analytics" ? (
  <section className="admin-section" aria-labelledby="analytics-title">
    <div className="admin-section__header">
      <div>
        <h2 id="analytics-title">Analytics</h2>
        <p>Growth and feature usage — last 30 days.</p>
      </div>
      <button className="admin-button" type="button" onClick={() => void loadAnalytics(adminKey)} disabled={loading}>
        Refresh
      </button>
    </div>

    {featureUsage && (
      <div className="admin-metrics">
        {[
          { label: "Total charts", value: featureUsage.charts_total, hint: "All time" },
          { label: "Profiles", value: featureUsage.birth_profiles_total, hint: "All time" },
          { label: "Family vaults", value: featureUsage.family_vaults_total, hint: "All time" },
          { label: "Ask Vinaadi total", value: featureUsage.ask_vinaadi_total, hint: "All time" },
          { label: "Ask Vinaadi today", value: featureUsage.ask_vinaadi_today, hint: "UTC day" },
        ].map((row) => (
          <div className="admin-metric" key={row.label}>
            <span>{row.label}</span>
            <strong>{numberLabel(row.value)}</strong>
            <small>{row.hint}</small>
          </div>
        ))}
      </div>
    )}

    {dailyMetrics && (
      <div className="admin-chart-section">
        <h3>New signups — last {dailyMetrics.days} days</h3>
        <div className="admin-sparkbar-row">
          {dailyMetrics.new_users.map((d) => {
            const max = Math.max(...dailyMetrics.new_users.map((x) => x.count), 1);
            return (
              <div key={d.date} className="admin-sparkbar" title={`${d.date}: ${d.count}`}>
                <div className="admin-sparkbar__fill" style={{ height: `${(d.count / max) * 100}%` }} />
                <span className="admin-sparkbar__label">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {retention && retention.cohorts.length > 0 && (
      <div className="admin-retention">
        <h3>Weekly cohort retention</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cohort week</th>
              <th>Signed up</th>
              <th>Active D7</th>
              <th>D7 %</th>
              <th>Active D30</th>
              <th>D30 %</th>
            </tr>
          </thead>
          <tbody>
            {retention.cohorts.map((c) => (
              <tr key={c.cohort_week}>
                <td>{c.cohort_week}</td>
                <td>{numberLabel(c.cohort_size)}</td>
                <td>{numberLabel(c.retained_d7)}</td>
                <td>{c.cohort_size > 0 ? `${Math.round((c.retained_d7 / c.cohort_size) * 100)}%` : "—"}</td>
                <td>{numberLabel(c.retained_d30)}</td>
                <td>{c.cohort_size > 0 ? `${Math.round((c.retained_d30 / c.cohort_size) * 100)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
) : null}
```

#### Analytics CSS to append to `web/app/admin/admin.css`

```css
/* Sparkbar chart */
.admin-chart-section { margin: 1.5rem 0; }
.admin-sparkbar-row {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 80px;
  padding: 0.5rem 0;
  overflow-x: auto;
}
.admin-sparkbar {
  flex: 0 0 auto;
  width: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  position: relative;
}
.admin-sparkbar__fill {
  width: 100%;
  background: var(--admin-accent, #6366f1);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}
.admin-sparkbar__label {
  font-size: 0.6rem;
  color: var(--admin-muted);
  margin-top: 2px;
  white-space: nowrap;
}
.admin-retention { margin-top: 1.5rem; }
```

### 2.4 — Acceptance criteria

- `GET /api/v1/admin/analytics/daily?days=30` returns arrays for new_users and active_users
- `GET /api/v1/admin/analytics/features` returns all usage counts
- `GET /api/v1/admin/analytics/retention` returns up to 12 weekly cohorts with D7 and D30
- Frontend Analytics tab displays sparkbar chart and retention table

---

## Phase 3 — Scheduler & Jobs Control

**Goal:** Surface all APScheduler jobs to the admin and allow manual triggers.

### 3.1 — Job registry

**File to create:** `app/services/job_registry.py`

```python
"""Centralised job registry so admin endpoints can list and trigger all jobs."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Callable

_JOB_REGISTRY: dict[str, dict[str, Any]] = {}


def register_job(job_id: str, label: str, description: str, fn: Callable) -> None:
    _JOB_REGISTRY[job_id] = {"job_id": job_id, "label": label, "description": description, "fn": fn}


def get_all_jobs() -> list[dict]:
    return list(_JOB_REGISTRY.values())


def get_job(job_id: str) -> dict | None:
    return _JOB_REGISTRY.get(job_id)
```

### 3.2 — Register all existing jobs

**File:** `app/main.py`

In `_build_lifespan`, after imports, before `scheduler.add_job(...)` calls, add:

```python
from app.services.job_registry import register_job
from app.services.daily_push_cron import run_daily_push_cron
from app.services.peyarchi_alert_service import daily_peyarchi_refresh
from app.services.synastry_service import daily_relationship_alert_refresh
from app.services.panchangam_prewarm import run_panchangam_prewarm_cron

register_job("daily_peyarchi_refresh", "Peyarchi Refresh", "Refresh transit alerts for all charts (daily, 02:00 UTC)", daily_peyarchi_refresh)
register_job("daily_relationship_alert_refresh", "Relationship Alerts", "Refresh synastry alerts (daily, 02:05 UTC)", daily_relationship_alert_refresh)
register_job("daily_push_cron", "Daily Push Notifications", "Send morning guidance push (hourly, per-user timezone window)", run_daily_push_cron)
register_job("panchangam_prewarm", "Panchangam Prewarm", "Pre-warm panchangam cache for popular locations (daily, 02:10 UTC)", run_panchangam_prewarm_cron)
```

### 3.3 — Jobs endpoints

**File:** `app/api/admin.py` — append:

```python
from app.services.job_registry import get_all_jobs, get_job


class JobInfo(BaseModel):
    job_id: str
    label: str
    description: str


class JobRunResult(BaseModel):
    job_id: str
    started_at: str
    finished_at: str
    result_summary: str | None


@router.get("/jobs", response_model=list[JobInfo], summary="List all registered background jobs")
def list_jobs(_: User = Depends(get_admin_user)) -> list[JobInfo]:
    return [JobInfo(**{k: v for k, v in j.items() if k != "fn"}) for j in get_all_jobs()]


@router.post("/jobs/{job_id}/trigger", response_model=JobRunResult, summary="Manually trigger a background job")
def trigger_job(
    job_id: str,
    _: User = Depends(get_admin_user),
) -> JobRunResult:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not registered.")

    started = datetime.now(UTC)
    summary: str | None = None
    try:
        result = job["fn"]()
        if isinstance(result, dict):
            summary = ", ".join(f"{k}={v}" for k, v in result.items())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Job failed: {exc}") from exc

    return JobRunResult(
        job_id=job_id,
        started_at=started.isoformat(),
        finished_at=datetime.now(UTC).isoformat(),
        result_summary=summary,
    )
```

### 3.4 — Frontend: expand Operations tab

**File:** `web/components/admin-console.tsx`

#### Types to add

```typescript
type JobInfo = { job_id: string; label: string; description: string };
type JobRunResult = { job_id: string; started_at: string; finished_at: string; result_summary: string | null };
```

#### State to add

```typescript
const [jobs, setJobs] = useState<JobInfo[]>([]);
const [jobResults, setJobResults] = useState<Record<string, JobRunResult>>({});
const [runningJob, setRunningJob] = useState<string | null>(null);
```

#### Handler to add

```typescript
async function loadJobs(key: string) {
  try {
    const data = await adminFetchJson<JobInfo[]>("/api/v1/admin/jobs", key);
    setJobs(data);
  } catch (err) {
    setError(readErrorMessage(err));
  }
}

async function triggerJob(key: string, jobId: string) {
  setRunningJob(jobId);
  setError(null);
  try {
    const result = await adminFetchJson<JobRunResult>(
      `/api/v1/admin/jobs/${encodeURIComponent(jobId)}/trigger`,
      key,
      { method: "POST" },
    );
    setJobResults((prev) => ({ ...prev, [jobId]: result }));
    setStatus(`Job ${jobId} completed.`);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setRunningJob(null);
  }
}
```

#### Effect to add

```typescript
useEffect(() => {
  if (!adminKey || activeTab !== "operations") return;
  void loadJobs(adminKey);
}, [adminKey, activeTab]);
```

#### Replace the Operations tab JSX with

```tsx
{activeTab === "operations" ? (
  <section className="admin-section" aria-labelledby="operations-title">
    <div className="admin-section__header">
      <div>
        <h2 id="operations-title">Background Jobs</h2>
        <p>Manually trigger any registered background job.</p>
      </div>
      <button className="admin-button" type="button" onClick={() => void loadJobs(adminKey)} disabled={loading}>
        Refresh
      </button>
    </div>
    {jobs.length === 0 && <div className="admin-empty">No jobs registered yet.</div>}
    {jobs.map((job) => (
      <div className="admin-action-row" key={job.job_id}>
        <div>
          <h3>{job.label}</h3>
          <p>{job.description}</p>
          {jobResults[job.job_id] && (
            <div className="admin-result">
              <span>Result: {jobResults[job.job_id].result_summary ?? "OK"}</span>
              <span>Ran at: {formatDateTimeLabel(jobResults[job.job_id].started_at)}</span>
            </div>
          )}
        </div>
        <button
          className="admin-button admin-button--primary"
          type="button"
          onClick={() => void triggerJob(adminKey, job.job_id)}
          disabled={runningJob !== null}
        >
          {runningJob === job.job_id ? "Running..." : "Run now"}
        </button>
      </div>
    ))}
  </section>
) : null}
```

### 3.5 — Acceptance criteria

- `GET /api/v1/admin/jobs` returns all 4 registered jobs
- `POST /api/v1/admin/jobs/daily_peyarchi_refresh/trigger` runs the job and returns result
- `POST /api/v1/admin/jobs/nonexistent/trigger` returns 404
- Frontend Operations tab shows all jobs with individual Trigger buttons

---

## Phase 4 — Audit Log

**Goal:** Record every admin action for compliance and incident review.

### 4.1 — DB migration: create `admin_audit_log` table

**File to create:** `alembic/versions/<timestamp>_add_admin_audit_log.py`

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

def upgrade() -> None:
    op.create_table(
        "admin_audit_log",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("target_type", sa.String(60), nullable=True),
        sa.Column("target_id", sa.String(120), nullable=True),
        sa.Column("payload_summary", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_audit_created_at", "admin_audit_log", ["created_at"])
    op.create_index("idx_audit_action", "admin_audit_log", ["action"])

def downgrade() -> None:
    op.drop_index("idx_audit_action", "admin_audit_log")
    op.drop_index("idx_audit_created_at", "admin_audit_log")
    op.drop_table("admin_audit_log")
```

### 4.2 — Admin audit log model

**File to create:** `app/models/admin_audit_log.py`

```python
from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import DateTime, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"
    __table_args__ = (
        Index("idx_audit_created_at", "created_at"),
        Index("idx_audit_action", "action"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payload_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
```

### 4.3 — Update models `__init__.py`

**File:** `app/models/__init__.py`

Add:
```python
from app.models.admin_audit_log import AdminAuditLog
```

Add `"AdminAuditLog"` to `__all__`.

### 4.4 — Audit log helper

**File to create:** `app/services/audit_service.py`

```python
"""Write admin audit log entries. Called from endpoints, not middleware,
so the action name and target are always explicit rather than inferred."""
from __future__ import annotations

from app.db.session import SessionLocal
from app.models.admin_audit_log import AdminAuditLog


def log_admin_action(
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    payload_summary: str | None = None,
    ip_address: str | None = None,
) -> None:
    with SessionLocal() as session:
        entry = AdminAuditLog(
            action=action,
            target_type=target_type,
            target_id=target_id,
            payload_summary=payload_summary,
            ip_address=ip_address,
        )
        session.add(entry)
        session.commit()
```

### 4.5 — Add audit calls to all mutating admin endpoints

**File:** `app/api/admin.py`

Add `from app.services.audit_service import log_admin_action` at the top.

In `delete_user_data`, just before `return DataDeletionResult(...)`:
```python
log_admin_action("delete_user_data", target_type="user", target_id=str(owner_user_id),
                  payload_summary=f"profiles={len(profiles)},charts={charts_deleted}")
```

In `suspend_user`, just before `return {...}`:
```python
log_admin_action(
    "suspend_user" if body.suspend else "reinstate_user",
    target_type="user",
    target_id=str(user_id),
    payload_summary=body.reason,
)
```

In `trigger_job`, just before `return JobRunResult(...)`:
```python
log_admin_action("trigger_job", target_type="job", target_id=job_id, payload_summary=summary)
```

In `run_peyarchi_refresh_now`, just before `return`:
```python
log_admin_action("trigger_job", target_type="job", target_id="daily_peyarchi_refresh",
                  payload_summary=f"charts={result['charts_refreshed']}")
```

### 4.6 — Audit log read endpoint

**File:** `app/api/admin.py` — append:

```python
class AuditLogEntry(BaseModel):
    id: str
    action: str
    target_type: str | None
    target_id: str | None
    payload_summary: str | None
    ip_address: str | None
    created_at: str


class AuditLogResponse(BaseModel):
    total: int
    items: list[AuditLogEntry]


@router.get("/audit-log", response_model=AuditLogResponse, summary="List admin audit log entries")
def get_audit_log(
    page: int = 1,
    page_size: int = 100,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> AuditLogResponse:
    from app.models.admin_audit_log import AdminAuditLog

    total = session.execute(select(func.count()).select_from(AdminAuditLog)).scalar_one()
    rows = session.execute(
        select(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return AuditLogResponse(
        total=total,
        items=[
            AuditLogEntry(
                id=str(r.id),
                action=r.action,
                target_type=r.target_type,
                target_id=r.target_id,
                payload_summary=r.payload_summary,
                ip_address=r.ip_address,
                created_at=r.created_at.isoformat(),
            )
            for r in rows
        ],
    )
```

### 4.7 — Frontend: Audit Log tab

**File:** `web/components/admin-console.tsx`

Add `"audit"` to `AdminTab` and `{ id: "audit", label: "Audit Log" }` to `tabs` array.

#### Types to add

```typescript
type AuditLogEntry = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  payload_summary: string | null;
  ip_address: string | null;
  created_at: string;
};
type AuditLogResponse = { total: number; items: AuditLogEntry[] };
```

#### State to add

```typescript
const [auditLog, setAuditLog] = useState<AuditLogResponse | null>(null);
const [auditPage, setAuditPage] = useState(1);
```

#### Handler to add

```typescript
async function loadAuditLog(key: string, page = 1) {
  setLoading(true);
  try {
    const data = await adminFetchJson<AuditLogResponse>(
      `/api/v1/admin/audit-log?page=${page}&page_size=100`,
      key,
    );
    setAuditLog(data);
    setAuditPage(page);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
```

#### Effect to add

```typescript
useEffect(() => {
  if (!adminKey || activeTab !== "audit") return;
  void loadAuditLog(adminKey);
}, [adminKey, activeTab]);
```

#### JSX panel

```tsx
{activeTab === "audit" ? (
  <section className="admin-section" aria-labelledby="audit-title">
    <div className="admin-section__header">
      <div>
        <h2 id="audit-title">Audit Log</h2>
        <p>{numberLabel(auditLog?.total)} admin actions recorded.</p>
      </div>
      <button className="admin-button" type="button" onClick={() => void loadAuditLog(adminKey)} disabled={loading}>
        Refresh
      </button>
    </div>
    <table className="admin-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>Target</th>
          <th>ID</th>
          <th>Summary</th>
          <th>IP</th>
        </tr>
      </thead>
      <tbody>
        {(auditLog?.items ?? []).map((entry) => (
          <tr key={entry.id}>
            <td>{formatDateTimeLabel(entry.created_at)}</td>
            <td><code>{entry.action}</code></td>
            <td>{entry.target_type ?? "—"}</td>
            <td><small>{entry.target_id ?? "—"}</small></td>
            <td>{entry.payload_summary ?? "—"}</td>
            <td><small>{entry.ip_address ?? "—"}</small></td>
          </tr>
        ))}
      </tbody>
    </table>
    {(auditLog?.total ?? 0) > 100 && (
      <div className="admin-pagination">
        <button
          className="admin-button admin-button--quiet"
          type="button"
          disabled={auditPage <= 1}
          onClick={() => void loadAuditLog(adminKey, auditPage - 1)}
        >Previous</button>
        <span>Page {auditPage}</span>
        <button
          className="admin-button admin-button--quiet"
          type="button"
          disabled={auditPage * 100 >= (auditLog?.total ?? 0)}
          onClick={() => void loadAuditLog(adminKey, auditPage + 1)}
        >Next</button>
      </div>
    )}
  </section>
) : null}
```

### 4.8 — Acceptance criteria

- Every mutating admin action writes a row to `admin_audit_log`
- `GET /api/v1/admin/audit-log` returns entries newest-first
- Frontend Audit Log tab shows a table of all admin actions

---

## Phase 5 — Broadcast Notifications

**Goal:** Allow admin to send a push notification to all users or a single user.

### 5.1 — New broadcast endpoint

**File:** `app/api/admin.py` — append:

```python
class BroadcastRequest(BaseModel):
    title: str
    body: str
    target_user_id: str | None = None   # None = all users


class BroadcastResult(BaseModel):
    sent: int
    skipped: int
    target: str
    sent_at: str


@router.post("/notify/broadcast", response_model=BroadcastResult, summary="Send push notification to users")
def broadcast_notification(
    body: BroadcastRequest,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> BroadcastResult:
    """
    If target_user_id is set, sends to that user only.
    Otherwise sends to all users who have push tokens registered.
    Uses the existing FCM send infrastructure in app/services/push_service.py.
    Skips users without a registered FCM token.
    """
    from app.models.user_notification_preference import UserNotificationPreference
    from app.services.push_service import send_push_to_token

    if body.target_user_id:
        prefs = session.execute(
            select(UserNotificationPreference).where(
                UserNotificationPreference.owner_user_id == UUID(body.target_user_id)
            )
        ).scalars().all()
    else:
        prefs = session.execute(select(UserNotificationPreference)).scalars().all()

    sent = 0
    skipped = 0
    for pref in prefs:
        token = getattr(pref, "fcm_token", None)
        if not token:
            skipped += 1
            continue
        try:
            send_push_to_token(token, title=body.title, message=body.body)
            sent += 1
        except Exception:  # noqa: BLE001
            skipped += 1

    target_label = body.target_user_id or "all users"
    log_admin_action("broadcast_notification", target_type="segment", target_id=target_label,
                      payload_summary=f"title={body.title!r}, sent={sent}")

    return BroadcastResult(
        sent=sent,
        skipped=skipped,
        target=target_label,
        sent_at=datetime.now(UTC).isoformat(),
    )
```

**Note:** If `app/services/push_service.py` does not expose a `send_push_to_token(token, title, message)` function, locate the existing FCM send helper and wrap it. Do not create a duplicate FCM client.

### 5.2 — Frontend: Notifications tab

**File:** `web/components/admin-console.tsx`

Add `"notifications"` to `AdminTab` and `{ id: "notifications", label: "Notifications" }` to `tabs`.

#### Types to add

```typescript
type BroadcastResult = { sent: number; skipped: number; target: string; sent_at: string };
```

#### State to add

```typescript
const [notifTitle, setNotifTitle] = useState("");
const [notifBody, setNotifBody] = useState("");
const [notifTarget, setNotifTarget] = useState("");
const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);
```

#### Handler to add

```typescript
async function sendBroadcast(key: string) {
  if (!notifTitle.trim() || !notifBody.trim()) {
    setError("Title and body are required.");
    return;
  }
  setLoading(true);
  setError(null);
  try {
    const result = await adminFetchJson<BroadcastResult>(
      "/api/v1/admin/notify/broadcast",
      key,
      {
        method: "POST",
        body: JSON.stringify({
          title: notifTitle.trim(),
          body: notifBody.trim(),
          target_user_id: notifTarget.trim() || null,
        }),
      },
    );
    setBroadcastResult(result);
    setNotifTitle("");
    setNotifBody("");
    setNotifTarget("");
    setStatus(`Broadcast sent to ${result.sent} users.`);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
```

#### JSX panel

```tsx
{activeTab === "notifications" ? (
  <section className="admin-section" aria-labelledby="notif-title">
    <div className="admin-section__header">
      <div>
        <h2 id="notif-title">Push Notifications</h2>
        <p>Broadcast to all users or send to a specific user.</p>
      </div>
    </div>
    <div className="admin-notif-form">
      <label>
        Title
        <input className="admin-input" type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Notification title" />
      </label>
      <label>
        Body
        <textarea className="admin-input admin-textarea" value={notifBody} onChange={(e) => setNotifBody(e.target.value)} placeholder="Notification body text" rows={3} />
      </label>
      <label>
        Target user ID <small>(leave blank to send to all users)</small>
        <input className="admin-input" type="text" value={notifTarget} onChange={(e) => setNotifTarget(e.target.value)} placeholder="UUID or blank for broadcast" />
      </label>
      <button
        className="admin-button admin-button--primary"
        type="button"
        onClick={() => void sendBroadcast(adminKey)}
        disabled={loading || !notifTitle.trim() || !notifBody.trim()}
      >
        {notifTarget.trim() ? "Send to user" : "Broadcast to all"}
      </button>
    </div>
    {broadcastResult && (
      <div className="admin-result">
        <span>Sent: {numberLabel(broadcastResult.sent)}</span>
        <span>Skipped (no token): {numberLabel(broadcastResult.skipped)}</span>
        <span>Target: {broadcastResult.target}</span>
        <span>At: {formatDateTimeLabel(broadcastResult.sent_at)}</span>
      </div>
    )}
  </section>
) : null}
```

#### CSS to append to `web/app/admin/admin.css`

```css
.admin-notif-form { display: flex; flex-direction: column; gap: 1rem; max-width: 480px; }
.admin-notif-form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; font-weight: 500; }
.admin-textarea { resize: vertical; font-family: inherit; }
```

### 5.3 — Acceptance criteria

- `POST /api/v1/admin/notify/broadcast` with `{"title": "T", "body": "B"}` sends to all token holders
- `POST /api/v1/admin/notify/broadcast` with `target_user_id` sends to that user only
- Action is recorded in audit log
- Frontend Notifications tab shows compose form and result

---

## Phase 6 — Feature Flags & Runtime Config

**Goal:** Toggle key app behaviours without a redeploy.

### 6.1 — Feature flag registry

**File to create:** `app/services/feature_flags.py`

```python
"""Runtime-editable feature flags stored in process memory.
Flags are reset to defaults on process restart — suitable for temporary toggles.
For persistent flags, extend this to a DB-backed table in a future iteration.
"""
from __future__ import annotations

from typing import Any

_DEFAULTS: dict[str, Any] = {
    "enable_admin_data_delete": False,
    "ask_vinaadi_daily_limit": 10,
    "enable_push_notifications": True,
    "maintenance_mode": False,
    "max_birth_profiles_per_user": 10,
}

_overrides: dict[str, Any] = {}


def get_flag(name: str) -> Any:
    if name in _overrides:
        return _overrides[name]
    return _DEFAULTS.get(name)


def set_flag(name: str, value: Any) -> None:
    if name not in _DEFAULTS:
        raise ValueError(f"Unknown flag: {name}")
    _overrides[name] = value


def reset_flag(name: str) -> None:
    _overrides.pop(name, None)


def all_flags() -> dict[str, dict]:
    return {
        name: {
            "name": name,
            "value": get_flag(name),
            "default": default,
            "overridden": name in _overrides,
        }
        for name, default in _DEFAULTS.items()
    }
```

### 6.2 — Flag endpoints

**File:** `app/api/admin.py` — append:

```python
class FlagEntry(BaseModel):
    name: str
    value: Any
    default: Any
    overridden: bool


class FlagUpdate(BaseModel):
    value: Any


@router.get("/flags", response_model=list[FlagEntry], summary="List all feature flags with current values")
def list_flags(_: User = Depends(get_admin_user)) -> list[FlagEntry]:
    from app.services.feature_flags import all_flags
    return [FlagEntry(**f) for f in all_flags().values()]


@router.patch("/flags/{flag_name}", response_model=FlagEntry, summary="Set a feature flag value")
def set_flag_value(
    flag_name: str,
    body: FlagUpdate,
    _: User = Depends(get_admin_user),
) -> FlagEntry:
    from app.services.feature_flags import all_flags, set_flag
    try:
        set_flag(flag_name, body.value)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    log_admin_action("set_flag", target_type="flag", target_id=flag_name,
                      payload_summary=f"value={body.value!r}")
    return FlagEntry(**all_flags()[flag_name])


@router.delete("/flags/{flag_name}/reset", summary="Reset a feature flag to its default value")
def reset_flag_value(
    flag_name: str,
    _: User = Depends(get_admin_user),
) -> dict:
    from app.services.feature_flags import all_flags, reset_flag
    reset_flag(flag_name)
    log_admin_action("reset_flag", target_type="flag", target_id=flag_name)
    return {"flag_name": flag_name, "reset": True, "current_value": all_flags().get(flag_name, {}).get("value")}
```

Add `from typing import Any` to imports at top of `app/api/admin.py`.

### 6.3 — Frontend: Config tab

**File:** `web/components/admin-console.tsx`

Add `"config"` to `AdminTab` and `{ id: "config", label: "Config" }` to `tabs`.

#### Types to add

```typescript
type FlagEntry = { name: string; value: unknown; default: unknown; overridden: boolean };
```

#### State to add

```typescript
const [flags, setFlags] = useState<FlagEntry[]>([]);
const [flagDrafts, setFlagDrafts] = useState<Record<string, string>>({});
```

#### Handlers to add

```typescript
async function loadFlags(key: string) {
  try {
    const data = await adminFetchJson<FlagEntry[]>("/api/v1/admin/flags", key);
    setFlags(data);
    setFlagDrafts(Object.fromEntries(data.map((f) => [f.name, String(f.value)])));
  } catch (err) {
    setError(readErrorMessage(err));
  }
}

async function saveFlag(key: string, name: string, rawValue: string) {
  let value: unknown = rawValue;
  if (rawValue === "true") value = true;
  else if (rawValue === "false") value = false;
  else if (!isNaN(Number(rawValue)) && rawValue.trim() !== "") value = Number(rawValue);

  setLoading(true);
  try {
    await adminFetchJson(`/api/v1/admin/flags/${encodeURIComponent(name)}`, key, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
    setStatus(`Flag ${name} updated.`);
    await loadFlags(key);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

async function resetFlag(key: string, name: string) {
  setLoading(true);
  try {
    await adminFetchJson(`/api/v1/admin/flags/${encodeURIComponent(name)}/reset`, key, { method: "DELETE" });
    setStatus(`Flag ${name} reset to default.`);
    await loadFlags(key);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
```

#### Effect to add

```typescript
useEffect(() => {
  if (!adminKey || activeTab !== "config") return;
  void loadFlags(adminKey);
}, [adminKey, activeTab]);
```

#### JSX panel

```tsx
{activeTab === "config" ? (
  <section className="admin-section" aria-labelledby="config-title">
    <div className="admin-section__header">
      <div>
        <h2 id="config-title">Feature Flags</h2>
        <p>Runtime overrides — reset on process restart. For permanent changes, update .env.</p>
      </div>
      <button className="admin-button" type="button" onClick={() => void loadFlags(adminKey)} disabled={loading}>
        Refresh
      </button>
    </div>
    <div className="admin-flags-list">
      {flags.map((flag) => (
        <div className="admin-flag-row" key={flag.name}>
          <div className="admin-flag-info">
            <code className="admin-flag-name">{flag.name}</code>
            {flag.overridden && <span className="admin-badge admin-badge--warning">overridden</span>}
            <small>default: {String(flag.default)}</small>
          </div>
          <div className="admin-flag-controls">
            <input
              className="admin-input admin-flag-input"
              type="text"
              value={flagDrafts[flag.name] ?? String(flag.value)}
              onChange={(e) => setFlagDrafts((prev) => ({ ...prev, [flag.name]: e.target.value }))}
            />
            <button
              className="admin-button"
              type="button"
              onClick={() => void saveFlag(adminKey, flag.name, flagDrafts[flag.name] ?? String(flag.value))}
              disabled={loading}
            >
              Save
            </button>
            {flag.overridden && (
              <button
                className="admin-button admin-button--quiet"
                type="button"
                onClick={() => void resetFlag(adminKey, flag.name)}
                disabled={loading}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
) : null}
```

#### CSS to append to `web/app/admin/admin.css`

```css
.admin-flags-list { display: flex; flex-direction: column; gap: 0.75rem; }
.admin-flag-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem; background: var(--admin-card); border: 1px solid var(--admin-border); border-radius: 0.375rem; }
.admin-flag-info { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.admin-flag-name { font-size: 0.8rem; }
.admin-flag-controls { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.admin-flag-input { width: 120px; }
.admin-badge--warning { background: #fef3c7; color: #92400e; }
```

### 6.4 — Acceptance criteria

- `GET /api/v1/admin/flags` returns all 5 flags with defaults
- `PATCH /api/v1/admin/flags/maintenance_mode` with `{"value": true}` sets the flag
- `DELETE /api/v1/admin/flags/maintenance_mode/reset` resets to default
- Unknown flag names return 404
- Frontend Config tab shows all flags with edit + reset controls

---

## Phase 7 — System Health Dashboard

**Goal:** Single-glance system health: DB, scheduler, and recent errors.

### 7.1 — Health detail endpoint

**File:** `app/api/admin.py` — append:

```python
class ComponentHealth(BaseModel):
    name: str
    status: str          # "ok" | "warning" | "error"
    detail: str | None


class HealthDetailResponse(BaseModel):
    overall: str
    components: list[ComponentHealth]
    checked_at: str


@router.get("/health/detail", response_model=HealthDetailResponse, summary="Detailed system health for admin")
def get_health_detail(
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> HealthDetailResponse:
    components: list[ComponentHealth] = []

    # DB connectivity
    try:
        session.execute(text("SELECT 1"))
        components.append(ComponentHealth(name="database", status="ok", detail="Connection successful"))
    except Exception as exc:  # noqa: BLE001
        components.append(ComponentHealth(name="database", status="error", detail=str(exc)))

    # DB row counts (sanity check)
    try:
        user_count = session.execute(select(func.count()).select_from(User)).scalar_one()
        components.append(ComponentHealth(name="db_users", status="ok", detail=f"{user_count} users"))
    except Exception as exc:  # noqa: BLE001
        components.append(ComponentHealth(name="db_users", status="error", detail=str(exc)))

    # Scheduler leader lock (check if advisory lock is held by inspecting pg_locks)
    try:
        result = session.execute(
            text("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND granted=true")
        ).scalar_one()
        status_val = "ok" if result > 0 else "warning"
        detail = f"{result} advisory lock(s) held" if result > 0 else "No scheduler lock held — jobs may not be running"
        components.append(ComponentHealth(name="scheduler_lock", status=status_val, detail=detail))
    except Exception:  # noqa: BLE001
        components.append(ComponentHealth(name="scheduler_lock", status="warning", detail="Could not check lock (non-PostgreSQL DB)"))

    # Settings guard
    settings = get_settings()
    if settings.environment == "production" and settings.admin_api_key == "CHANGE_ME_ADMIN_KEY":
        components.append(ComponentHealth(name="secrets", status="error", detail="Default admin key in production"))
    else:
        components.append(ComponentHealth(name="secrets", status="ok", detail="Secrets appear configured"))

    overall = "ok"
    if any(c.status == "error" for c in components):
        overall = "error"
    elif any(c.status == "warning" for c in components):
        overall = "warning"

    return HealthDetailResponse(
        overall=overall,
        components=components,
        checked_at=datetime.now(UTC).isoformat(),
    )
```

### 7.2 — Frontend: Health tab (extend Overview or separate tab)

Add `"health"` to `AdminTab` and `{ id: "health", label: "Health" }` to `tabs` after `"overview"`.

#### Types to add

```typescript
type ComponentHealth = { name: string; status: "ok" | "warning" | "error"; detail: string | null };
type HealthDetailResponse = { overall: string; components: ComponentHealth[]; checked_at: string };
```

#### State to add

```typescript
const [healthDetail, setHealthDetail] = useState<HealthDetailResponse | null>(null);
```

#### Handler to add

```typescript
async function loadHealthDetail(key: string) {
  setLoading(true);
  try {
    const data = await adminFetchJson<HealthDetailResponse>("/api/v1/admin/health/detail", key);
    setHealthDetail(data);
  } catch (err) {
    setError(readErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
```

#### Effect to add

```typescript
useEffect(() => {
  if (!adminKey || activeTab !== "health") return;
  void loadHealthDetail(adminKey);
}, [adminKey, activeTab]);
```

#### JSX panel

```tsx
{activeTab === "health" ? (
  <section className="admin-section" aria-labelledby="health-title">
    <div className="admin-section__header">
      <div>
        <h2 id="health-title">System Health</h2>
        {healthDetail && (
          <p>
            Overall: <span className={`admin-badge admin-badge--${healthDetail.overall === "ok" ? "ok" : "danger"}`}>
              {healthDetail.overall.toUpperCase()}
            </span>
            {" "}as of {formatDateTimeLabel(healthDetail.checked_at)}
          </p>
        )}
      </div>
      <button className="admin-button" type="button" onClick={() => void loadHealthDetail(adminKey)} disabled={loading}>
        Refresh
      </button>
    </div>
    <div className="admin-health-list">
      {(healthDetail?.components ?? []).map((c) => (
        <div key={c.name} className={`admin-health-item admin-health-item--${c.status}`}>
          <div className="admin-health-name">
            <span className={`admin-dot admin-dot--${c.status === "ok" ? "ok" : "error"}`} />
            <code>{c.name}</code>
          </div>
          <span className="admin-health-detail">{c.detail ?? "—"}</span>
        </div>
      ))}
    </div>
  </section>
) : null}
```

#### CSS to append to `web/app/admin/admin.css`

```css
.admin-health-list { display: flex; flex-direction: column; gap: 0.5rem; }
.admin-health-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: 0.375rem; border: 1px solid var(--admin-border); }
.admin-health-item--ok { border-color: #d1fae5; background: #f0fdf4; }
.admin-health-item--warning { border-color: #fde68a; background: #fffbeb; }
.admin-health-item--error { border-color: #fecaca; background: #fef2f2; }
.admin-health-name { display: flex; align-items: center; gap: 0.5rem; }
.admin-health-detail { color: var(--admin-muted); font-size: 0.875rem; }
```

### 7.3 — Acceptance criteria

- `GET /api/v1/admin/health/detail` returns component status list with overall summary
- DB error causes `"overall": "error"` instead of `"ok"`
- Frontend Health tab shows colour-coded component rows

---

## Final checklist — after all phases complete

### Backend

- [ ] All new models imported in `app/models/__init__.py` and added to `__all__`
- [ ] All new routers registered in `app/main.py`
- [ ] Both new Alembic migrations applied to test DB and verified
- [ ] `is_suspended` check is in `get_current_user` in `app/core/auth.py`
- [ ] `log_admin_action` called in every mutating endpoint
- [ ] No endpoint bypasses `get_admin_user` dependency

### Frontend

- [ ] `AdminTab` type includes all 8 tabs: `overview | health | users | analytics | feedback | operations | notifications | config | audit | privacy`
- [ ] `tabs` array matches `AdminTab` with correct order and labels
- [ ] Each tab's `useEffect` only loads data when `activeTab` matches
- [ ] `adminFetchJson` used for all API calls (no plain `fetch` in admin code)
- [ ] All new CSS added to `web/app/admin/admin.css`

### Testing

Run against test DB:

```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
alembic upgrade head
python -m pytest tests/test_admin_api.py -v
```

All existing admin tests must still pass. Add tests for:
- User list endpoint returns paginated results
- User suspension rejects login
- Analytics endpoints return correct shapes
- Audit log records actions
- Flag set/reset round-trips

### Security review

- Confirm `get_admin_user` is on every new endpoint (no endpoint uses only `get_current_user`)
- Confirm no user PII is logged in `payload_summary` (IDs are OK, email/birth data is not)
- Confirm broadcast notification has rate-limit awareness (no tight loop without token check)
- Confirm `maintenance_mode` flag is wired into the app request path if enabled (add middleware check)

---

## Tab order (final UI)

```
Overview | Health | Users | Analytics | Feedback | Operations | Notifications | Config | Audit Log | Privacy
```

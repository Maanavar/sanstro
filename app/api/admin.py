"""Sprint 10 — admin and data-deletion endpoints.

Provides:
  DELETE /admin/users/{owner_user_id}/data  — wipe all birth profiles,
    charts, family vaults, members, and daily scores owned by a user.
  GET  /admin/stats                          — basic aggregate counts
    for internal monitoring (beta admin dashboard).

These endpoints are internal-only. In production, protect them behind an
admin API key or network policy before exposing to the internet.
"""
from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_admin_user
from app.db.session import get_db
from app.models import BirthProfile, Chart, FamilyMember, FamilyVault, User
from app.models.family_daily_score import FamilyDailyScore

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Schemas ──────────────────────────────────────────────────────────────────


class DataDeletionResult(BaseModel):
    owner_user_id: str
    deleted_at: str
    birth_profiles_deleted: int
    charts_deleted: int
    family_vaults_deleted: int
    family_members_deleted: int
    family_daily_scores_deleted: int


class AdminStats(BaseModel):
    total_users: int
    total_birth_profiles: int
    total_charts: int
    total_family_vaults: int
    total_family_members: int
    as_of: str


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.delete(
    "/users/{owner_user_id}/data",
    response_model=DataDeletionResult,
    status_code=status.HTTP_200_OK,
    summary="Delete all data for a user (GDPR erasure)",
)
def delete_user_data(
    owner_user_id: UUID,
    session: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
) -> DataDeletionResult:
    """Permanently delete all birth profiles, charts, family vaults, and
    associated records owned by the specified user.

    The User row itself is retained (soft identity) to prevent orphaned
    foreign-key references in audit logs. Only calculation and personal
    data is erased.
    """
    with session.begin():
        # Verify the user exists
        user = session.get(User, owner_user_id)
        if user is None:
            raise HTTPException(status_code=404, detail=f"User '{owner_user_id}' not found.")

        # Count and delete family daily scores tied to vaults owned by this user
        vault_ids = [
            row[0]
            for row in session.execute(
                select(FamilyVault.family_vault_id).where(FamilyVault.owner_user_id == owner_user_id)
            ).all()
        ]
        fds_deleted = 0
        for vid in vault_ids:
            rows = session.execute(
                select(FamilyDailyScore).where(FamilyDailyScore.family_vault_id == vid)
            ).scalars().all()
            for row in rows:
                session.delete(row)
            fds_deleted += len(rows)

        # Delete family members
        members = session.execute(
            select(FamilyMember).where(FamilyMember.owner_user_id == owner_user_id)
        ).scalars().all()
        for m in members:
            session.delete(m)

        # Delete family vaults
        vaults = session.execute(
            select(FamilyVault).where(FamilyVault.owner_user_id == owner_user_id)
        ).scalars().all()
        for v in vaults:
            session.delete(v)

        # Delete charts linked to user's birth profiles
        profile_ids = [
            row[0]
            for row in session.execute(
                select(BirthProfile.birth_profile_id).where(BirthProfile.owner_user_id == owner_user_id)
            ).all()
        ]
        charts_deleted = 0
        for pid in profile_ids:
            charts = session.execute(
                select(Chart).where(Chart.birth_profile_id == pid)
            ).scalars().all()
            for c in charts:
                session.delete(c)
            charts_deleted += len(charts)

        # Delete birth profiles
        profiles = session.execute(
            select(BirthProfile).where(BirthProfile.owner_user_id == owner_user_id)
        ).scalars().all()
        for p in profiles:
            session.delete(p)

    return DataDeletionResult(
        owner_user_id=str(owner_user_id),
        deleted_at=datetime.now(UTC).isoformat(),
        birth_profiles_deleted=len(profiles),
        charts_deleted=charts_deleted,
        family_vaults_deleted=len(vaults),
        family_members_deleted=len(members),
        family_daily_scores_deleted=fds_deleted,
    )


@router.get(
    "/stats",
    response_model=AdminStats,
    summary="Aggregate record counts for admin dashboard",
)
def get_admin_stats(session: Session = Depends(get_db), _: User = Depends(get_admin_user)) -> AdminStats:
    """Return aggregate counts of all major record types.

    Used by the internal admin dashboard to monitor beta data growth.
    """
    def count(model):
        return session.execute(select(func.count()).select_from(model)).scalar_one()

    return AdminStats(
        total_users=count(User),
        total_birth_profiles=count(BirthProfile),
        total_charts=count(Chart),
        total_family_vaults=count(FamilyVault),
        total_family_members=count(FamilyMember),
        as_of=datetime.now(UTC).isoformat(),
    )

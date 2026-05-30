from __future__ import annotations

import re
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import RASI_NAMES
from app.models import BirthProfile, Chart, FamilyMember, FamilyVault, JournalEntry
from app.schemas.dasha import ResponseMeta
from app.schemas.journal import (
    FamilyVaultJournalResponse,
    FamilyVaultJournalSummaryResponse,
    JournalAnchorData,
    JournalCreateResponse,
    JournalDeleteData,
    JournalDeleteResponse,
    JournalEntryData,
    JournalExportEntryData,
    JournalExportResponse,
    JournalListData,
    JournalListResponse,
    JournalPromptItem,
    JournalPromptText,
    JournalPromptsResponse,
    JournalRetentionApplyResponse,
)
from app.services.chart_service import load_persisted_chart_response

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"

_TAG_PATTERNS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("career_focus", ("career", "job", "work", "promotion", "interview", "office", "boss")),
    ("relationship_care", ("relationship", "spouse", "partner", "love", "family", "mother", "father")),
    ("health_routine", ("health", "sleep", "diet", "exercise", "stress", "anxiety")),
    ("finance_planning", ("money", "budget", "expense", "finance", "loan", "savings", "salary")),
    ("education_growth", ("study", "exam", "education", "learning", "course", "training")),
    ("spiritual_balance", ("prayer", "temple", "meditation", "mantra", "silence", "gratitude")),
)

_PROMPT_TEMPLATES: dict[str, dict[str, tuple[tuple[str, str], tuple[str, str], tuple[str, str]]]] = {
    "career": {
        "SUPPORTIVE": (
            (
                "Indru velaiyil nandraaga nadandha oru seyal enna? adhai eppadi thodaralaam?",
                "What went well in work today, and how can you continue that momentum?",
            ),
            (
                "Inru kidaitha oru siru nambikkai signal-ai ezhudhunga.",
                "Write one small signal of confidence you noticed today.",
            ),
            (
                "Naalai munnurimai 1 task-ai amaidhiyaga eppadi mudikka poringa?",
                "How will you complete tomorrow's top priority task with calm focus?",
            ),
        ),
        "CAUTION": (
            (
                "Velai pressure nerathil ungalukku amaidhi kodutha oru nadavadikkai enna?",
                "During pressure at work, what action helped you stay calm?",
            ),
            (
                "Indru thallivaittha oru thevaiyatra pani enna? adhu ungalukku eppadi udhavi seithadhu?",
                "What non-essential task did you postpone today, and how did that help?",
            ),
            (
                "Naalai over-commit aagamal irukka oru varambu ezhudhunga.",
                "Write one boundary for tomorrow to avoid over-commitment.",
            ),
        ),
    },
    "relationship": {
        "SUPPORTIVE": (
            (
                "Indru uravil nandraaga purindhukonda oru nimidam enna?",
                "What was one moment of better understanding in a relationship today?",
            ),
            (
                "Nanri solla vendiya oruvarai patri oru variyil ezhudhunga.",
                "Write one line of appreciation for someone important to you.",
            ),
            (
                "Naalai amaidhiyaana pesudhalukku oru kurippu seiyunga.",
                "Note one intention for calm communication tomorrow.",
            ),
        ),
        "CAUTION": (
            (
                "Inru unarvu melum varumbodhu neenga edutha pause enna?",
                "When emotions rose today, what pause helped you respond better?",
            ),
            (
                "Thavaraana puridhal varakkoodiya idam enna? adhai eppadi theliva paduthalaam?",
                "Where could misunderstanding arise, and how can you clarify it gently?",
            ),
            (
                "Naalai uravukku oru siru supportive seyal enna?",
                "What is one small supportive action you can take for a relationship tomorrow?",
            ),
        ),
    },
    "exam": {
        "SUPPORTIVE": (
            (
                "Indru nandraaga paditha oru topic enna? adhai eppadi thodaralaam?",
                "What topic did you study well today, and how can you build on it?",
            ),
            (
                "Padippu neram eppadippattu irundhadhu? kavanam sellum neram edhuvum irundhadha?",
                "How was your study focus today? Was there a time when concentration was sharp?",
            ),
            (
                "Naalai padippukku oru siriya munn-thayarippu enna?",
                "What is one small preparation you can do tonight for tomorrow's study?",
            ),
        ),
        "CAUTION": (
            (
                "Indru padippil kavanam seluththa kashtamaaga irundhadha? enn?",
                "Did you find it hard to focus on studies today? What got in the way?",
            ),
            (
                "Oru siriya, eludhina padippu neer-velai naalai muthal thodangu.",
                "Start with one small, written revision task tomorrow.",
            ),
            (
                "Munn-padam padithadhai oru varisai padamaga ezhudhi paarunga.",
                "Write a brief outline of what you've covered so far.",
            ),
        ),
    },
    "financial": {
        "SUPPORTIVE": (
            (
                "Indru pana payanippu sari seitha oru seyal enna?",
                "What was one action today that used money well?",
            ),
            (
                "Ungal siriya semippe kurigu oru nambikkai signal ezhudhunga.",
                "Write one signal of progress toward your savings intention.",
            ),
            (
                "Naalai mudhaleeddu athava semippu kuriththu oru theirvu seiyunga.",
                "Make one small decision tomorrow toward your investment or savings goal.",
            ),
        ),
        "CAUTION": (
            (
                "Indru thevayillatha suttu enna? adhai eppadi thallivaikkalaam?",
                "What unnecessary expense tempted you today? How can you avoid it tomorrow?",
            ),
            (
                "Oru siriya pana munn-thayarippu — indru irave ezhudhunga.",
                "Write one small financial intention for tonight.",
            ),
            (
                "Mudhaleeddu athava kadan kuriththu oru kavanam irukkirkka?",
                "Is there an investment or debt that needs your attention soon?",
            ),
        ),
    },
}

_DEFAULT_PROMPTS: dict[str, tuple[tuple[str, str], tuple[str, str], tuple[str, str]]] = {
    "SUPPORTIVE": (
        (
            "Inru nandraaga nadandha moonru siru vishayangalai ezhudhunga.",
            "Write three small things that went well today.",
        ),
        (
            "Ungal balaththai kaattum oru seyalai kurippidunga.",
            "Note one action today that reflected your strengths.",
        ),
        (
            "Naalai amaidhiyaga thodaravendiya oru nalla pazhakkam enna?",
            "What one useful habit will you continue tomorrow with calm consistency?",
        ),
    ),
    "CAUTION": (
        (
            "Inru energy kuraindha neram eppodhu? adhai neenga eppadi handle seithinga?",
            "When did your energy dip today, and how did you handle it?",
        ),
        (
            "Indru avoid seitha oru avasara mudivu enna?",
            "What rushed decision did you avoid today?",
        ),
        (
            "Naalai ungalukku support aagum oru siru routine-ai ezhudhunga.",
            "Write one small routine that will support you tomorrow.",
        ),
    ),
}


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _assert_vault_owner(session: Session, family_vault_id: UUID, owner_user_id: UUID) -> FamilyVault:
    vault = session.get(FamilyVault, family_vault_id)
    if vault is None or vault.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family vault not found.")
    if vault.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return vault


def _owned_journal_entry(session: Session, owner_user_id: UUID, journal_id: UUID) -> JournalEntry:
    row = session.get(JournalEntry, journal_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    if row.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return row


def _extract_tags(note_text: str, life_area: str) -> list[str]:
    text = note_text.lower()
    tags: list[str] = []
    for tag, keywords in _TAG_PATTERNS:
        for keyword in keywords:
            if re.search(rf"\b{re.escape(keyword)}\b", text):
                tags.append(tag)
                break
    life_area_tag = f"life_area_{life_area}"
    if life_area_tag not in tags:
        tags.insert(0, life_area_tag)
    if not tags:
        tags.append("reflection")
    return tags[:8]


def _anchor_payload(chart_snapshot: object, entry_date: date) -> JournalAnchorData:
    birth_timezone = chart_snapshot.data.birth_profile.birth_timezone
    tz = resolve_timezone(birth_timezone)
    local_noon = datetime.combine(entry_date, time(12, 0), tzinfo=tz)
    jd = utc_datetime_to_julian_day(local_noon.astimezone(UTC))
    transit = calculate_sidereal_planets(jd)

    natal_moon = next(p for p in chart_snapshot.data.planets if p.graha == "MOON")
    timeline = calculate_vimshottari_timeline(chart_snapshot.data.julian_day, natal_moon.absolute_longitude, jd)
    active_dasha = (
        f"{timeline.current_mahadasha.lord}/"
        f"{timeline.current_antardasha.lord}/"
        f"{timeline.current_pratyantardasha.lord}"
    )

    transit_moon_rasi = transit.bodies["MOON"].rasi
    transit_saturn_rasi = transit.bodies["SATURN"].rasi
    return JournalAnchorData(
        activeDasha=active_dasha,
        moonHouseFromMoon=house_from_reference(natal_moon.rasi, transit_moon_rasi),
        saturnHouseFromMoon=house_from_reference(natal_moon.rasi, transit_saturn_rasi),
        moonRasi=RASI_NAMES[transit_moon_rasi],
        saturnRasi=RASI_NAMES[transit_saturn_rasi],
    )


def _to_data(row: JournalEntry) -> JournalEntryData:
    return JournalEntryData(
        journalId=row.journal_id,
        chartId=row.chart_id,
        entryDate=row.entry_date,
        lifeArea=row.life_area,
        noteText=row.note_text,
        tags=row.tags,
        anchor=JournalAnchorData(**row.anchor_payload),
        createdAt=row.created_at,
    )


def _to_export_data(row: JournalEntry) -> JournalExportEntryData:
    return JournalExportEntryData(
        journalId=row.journal_id,
        chartId=row.chart_id,
        entryDate=row.entry_date,
        lifeArea=row.life_area,
        noteText=row.note_text,
        tags=row.tags,
        anchor=JournalAnchorData(**row.anchor_payload),
        createdAt=row.created_at,
        updatedAt=row.updated_at,
        deletedAt=row.deleted_at,
    )


def _prompt_bucket(score_label: str) -> str:
    if score_label in {"STRONG_SUPPORT", "GOOD"}:
        return "SUPPORTIVE"
    if score_label in {"CAUTION", "RESTORATIVE"}:
        return "CAUTION"
    return "SUPPORTIVE"


def create_journal_entry(
    session: Session,
    owner_user_id: UUID,
    *,
    chart_id: UUID,
    entry_date: date,
    life_area: str,
    note_text: str,
) -> JournalCreateResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    tags = _extract_tags(note_text, life_area)
    anchor = _anchor_payload(chart_snapshot, entry_date)

    entry = JournalEntry(
        owner_user_id=owner_user_id,
        chart_id=chart_id,
        entry_date=entry_date,
        life_area=life_area,
        note_text=note_text.strip(),
        tags=tags,
        anchor_payload=anchor.model_dump(mode="json", by_alias=True),
    )
    session.add(entry)
    session.flush()

    return JournalCreateResponse(data=_to_data(entry), meta=_meta())


def list_journal_entries(
    session: Session,
    owner_user_id: UUID,
    *,
    chart_id: UUID,
    life_area: str | None,
    start_date: date | None,
    end_date: date | None,
    include_archived: bool,
    limit: int,
) -> JournalListResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)

    query = select(JournalEntry).where(
        JournalEntry.owner_user_id == owner_user_id,
        JournalEntry.chart_id == chart_id,
    )
    if not include_archived:
        query = query.where(JournalEntry.deleted_at.is_(None))
    if life_area is not None:
        query = query.where(JournalEntry.life_area == life_area)
    if start_date is not None:
        query = query.where(JournalEntry.entry_date >= start_date)
    if end_date is not None:
        query = query.where(JournalEntry.entry_date <= end_date)

    rows = session.execute(
        query.order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc()).limit(limit)
    ).scalars().all()

    items = [_to_data(row) for row in rows]
    return JournalListResponse(
        data=JournalListData(
            chartId=chart_id,
            totalCount=len(items),
            items=items,
        ),
        meta=_meta(),
    )


def update_journal_entry(
    session: Session,
    owner_user_id: UUID,
    *,
    journal_id: UUID,
    entry_date: date | None,
    life_area: str | None,
    note_text: str | None,
) -> JournalCreateResponse:
    row = _owned_journal_entry(session, owner_user_id, journal_id)
    chart_snapshot = load_persisted_chart_response(session, row.chart_id)

    new_entry_date = entry_date or row.entry_date
    new_life_area = life_area or row.life_area
    new_note_text = note_text.strip() if note_text is not None else row.note_text

    row.entry_date = new_entry_date
    row.life_area = new_life_area
    row.note_text = new_note_text
    row.tags = _extract_tags(new_note_text, new_life_area)
    row.anchor_payload = _anchor_payload(chart_snapshot, new_entry_date).model_dump(mode="json", by_alias=True)
    session.flush()

    return JournalCreateResponse(data=_to_data(row), meta=_meta())


def archive_journal_entry(
    session: Session,
    owner_user_id: UUID,
    *,
    journal_id: UUID,
) -> JournalDeleteResponse:
    row = _owned_journal_entry(session, owner_user_id, journal_id)
    row.deleted_at = datetime.now(tz=UTC)
    session.flush()
    return JournalDeleteResponse(
        data=JournalDeleteData(journalId=row.journal_id, deletedAt=row.deleted_at),
        meta=_meta(),
    )


def apply_journal_retention_window(
    session: Session,
    owner_user_id: UUID,
    *,
    chart_id: UUID,
    keep_days: int,
    as_of_date: date,
    dry_run: bool,
) -> JournalRetentionApplyResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    threshold = as_of_date - timedelta(days=keep_days)

    rows = session.execute(
        select(JournalEntry).where(
            JournalEntry.owner_user_id == owner_user_id,
            JournalEntry.chart_id == chart_id,
            JournalEntry.deleted_at.is_(None),
            JournalEntry.entry_date < threshold,
        )
    ).scalars().all()

    matched = len(rows)
    archived = 0
    if not dry_run:
        now = datetime.now(tz=UTC)
        for row in rows:
            row.deleted_at = now
            archived += 1
        session.flush()

    return JournalRetentionApplyResponse(
        data={
            "chartId": chart_id,
            "keepDays": keep_days,
            "thresholdDate": threshold,
            "matchedCount": matched,
            "archivedCount": archived,
            "dryRun": dry_run,
        },
        meta=_meta(),
    )


_GOAL_TRACK_TO_LIFE_AREA: dict[str, str] = {
    "CAREER": "career",
    "EXAM": "exam",
    "RELATIONSHIP": "relationship",
    "FINANCIAL": "financial",
}


def build_journal_prompts(
    *,
    chart_id: UUID,
    on_date: date,
    life_area: str,
    score_label: str,
    goal_track: str | None = None,
) -> JournalPromptsResponse:
    bucket = _prompt_bucket(score_label)
    # When life_area is generic and a goal_track is set, bias toward track-specific prompts
    effective_area = life_area
    if effective_area == "general" and goal_track:
        effective_area = _GOAL_TRACK_TO_LIFE_AREA.get(goal_track, life_area)
    template = _PROMPT_TEMPLATES.get(effective_area, {}).get(bucket, _DEFAULT_PROMPTS[bucket])

    prompts = [
        JournalPromptItem(
            promptId=f"{life_area}:{bucket.lower()}:{idx+1}",
            category=bucket,
            text=JournalPromptText(ta=ta, en=en),
        )
        for idx, (ta, en) in enumerate(template)
    ]

    return JournalPromptsResponse(
        data={
            "chartId": chart_id,
            "dateLocal": on_date,
            "lifeArea": life_area,
            "scoreLabel": score_label,
            "prompts": prompts,
        },
        meta=_meta(),
    )


def export_journal_entries(
    session: Session,
    owner_user_id: UUID,
    *,
    chart_id: UUID | None,
    from_date: date | None,
    to_date: date | None,
    include_archived: bool,
    limit: int,
) -> JournalExportResponse:
    if chart_id is not None:
        _assert_chart_owner(session, chart_id, owner_user_id)

    query = select(JournalEntry).where(JournalEntry.owner_user_id == owner_user_id)
    if chart_id is not None:
        query = query.where(JournalEntry.chart_id == chart_id)
    if not include_archived:
        query = query.where(JournalEntry.deleted_at.is_(None))
    if from_date is not None:
        query = query.where(JournalEntry.entry_date >= from_date)
    if to_date is not None:
        query = query.where(JournalEntry.entry_date <= to_date)

    rows = session.execute(
        query.order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc()).limit(limit)
    ).scalars().all()
    items = [_to_export_data(row) for row in rows]

    return JournalExportResponse(
        data={
            "ownerUserId": owner_user_id,
            "chartId": chart_id,
            "fromDate": from_date,
            "toDate": to_date,
            "includeArchived": include_archived,
            "totalCount": len(items),
            "items": items,
        },
        meta=_meta(),
    )


def list_family_vault_journal_entries(
    session: Session,
    owner_user_id: UUID,
    *,
    family_vault_id: UUID,
    family_member_id: UUID | None,
    include_archived: bool,
    limit: int,
) -> FamilyVaultJournalResponse:
    _assert_vault_owner(session, family_vault_id, owner_user_id)
    if family_member_id is not None:
        member = session.get(FamilyMember, family_member_id)
        if (
            member is None
            or member.deleted_at is not None
            or member.family_vault_id != family_vault_id
            or member.owner_user_id != owner_user_id
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found.")

    query = (
        select(JournalEntry, FamilyMember, BirthProfile)
        .join(Chart, Chart.chart_id == JournalEntry.chart_id)
        .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
        .join(FamilyMember, FamilyMember.family_member_id == BirthProfile.family_member_id)
        .where(
            JournalEntry.owner_user_id == owner_user_id,
            FamilyMember.owner_user_id == owner_user_id,
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.deleted_at.is_(None),
            BirthProfile.deleted_at.is_(None),
        )
    )
    if family_member_id is not None:
        query = query.where(FamilyMember.family_member_id == family_member_id)
    if not include_archived:
        query = query.where(JournalEntry.deleted_at.is_(None))

    rows = session.execute(
        query.order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc()).limit(limit)
    ).all()

    items = [
        {
            "journalId": journal.journal_id,
            "familyVaultId": family_vault_id,
            "familyMemberId": member.family_member_id,
            "memberDisplayName": member.display_name,
            "birthProfileId": profile.birth_profile_id,
            "chartId": journal.chart_id,
            "entryDate": journal.entry_date,
            "lifeArea": journal.life_area,
            "noteText": journal.note_text,
            "tags": journal.tags,
            "createdAt": journal.created_at,
            "deletedAt": journal.deleted_at,
        }
        for journal, member, profile in rows
    ]

    return FamilyVaultJournalResponse(
        data={
            "familyVaultId": family_vault_id,
            "includeArchived": include_archived,
            "totalCount": len(items),
            "items": items,
        },
        meta=_meta(),
    )


def list_family_vault_journal_summary(
    session: Session,
    owner_user_id: UUID,
    *,
    family_vault_id: UUID,
    from_date: date | None,
    to_date: date | None,
    include_archived: bool,
) -> FamilyVaultJournalSummaryResponse:
    _assert_vault_owner(session, family_vault_id, owner_user_id)

    query = (
        select(
            JournalEntry.life_area.label("life_area"),
            func.count(JournalEntry.journal_id).label("entry_count"),
        )
        .join(Chart, Chart.chart_id == JournalEntry.chart_id)
        .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
        .join(FamilyMember, FamilyMember.family_member_id == BirthProfile.family_member_id)
        .where(
            JournalEntry.owner_user_id == owner_user_id,
            FamilyMember.owner_user_id == owner_user_id,
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.deleted_at.is_(None),
            BirthProfile.deleted_at.is_(None),
        )
    )
    if not include_archived:
        query = query.where(JournalEntry.deleted_at.is_(None))
    if from_date is not None:
        query = query.where(JournalEntry.entry_date >= from_date)
    if to_date is not None:
        query = query.where(JournalEntry.entry_date <= to_date)

    rows = session.execute(
        query.group_by(JournalEntry.life_area).order_by(func.count(JournalEntry.journal_id).desc(), JournalEntry.life_area.asc())
    ).all()

    life_area_counts = [{"lifeArea": life_area, "count": count} for life_area, count in rows]
    total_entries = sum(count for _life_area, count in rows)

    return FamilyVaultJournalSummaryResponse(
        data={
            "familyVaultId": family_vault_id,
            "includeArchived": include_archived,
            "fromDate": from_date,
            "toDate": to_date,
            "totalEntries": total_entries,
            "lifeAreaCounts": life_area_counts,
        },
        meta=_meta(),
    )

from __future__ import annotations

from sqlalchemy import BigInteger, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Place(Base):
    """A GeoNames-derived populated place, used for offline birthplace search.

    Public reference data, not user data — `latitude`/`longitude` here are
    plain columns, unlike `BirthProfile.birth_latitude/longitude` which are
    encrypted. `geoname_id` is GeoNames' own stable identifier, kept as the
    primary key so a re-ingestion can upsert in place rather than duplicate.
    """

    __tablename__ = "places"
    __table_args__ = (
        # `varchar_pattern_ops`, not a plain btree: under this DB's default
        # (non-C) locale collation, a plain btree index cannot serve a
        # `LIKE 'prefix%'` scan at all — confirmed via EXPLAIN, Postgres fell
        # back to a full table scan even with the planner forced away from
        # one. `population` isn't in this index; it only orders the (small)
        # already-filtered result set, which Postgres sorts in memory.
        Index("idx_places_search_key_pattern", "search_key", postgresql_ops={"search_key": "varchar_pattern_ops"}),
    )

    # `autoincrement=False`: this is GeoNames' own stable identifier, always
    # supplied by the ingestion script, never generated locally. Without this,
    # SQLAlchemy's default for an integer primary key creates a DB sequence,
    # which would silently backfill a bogus value on any insert that omits it.
    geoname_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # Lowercased, ASCII-folded `name`, used only for the prefix-match index —
    # never displayed. Keeps the search index working for names typed without
    # diacritics against source data that has them.
    search_key: Mapped[str] = mapped_column(String(200), nullable=False)
    admin1_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    country_name: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    population: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

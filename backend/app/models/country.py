"""
Country and Border SQLAlchemy models.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Country(Base, UUIDMixin, TimestampMixin):
    """
    Country model storing all 197 UN-recognized countries.
    Includes Arabic and English names, geographic data, and flag emoji.
    """

    __tablename__ = "countries"

    # ISO 3166-1 alpha-3 code (e.g., "SAU", "EGY")
    code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False)

    # Names
    name_ar: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ar_normalized: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # Without diacritics for search

    # Geographic data
    continent: Mapped[str | None] = mapped_column(String(50))
    region: Mapped[str | None] = mapped_column(String(100))
    population: Mapped[int | None] = mapped_column(BigInteger)
    area_km2: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))

    # Capital
    capital_ar: Mapped[str | None] = mapped_column(String(100))
    capital_en: Mapped[str | None] = mapped_column(String(100))

    # Flag
    flag_emoji: Mapped[str | None] = mapped_column(String(10))

    # Relationships
    borders_from: Mapped[list["Border"]] = relationship(
        "Border",
        foreign_keys="Border.country_a_id",
        back_populates="country_a",
        cascade="all, delete-orphan",
    )
    borders_to: Mapped[list["Border"]] = relationship(
        "Border",
        foreign_keys="Border.country_b_id",
        back_populates="country_b",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Country {self.code}: {self.name_ar} ({self.name_en})>"

    @property
    def all_neighbors(self) -> list["Country"]:
        """Get all neighboring countries (both directions)."""
        neighbors = []
        for border in self.borders_from:
            neighbors.append(border.country_b)
        for border in self.borders_to:
            neighbors.append(border.country_a)
        return neighbors


class Border(Base, UUIDMixin):
    """
    Border model representing connections between countries.
    Stored as graph edges for path-finding algorithms.
    """

    __tablename__ = "borders"

    # Foreign keys to countries
    country_a_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("countries.id", ondelete="CASCADE"),
        nullable=False,
    )
    country_b_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("countries.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Border type
    border_type: Mapped[str] = mapped_column(
        String(50), default="land"
    )  # land, bridge, tunnel, ferry

    # Relationships
    country_a: Mapped["Country"] = relationship(
        "Country", foreign_keys=[country_a_id], back_populates="borders_from"
    )
    country_b: Mapped["Country"] = relationship(
        "Country", foreign_keys=[country_b_id], back_populates="borders_to"
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("country_a_id", "country_b_id", name="unique_border"),
        CheckConstraint("country_a_id < country_b_id", name="ordered_countries"),
    )

    def __repr__(self) -> str:
        return f"<Border {self.country_a_id} <-> {self.country_b_id} ({self.border_type})>"

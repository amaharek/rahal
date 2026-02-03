"""
CRUD operations for Country and Border models.
"""

from uuid import UUID

from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.country import Border, Country
from app.schemas.country import BorderCreate, CountryCreate


class CRUDCountry(CRUDBase[Country, CountryCreate, CountryCreate]):
    """CRUD operations for Country model."""

    async def get_by_code(self, db: AsyncSession, code: str) -> Country | None:
        """Get a country by its ISO code."""
        result = await db.execute(
            select(Country).where(Country.code == code.upper())
        )
        return result.scalar_one_or_none()

    async def get_by_name_ar(self, db: AsyncSession, name_ar: str) -> Country | None:
        """Get a country by its Arabic name."""
        result = await db.execute(
            select(Country).where(Country.name_ar == name_ar)
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        db: AsyncSession,
        query: str,
        *,
        limit: int = 10,
    ) -> list[Country]:
        """
        Search countries by Arabic name using trigram similarity.

        Args:
            db: Database session
            query: Search query (Arabic text)
            limit: Maximum results to return

        Returns:
            List of matching countries sorted by similarity
        """
        # Using PostgreSQL's pg_trgm for fuzzy search
        result = await db.execute(
            select(Country)
            .where(
                or_(
                    Country.name_ar.ilike(f"%{query}%"),
                    Country.name_ar_normalized.ilike(f"%{query}%"),
                    Country.name_en.ilike(f"%{query}%"),
                )
            )
            .order_by(
                # Prioritize exact matches, then starts with, then contains
                text(
                    f"CASE "
                    f"WHEN name_ar = '{query}' THEN 0 "
                    f"WHEN name_ar_normalized = '{query}' THEN 1 "
                    f"WHEN name_ar ILIKE '{query}%' THEN 2 "
                    f"WHEN name_ar_normalized ILIKE '{query}%' THEN 3 "
                    f"ELSE 4 END"
                )
            )
            .limit(limit)
        )
        return list(result.scalars().all())

    async def search_with_similarity(
        self,
        db: AsyncSession,
        query: str,
        *,
        limit: int = 10,
        min_similarity: float = 0.1,
    ) -> list[tuple[Country, float]]:
        """
        Search countries with similarity scores using pg_trgm.

        Args:
            db: Database session
            query: Search query
            limit: Maximum results
            min_similarity: Minimum similarity threshold (0-1)

        Returns:
            List of (Country, similarity_score) tuples
        """
        result = await db.execute(
            text(
                """
                SELECT c.*, similarity(c.name_ar_normalized, :query) as sim
                FROM countries c
                WHERE similarity(c.name_ar_normalized, :query) > :min_sim
                   OR c.name_ar ILIKE :like_query
                   OR c.name_ar_normalized ILIKE :like_query
                ORDER BY sim DESC
                LIMIT :limit
                """
            ).bindparams(
                query=query,
                min_sim=min_similarity,
                like_query=f"%{query}%",
                limit=limit,
            )
        )
        rows = result.fetchall()

        # Convert to Country objects with similarity scores
        countries_with_scores = []
        for row in rows:
            country = await self.get(db, row.id)
            if country:
                countries_with_scores.append((country, row.sim))
        return countries_with_scores

    async def get_all_with_borders(self, db: AsyncSession) -> list[Country]:
        """Get all countries with their border relationships loaded."""
        result = await db.execute(
            select(Country)
            .options(
                selectinload(Country.borders_from).selectinload(Border.country_b),
                selectinload(Country.borders_to).selectinload(Border.country_a),
            )
        )
        return list(result.scalars().unique().all())

    async def get_neighbors(self, db: AsyncSession, country_id: UUID) -> list[Country]:
        """Get all neighboring countries for a given country."""
        country = await db.execute(
            select(Country)
            .where(Country.id == country_id)
            .options(
                selectinload(Country.borders_from).selectinload(Border.country_b),
                selectinload(Country.borders_to).selectinload(Border.country_a),
            )
        )
        country_obj = country.scalar_one_or_none()
        if not country_obj:
            return []

        neighbors = []
        for border in country_obj.borders_from:
            neighbors.append(border.country_b)
        for border in country_obj.borders_to:
            neighbors.append(border.country_a)
        return neighbors


class CRUDBorder(CRUDBase[Border, BorderCreate, BorderCreate]):
    """CRUD operations for Border model."""

    async def get_by_countries(
        self,
        db: AsyncSession,
        country_a_id: UUID,
        country_b_id: UUID,
    ) -> Border | None:
        """Get border between two countries (order independent)."""
        # Ensure consistent ordering (smaller UUID first)
        if country_a_id > country_b_id:
            country_a_id, country_b_id = country_b_id, country_a_id

        result = await db.execute(
            select(Border).where(
                Border.country_a_id == country_a_id,
                Border.country_b_id == country_b_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_border(
        self,
        db: AsyncSession,
        country_a_id: UUID,
        country_b_id: UUID,
        border_type: str = "land",
    ) -> Border:
        """
        Create a border between two countries.
        Automatically orders the country IDs to satisfy the CHECK constraint.
        """
        # Ensure consistent ordering (smaller UUID first)
        if country_a_id > country_b_id:
            country_a_id, country_b_id = country_b_id, country_a_id

        border = Border(
            country_a_id=country_a_id,
            country_b_id=country_b_id,
            border_type=border_type,
        )
        db.add(border)
        await db.flush()
        await db.refresh(border)
        return border

    async def get_all_borders(self, db: AsyncSession) -> list[Border]:
        """Get all borders with country data loaded."""
        result = await db.execute(
            select(Border)
            .options(
                selectinload(Border.country_a),
                selectinload(Border.country_b),
            )
        )
        return list(result.scalars().all())


# Singleton instances
country_crud = CRUDCountry(Country)
border_crud = CRUDBorder(Border)

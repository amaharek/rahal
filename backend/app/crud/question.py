"""
CRUD operations for Question model.
"""

from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.question import Question, QuestionCategory, QuestionDifficulty, QuestionType
from app.schemas.question import QuestionCreate


class CRUDQuestion(CRUDBase[Question, QuestionCreate, QuestionCreate]):
    """CRUD operations for Question model."""

    async def get_random(
        self,
        db: AsyncSession,
        *,
        category: QuestionCategory | None = None,
        difficulty: QuestionDifficulty | None = None,
        question_type: QuestionType | None = None,
        exclude_ids: list[UUID] | None = None,
    ) -> Question | None:
        """
        Get a random active question with optional filters.

        Args:
            db: Database session
            category: Filter by category
            difficulty: Filter by difficulty
            question_type: Filter by question type
            exclude_ids: Question IDs to exclude

        Returns:
            Random question or None if no matches
        """
        query = select(Question).where(Question.is_active == True)

        if category:
            query = query.where(Question.category == category.value)
        if difficulty:
            query = query.where(Question.difficulty == difficulty.value)
        if question_type:
            query = query.where(Question.question_type == question_type.value)
        if exclude_ids:
            query = query.where(Question.id.not_in(exclude_ids))

        # Order randomly and get one
        query = query.order_by(func.random()).limit(1)

        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_random_batch(
        self,
        db: AsyncSession,
        count: int,
        *,
        category: QuestionCategory | None = None,
        difficulty: QuestionDifficulty | None = None,
        question_type: QuestionType | None = None,
        exclude_ids: list[UUID] | None = None,
    ) -> list[Question]:
        """
        Get multiple random questions.

        Args:
            db: Database session
            count: Number of questions to get
            category: Filter by category
            difficulty: Filter by difficulty
            question_type: Filter by question type
            exclude_ids: Question IDs to exclude

        Returns:
            List of random questions
        """
        query = select(Question).where(Question.is_active == True)

        if category:
            query = query.where(Question.category == category.value)
        if difficulty:
            query = query.where(Question.difficulty == difficulty.value)
        if question_type:
            query = query.where(Question.question_type == question_type.value)
        if exclude_ids:
            query = query.where(Question.id.not_in(exclude_ids))

        query = query.order_by(func.random()).limit(count)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_by_category(
        self,
        db: AsyncSession,
        category: QuestionCategory,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Question]:
        """Get questions by category."""
        result = await db.execute(
            select(Question)
            .where(
                and_(
                    Question.category == category.value,
                    Question.is_active == True,
                )
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_category(self, db: AsyncSession) -> dict[str, int]:
        """Count questions by category."""
        result = await db.execute(
            select(Question.category, func.count(Question.id))
            .where(Question.is_active == True)
            .group_by(Question.category)
        )
        return {row[0]: row[1] for row in result.fetchall()}

    async def count_by_difficulty(self, db: AsyncSession) -> dict[str, int]:
        """Count questions by difficulty."""
        result = await db.execute(
            select(Question.difficulty, func.count(Question.id))
            .where(Question.is_active == True)
            .group_by(Question.difficulty)
        )
        return {row[0]: row[1] for row in result.fetchall()}

    async def search_by_tags(
        self,
        db: AsyncSession,
        tags: list[str],
        *,
        match_all: bool = False,
        limit: int = 50,
    ) -> list[Question]:
        """
        Search questions by tags.

        Args:
            db: Database session
            tags: List of tags to search for
            match_all: If True, question must have all tags
            limit: Maximum results

        Returns:
            List of matching questions
        """
        query = select(Question).where(Question.is_active == True)

        if match_all:
            # Question must have ALL specified tags
            query = query.where(Question.tags.contains(tags))
        else:
            # Question must have ANY of the specified tags
            query = query.where(Question.tags.overlap(tags))

        query = query.limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def list_for_admin(
        self,
        db: AsyncSession,
        *,
        category: QuestionCategory | None = None,
        difficulty: QuestionDifficulty | None = None,
        question_type: QuestionType | None = None,
        is_active: bool | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Question], int]:
        """List questions for admin with filters and total count."""
        filters = []

        if category:
            filters.append(Question.category == category.value)
        if difficulty:
            filters.append(Question.difficulty == difficulty.value)
        if question_type:
            filters.append(Question.question_type == question_type.value)
        if is_active is not None:
            filters.append(Question.is_active == is_active)
        if search:
            like_value = f"%{search.strip()}%"
            filters.append(
                or_(
                    Question.question_ar.ilike(like_value),
                    Question.correct_answer.ilike(like_value),
                )
            )

        base_query = select(Question)
        count_query = select(func.count(Question.id))

        if filters:
            base_query = base_query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        base_query = base_query.order_by(Question.updated_at.desc()).offset(skip).limit(limit)

        result = await db.execute(base_query)
        items = list(result.scalars().all())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        return items, total


# Singleton instance
question_crud = CRUDQuestion(Question)

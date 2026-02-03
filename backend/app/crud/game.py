"""
CRUD operations for Game-related models.
"""

from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.game import DailyChallenge, GameResult, QuizResult
from app.models.question import Question


class CRUDDailyChallenge(CRUDBase[DailyChallenge, DailyChallenge, DailyChallenge]):
    """CRUD operations for DailyChallenge model."""

    async def get_by_date(
        self,
        db: AsyncSession,
        challenge_date: date,
    ) -> DailyChallenge | None:
        """Get challenge for a specific date."""
        result = await db.execute(
            select(DailyChallenge)
            .where(DailyChallenge.challenge_date == challenge_date)
            .options(
                selectinload(DailyChallenge.start_country),
                selectinload(DailyChallenge.end_country),
            )
        )
        return result.scalar_one_or_none()

    async def get_today(self, db: AsyncSession) -> DailyChallenge | None:
        """Get today's challenge."""
        return await self.get_by_date(db, date.today())

    async def get_recent(
        self,
        db: AsyncSession,
        *,
        days: int = 7,
    ) -> list[DailyChallenge]:
        """Get recent challenges."""
        result = await db.execute(
            select(DailyChallenge)
            .options(
                selectinload(DailyChallenge.start_country),
                selectinload(DailyChallenge.end_country),
            )
            .order_by(desc(DailyChallenge.challenge_date))
            .limit(days)
        )
        return list(result.scalars().all())

    async def create_challenge(
        self,
        db: AsyncSession,
        *,
        challenge_date: date,
        start_country_id: UUID,
        end_country_id: UUID,
        shortest_path: int,
        solution_path: list[str] | None = None,
    ) -> DailyChallenge:
        """Create a new daily challenge."""
        challenge = DailyChallenge(
            challenge_date=challenge_date,
            start_country_id=start_country_id,
            end_country_id=end_country_id,
            shortest_path=shortest_path,
            solution_path=solution_path,
        )
        db.add(challenge)
        await db.flush()
        await db.refresh(challenge)
        return challenge


class CRUDGameResult(CRUDBase[GameResult, GameResult, GameResult]):
    """CRUD operations for GameResult model."""

    async def get_by_user_and_challenge(
        self,
        db: AsyncSession,
        user_id: UUID | None,
        challenge_id: UUID,
    ) -> GameResult | None:
        """Get game result for a specific user and challenge."""
        if user_id is None:
            return None
        result = await db.execute(
            select(GameResult).where(
                GameResult.user_id == user_id,
                GameResult.challenge_id == challenge_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_or_create_for_user(
        self,
        db: AsyncSession,
        user_id: UUID | None,
        challenge_id: UUID,
    ) -> GameResult:
        """Get existing game result or create a new one."""
        if user_id:
            existing = await self.get_by_user_and_challenge(db, user_id, challenge_id)
            if existing:
                return existing

        # Create new result
        game_result = GameResult(
            user_id=user_id,
            challenge_id=challenge_id,
            guesses=[],
            total_guesses=0,
            hints_used=0,
            completed=False,
        )
        db.add(game_result)
        await db.flush()
        await db.refresh(game_result)
        return game_result

    async def get_user_history(
        self,
        db: AsyncSession,
        user_id: UUID,
        *,
        skip: int = 0,
        limit: int = 20,
    ) -> list[GameResult]:
        """Get user's game history."""
        result = await db.execute(
            select(GameResult)
            .where(GameResult.user_id == user_id)
            .options(selectinload(GameResult.challenge))
            .order_by(desc(GameResult.played_at))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_stats(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> dict[str, Any]:
        """Get aggregated game statistics for a user."""
        # Total games
        total_result = await db.execute(
            select(func.count(GameResult.id))
            .where(GameResult.user_id == user_id)
        )
        games_played = total_result.scalar() or 0

        # Won games
        won_result = await db.execute(
            select(func.count(GameResult.id))
            .where(
                GameResult.user_id == user_id,
                GameResult.completed == True,
            )
        )
        games_won = won_result.scalar() or 0

        # Average guesses (for won games)
        avg_result = await db.execute(
            select(func.avg(GameResult.total_guesses))
            .where(
                GameResult.user_id == user_id,
                GameResult.completed == True,
            )
        )
        average_guesses = float(avg_result.scalar() or 0)

        # Total hints
        hints_result = await db.execute(
            select(func.sum(GameResult.hints_used))
            .where(GameResult.user_id == user_id)
        )
        hints_used_total = hints_result.scalar() or 0

        # Last played
        last_result = await db.execute(
            select(GameResult.played_at)
            .where(GameResult.user_id == user_id)
            .order_by(desc(GameResult.played_at))
            .limit(1)
        )
        last_played_row = last_result.scalar_one_or_none()
        last_played = last_played_row.date() if last_played_row else None

        return {
            "games_played": games_played,
            "games_won": games_won,
            "win_rate": (games_won / games_played * 100) if games_played > 0 else 0,
            "average_guesses": round(average_guesses, 1),
            "hints_used_total": hints_used_total,
            "last_played": last_played,
        }


class CRUDQuizResult(CRUDBase[QuizResult, QuizResult, QuizResult]):
    """CRUD operations for QuizResult model."""

    async def create_result(
        self,
        db: AsyncSession,
        *,
        user_id: UUID | None,
        question_id: UUID,
        user_answer: str,
        is_correct: bool,
        hints_used: int = 0,
        time_taken_ms: int | None = None,
    ) -> QuizResult:
        """Create a quiz result."""
        result = QuizResult(
            user_id=user_id,
            question_id=question_id,
            user_answer=user_answer,
            is_correct=is_correct,
            hints_used=hints_used,
            time_taken_ms=time_taken_ms,
        )
        db.add(result)
        await db.flush()
        await db.refresh(result)
        return result

    async def get_user_stats(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> dict[str, Any]:
        """Get aggregated quiz statistics for a user."""
        # Total answered
        total_result = await db.execute(
            select(func.count(QuizResult.id))
            .where(QuizResult.user_id == user_id)
        )
        total_answered = total_result.scalar() or 0

        # Total correct
        correct_result = await db.execute(
            select(func.count(QuizResult.id))
            .where(
                QuizResult.user_id == user_id,
                QuizResult.is_correct == True,
            )
        )
        total_correct = correct_result.scalar() or 0

        # By category
        by_category_result = await db.execute(
            select(
                Question.category,
                func.count(QuizResult.id),
                func.sum(QuizResult.is_correct.cast(int)),
            )
            .join(Question)
            .where(QuizResult.user_id == user_id)
            .group_by(Question.category)
        )
        by_category = {}
        for row in by_category_result.fetchall():
            answered = row[1]
            correct = row[2] or 0
            by_category[row[0]] = {
                "answered": answered,
                "correct": correct,
                "accuracy": round((correct / answered * 100), 1) if answered > 0 else 0,
            }

        # By difficulty
        by_difficulty_result = await db.execute(
            select(
                Question.difficulty,
                func.count(QuizResult.id),
                func.sum(QuizResult.is_correct.cast(int)),
            )
            .join(Question)
            .where(QuizResult.user_id == user_id)
            .group_by(Question.difficulty)
        )
        by_difficulty = {}
        for row in by_difficulty_result.fetchall():
            answered = row[1]
            correct = row[2] or 0
            by_difficulty[row[0]] = {
                "answered": answered,
                "correct": correct,
                "accuracy": round((correct / answered * 100), 1) if answered > 0 else 0,
            }

        return {
            "total_answered": total_answered,
            "total_correct": total_correct,
            "accuracy": round((total_correct / total_answered * 100), 1) if total_answered > 0 else 0,
            "by_category": by_category,
            "by_difficulty": by_difficulty,
        }


# Singleton instances
daily_challenge_crud = CRUDDailyChallenge(DailyChallenge)
game_result_crud = CRUDGameResult(GameResult)
quiz_result_crud = CRUDQuizResult(QuizResult)

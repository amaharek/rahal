"""
CRUD operations for User-related models.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.user import Achievement, Profile, UserAchievement
from app.schemas.user import ProfileCreate, ProfileUpdate


class CRUDProfile(CRUDBase[Profile, ProfileCreate, ProfileUpdate]):
    """CRUD operations for Profile model."""

    async def get_by_username(self, db: AsyncSession, username: str) -> Profile | None:
        """Get a profile by username."""
        result = await db.execute(
            select(Profile).where(Profile.username == username)
        )
        return result.scalar_one_or_none()

    async def get_with_achievements(self, db: AsyncSession, id: UUID) -> Profile | None:
        """Get a profile with achievements loaded."""
        result = await db.execute(
            select(Profile)
            .where(Profile.id == id)
            .options(
                selectinload(Profile.achievements).selectinload(
                    UserAchievement.achievement
                )
            )
        )
        return result.scalar_one_or_none()

    async def update_streak(
        self,
        db: AsyncSession,
        profile: Profile,
        won: bool,
    ) -> Profile:
        """
        Update user's streak after a game.

        Args:
            db: Database session
            profile: User profile
            won: Whether the user won the game

        Returns:
            Updated profile
        """
        if won:
            profile.current_streak += 1
            if profile.current_streak > profile.max_streak:
                profile.max_streak = profile.current_streak
        else:
            profile.current_streak = 0

        await db.flush()
        await db.refresh(profile)
        return profile

    async def increment_stats(
        self,
        db: AsyncSession,
        profile: Profile,
        *,
        games_played: int = 0,
        games_won: int = 0,
        questions_answered: int = 0,
        correct_answers: int = 0,
    ) -> Profile:
        """Increment user statistics."""
        profile.games_played += games_played
        profile.games_won += games_won
        profile.total_questions_answered += questions_answered
        profile.total_correct_answers += correct_answers

        await db.flush()
        await db.refresh(profile)
        return profile

    async def get_leaderboard(
        self,
        db: AsyncSession,
        *,
        order_by: str = "max_streak",
        limit: int = 100,
    ) -> list[Profile]:
        """
        Get leaderboard sorted by specified field.

        Args:
            db: Database session
            order_by: Field to sort by (max_streak, games_won, current_streak)
            limit: Maximum results

        Returns:
            List of profiles sorted by score
        """
        order_column = getattr(Profile, order_by, Profile.max_streak)
        result = await db.execute(
            select(Profile)
            .order_by(desc(order_column))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_rank(
        self,
        db: AsyncSession,
        user_id: UUID,
        *,
        order_by: str = "max_streak",
    ) -> int | None:
        """Get user's rank in leaderboard."""
        order_column = getattr(Profile, order_by, Profile.max_streak)
        user = await self.get(db, user_id)
        if not user:
            return None

        user_score = getattr(user, order_by, 0)
        result = await db.execute(
            select(func.count(Profile.id))
            .where(order_column > user_score)
        )
        rank = result.scalar() or 0
        return rank + 1  # 1-indexed rank


class CRUDAchievement(CRUDBase[Achievement, Achievement, Achievement]):
    """CRUD operations for Achievement model."""

    async def get_by_code(self, db: AsyncSession, code: str) -> Achievement | None:
        """Get achievement by code."""
        result = await db.execute(
            select(Achievement).where(Achievement.code == code)
        )
        return result.scalar_one_or_none()

    async def get_all_by_category(
        self,
        db: AsyncSession,
        category: str,
    ) -> list[Achievement]:
        """Get all achievements in a category."""
        result = await db.execute(
            select(Achievement).where(Achievement.category == category)
        )
        return list(result.scalars().all())


class CRUDUserAchievement(CRUDBase[UserAchievement, UserAchievement, UserAchievement]):
    """CRUD operations for UserAchievement model."""

    async def get_user_achievements(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> list[UserAchievement]:
        """Get all achievements for a user."""
        result = await db.execute(
            select(UserAchievement)
            .where(UserAchievement.user_id == user_id)
            .options(selectinload(UserAchievement.achievement))
        )
        return list(result.scalars().all())

    async def get_unlocked_achievements(
        self,
        db: AsyncSession,
        user_id: UUID,
    ) -> list[UserAchievement]:
        """Get only unlocked achievements for a user."""
        result = await db.execute(
            select(UserAchievement)
            .where(
                UserAchievement.user_id == user_id,
                UserAchievement.unlocked_at.isnot(None),
            )
            .options(selectinload(UserAchievement.achievement))
        )
        return list(result.scalars().all())

    async def unlock_achievement(
        self,
        db: AsyncSession,
        user_id: UUID,
        achievement_id: UUID,
    ) -> UserAchievement:
        """Unlock an achievement for a user."""
        # Check if already exists
        result = await db.execute(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement_id,
            )
        )
        user_achievement = result.scalar_one_or_none()

        if user_achievement:
            if not user_achievement.unlocked_at:
                user_achievement.unlocked_at = datetime.now(timezone.utc)
                await db.flush()
                await db.refresh(user_achievement)
        else:
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement_id,
                unlocked_at=datetime.now(timezone.utc),
            )
            db.add(user_achievement)
            await db.flush()
            await db.refresh(user_achievement)

        return user_achievement


# Singleton instances
profile_crud = CRUDProfile(Profile)
achievement_crud = CRUDAchievement(Achievement)
user_achievement_crud = CRUDUserAchievement(UserAchievement)

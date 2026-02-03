"""
User-related SQLAlchemy models: Profile, Achievement, UserAchievement.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.game import GameResult, QuizResult


class Profile(Base, TimestampMixin):
    """
    User profile extending Supabase auth.users.
    Stores game statistics and preferences.
    """

    __tablename__ = "profiles"

    # Links to auth.users (Supabase)
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
    )

    # User info
    username: Mapped[str | None] = mapped_column(String(50), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(Text)

    # Game statistics
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    max_streak: Mapped[int] = mapped_column(Integer, default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    games_won: Mapped[int] = mapped_column(Integer, default=0)

    # Quiz statistics
    total_questions_answered: Mapped[int] = mapped_column(Integer, default=0)
    total_correct_answers: Mapped[int] = mapped_column(Integer, default=0)

    # User preferences
    preferences: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # Relationships
    game_results: Mapped[list["GameResult"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    quiz_results: Mapped[list["QuizResult"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Profile {self.id}: {self.username or 'Anonymous'}>"

    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage."""
        if self.games_played == 0:
            return 0.0
        return (self.games_won / self.games_played) * 100

    @property
    def quiz_accuracy(self) -> float:
        """Calculate quiz accuracy percentage."""
        if self.total_questions_answered == 0:
            return 0.0
        return (self.total_correct_answers / self.total_questions_answered) * 100


class Achievement(Base, UUIDMixin, TimestampMixin):
    """
    Achievement definitions.
    """

    __tablename__ = "achievements"

    # Unique code for achievement
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    # Names
    name_ar: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)

    # Descriptions
    description_ar: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)

    # Display
    icon: Mapped[str | None] = mapped_column(String(50))
    category: Mapped[str | None] = mapped_column(
        String(30)
    )  # games, quiz, streak, special

    # Unlock criteria
    requirement: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    # Points awarded
    points: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="achievement", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Achievement {self.code}: {self.name_ar}>"


class UserAchievement(Base, UUIDMixin):
    """
    Junction table for user-earned achievements.
    """

    __tablename__ = "user_achievements"

    # Foreign keys
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    achievement_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("achievements.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Progress tracking
    progress: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    # When unlocked
    unlocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    user: Mapped["Profile"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="user_achievements")

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="unique_user_achievement"),
    )

    def __repr__(self) -> str:
        return f"<UserAchievement user={self.user_id} achievement={self.achievement_id}>"

    @property
    def is_unlocked(self) -> bool:
        """Check if achievement is unlocked."""
        return self.unlocked_at is not None

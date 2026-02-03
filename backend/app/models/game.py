"""
Game-related SQLAlchemy models: DailyChallenge, GameResult, QuizResult.
"""

from datetime import date, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.country import Country
    from app.models.question import Question
    from app.models.user import Profile


class DailyChallenge(Base, UUIDMixin, TimestampMixin):
    """
    Daily path challenge.
    Pre-generated puzzles with start and end countries.
    """

    __tablename__ = "daily_challenges"

    # Challenge date (one per day)
    challenge_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)

    # Start and end countries
    start_country_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("countries.id"),
        nullable=False,
    )
    end_country_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("countries.id"),
        nullable=False,
    )

    # Solution
    shortest_path: Mapped[int] = mapped_column(Integer, nullable=False)
    solution_path: Mapped[list[str] | None] = mapped_column(JSONB)  # Array of country IDs

    # Relationships
    start_country: Mapped["Country"] = relationship(
        "Country", foreign_keys=[start_country_id]
    )
    end_country: Mapped["Country"] = relationship(
        "Country", foreign_keys=[end_country_id]
    )
    game_results: Mapped[list["GameResult"]] = relationship(
        back_populates="challenge", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<DailyChallenge {self.challenge_date}: {self.start_country_id} -> {self.end_country_id}>"


class GameResult(Base, UUIDMixin, TimestampMixin):
    """
    User's result for a daily challenge.
    Stores guesses, hints used, and final score.
    """

    __tablename__ = "game_results"

    # Foreign keys
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
    )
    challenge_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("daily_challenges.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Game progress
    guesses: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)
    total_guesses: Mapped[int] = mapped_column(Integer, default=0)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)

    # Completion status
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[int | None] = mapped_column(Integer)

    # Timestamp
    played_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()"
    )

    # Relationships
    user: Mapped["Profile | None"] = relationship(back_populates="game_results")
    challenge: Mapped["DailyChallenge"] = relationship(back_populates="game_results")

    # Constraints
    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", name="unique_user_challenge"),
    )

    def __repr__(self) -> str:
        return f"<GameResult user={self.user_id} challenge={self.challenge_id} completed={self.completed}>"


class QuizResult(Base, UUIDMixin):
    """
    Individual quiz question answer.
    """

    __tablename__ = "quiz_results"

    # Foreign keys
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
    )
    question_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Answer details
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    time_taken_ms: Mapped[int | None] = mapped_column(Integer)

    # Timestamp
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()"
    )

    # Relationships
    user: Mapped["Profile | None"] = relationship(back_populates="quiz_results")
    question: Mapped["Question"] = relationship()

    def __repr__(self) -> str:
        return f"<QuizResult user={self.user_id} question={self.question_id} correct={self.is_correct}>"

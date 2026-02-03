"""
Question SQLAlchemy model and enums.
"""

import enum
from typing import Any

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class QuestionCategory(str, enum.Enum):
    """Question categories."""

    CAPITALS = "capitals"  # العواصم
    FLAGS = "flags"  # الأعلام
    LANDMARKS = "landmarks"  # المعالم
    ATTRACTIONS = "attractions"  # معالم الجذب
    GEOGRAPHY = "geography"  # الجغرافيا
    BORDERS = "borders"  # الحدود
    POPULATION = "population"  # السكان
    ARAB_WORLD = "arab_world"  # العالم العربي


class QuestionDifficulty(str, enum.Enum):
    """Question difficulty levels."""

    EASY = "easy"  # سهل
    MEDIUM = "medium"  # متوسط
    HARD = "hard"  # صعب


class QuestionType(str, enum.Enum):
    """Question types."""

    MULTIPLE_CHOICE = "multiple_choice"  # اختيار متعدد
    AUTOCOMPLETE = "autocomplete"  # إكمال تلقائي


class Question(Base, UUIDMixin, TimestampMixin):
    """
    Question model for quizzes.
    Supports multiple choice and autocomplete question types.
    """

    __tablename__ = "questions"

    # Question metadata
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    difficulty: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )
    question_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )

    # Question content (Arabic)
    question_ar: Mapped[str] = mapped_column(Text, nullable=False)

    # Answer
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer_normalized: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # For fuzzy matching

    # Multiple choice options (JSONB array)
    options: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    # Optional hint
    hint: Mapped[str | None] = mapped_column(Text)

    # Optional image URL
    image_url: Mapped[str | None] = mapped_column(Text)

    # Tags for filtering
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))

    # Active status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    def __repr__(self) -> str:
        return f"<Question {self.id}: {self.question_ar[:50]}...>"

    @property
    def category_enum(self) -> QuestionCategory:
        """Get category as enum."""
        return QuestionCategory(self.category)

    @property
    def difficulty_enum(self) -> QuestionDifficulty:
        """Get difficulty as enum."""
        return QuestionDifficulty(self.difficulty)

    @property
    def type_enum(self) -> QuestionType:
        """Get question type as enum."""
        return QuestionType(self.question_type)

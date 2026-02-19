"""
Question and Quiz-related Pydantic schemas.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.question import QuestionCategory, QuestionDifficulty, QuestionType


class QuestionBase(BaseModel):
    """Base question schema."""

    category: QuestionCategory
    difficulty: QuestionDifficulty
    question_type: QuestionType
    question_ar: str = Field(..., min_length=5, description="Question text in Arabic")
    hint: str | None = None
    image_url: str | None = None
    tags: list[str] | None = None


class QuestionCreate(QuestionBase):
    """Schema for creating a question."""

    correct_answer: str = Field(..., min_length=1)
    correct_answer_normalized: str
    options: dict[str, Any] | None = None  # For multiple choice


class QuestionResponse(BaseModel):
    """Question response for quiz display (excludes correct answer)."""

    id: UUID
    category: str
    difficulty: str
    question_type: str
    question_ar: str
    options: list[str] | None = None  # Only for multiple choice
    hint: str | None
    image_url: str | None

    class Config:
        from_attributes = True


class AnswerRequest(BaseModel):
    """Request schema for submitting an answer."""

    question_id: UUID
    answer: str = Field(..., min_length=1)
    hints_used: int = Field(default=0, ge=0, le=3)
    time_taken_ms: int | None = Field(None, ge=0)


class AnswerResponse(BaseModel):
    """Response after answering a question."""

    is_correct: bool
    correct_answer: str
    score: int
    explanation: str | None = None


class QuizSessionRequest(BaseModel):
    """Request to start a quiz session."""

    category: QuestionCategory | None = None
    difficulty: QuestionDifficulty | None = None
    question_type: QuestionType | None = None
    num_questions: int = Field(default=10, ge=1, le=50)


class QuizSessionResponse(BaseModel):
    """Response with quiz session details."""

    session_id: UUID
    questions: list[QuestionResponse]
    total_questions: int
    time_limit_seconds: int


class CategoryStats(BaseModel):
    """Statistics for a category."""

    answered: int
    correct: int
    accuracy: float


class QuizStatsResponse(BaseModel):
    """User's quiz statistics."""

    total_answered: int
    total_correct: int
    accuracy: float
    by_category: dict[str, CategoryStats]
    by_difficulty: dict[str, CategoryStats]


class AdminQuestionListItem(BaseModel):
    """Question record for admin list view."""

    id: UUID
    category: str
    difficulty: str
    question_type: str
    question_ar: str
    correct_answer: str
    options: list[str] | None = None
    hint: str | None = None
    image_url: str | None = None
    tags: list[str] | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AdminQuestionListResponse(BaseModel):
    """Paginated admin questions list."""

    items: list[AdminQuestionListItem]
    total: int
    skip: int
    limit: int


class AdminQuestionCreateRequest(BaseModel):
    """Create payload for admin question APIs."""

    category: QuestionCategory
    difficulty: QuestionDifficulty
    question_type: QuestionType
    question_ar: str = Field(..., min_length=5)
    correct_answer: str = Field(..., min_length=1)
    options: list[str] | None = None
    hint: str | None = None
    image_url: str | None = None
    tags: list[str] | None = None
    is_active: bool = True


class AdminQuestionUpdateRequest(BaseModel):
    """Partial update payload for admin question APIs."""

    category: QuestionCategory | None = None
    difficulty: QuestionDifficulty | None = None
    question_type: QuestionType | None = None
    question_ar: str | None = Field(None, min_length=5)
    correct_answer: str | None = Field(None, min_length=1)
    options: list[str] | None = None
    hint: str | None = None
    image_url: str | None = None
    tags: list[str] | None = None


class AdminQuestionActivationRequest(BaseModel):
    """Activation payload for admin question APIs."""

    is_active: bool

"""
User-related Pydantic schemas.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    """Base profile schema."""

    username: str | None = Field(None, min_length=3, max_length=50)
    display_name: str | None = Field(None, max_length=100)
    avatar_url: str | None = None


class ProfileCreate(ProfileBase):
    """Schema for creating a profile."""

    id: UUID  # From Supabase auth


class ProfileUpdate(BaseModel):
    """Schema for updating a profile."""

    username: str | None = Field(None, min_length=3, max_length=50)
    display_name: str | None = Field(None, max_length=100)
    avatar_url: str | None = None
    preferences: dict[str, Any] | None = None


class ProfileResponse(ProfileBase):
    """Profile response schema."""

    id: UUID
    current_streak: int
    max_streak: int
    games_played: int
    games_won: int
    total_questions_answered: int
    total_correct_answers: int
    win_rate: float
    quiz_accuracy: float
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    """Achievement response schema."""

    id: UUID
    code: str
    name_ar: str
    name_en: str
    description_ar: str | None
    description_en: str | None
    icon: str | None
    category: str | None
    points: int

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    """User achievement response schema."""

    id: UUID
    achievement: AchievementResponse
    progress: dict[str, Any]
    unlocked_at: datetime | None
    is_unlocked: bool

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    """Single entry in the leaderboard."""

    rank: int
    user_id: UUID
    username: str | None
    display_name: str | None
    avatar_url: str | None
    score: int  # Could be streak, games_won, etc.
    games_played: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""

    type: str  # "streak", "games_won", "quiz_accuracy"
    entries: list[LeaderboardEntry]
    total_users: int
    user_rank: int | None = None  # Current user's rank if logged in

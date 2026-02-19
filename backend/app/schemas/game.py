"""
Game-related Pydantic schemas for daily challenges.
"""

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.country import CountryBrief

RouteMode = Literal["shortest", "explorer"]


class UserProgress(BaseModel):
    """User's progress on a challenge."""

    guesses: list[dict[str, Any]]
    hints_used: int
    completed: bool
    score: int | None = None


class DailyChallengeResponse(BaseModel):
    """Daily challenge response."""

    id: UUID
    challenge_date: date
    start_country: CountryBrief
    end_country: CountryBrief
    shortest_path: int
    mode: RouteMode = "shortest"
    path_country_codes: list[str] = Field(default_factory=list)
    user_progress: UserProgress | None = None

    class Config:
        from_attributes = True


class GuessRequest(BaseModel):
    """Request for submitting a guess."""

    challenge_id: UUID
    country_id: UUID
    mode: RouteMode = "shortest"


class GuessEntry(BaseModel):
    """Single guess entry in history."""

    country_id: UUID
    name_ar: str
    flag_emoji: str | None
    emoji: Literal["🟢", "🟡", "🟠", "🔴", "⚫"]
    order: int


class GuessResponse(BaseModel):
    """Response after submitting a guess."""

    country: CountryBrief
    score_emoji: Literal["🟢", "🟡", "🟠", "🔴", "⚫"]
    score_description: str
    is_on_shortest_path: bool
    is_destination: bool
    game_complete: bool
    total_guesses: int
    score: int | None = None
    route_mode: RouteMode = "shortest"
    gap_from_optimal: int | None = None
    quality_tier: Literal["perfect", "near_optimal", "good_discovery", "scenic"] | None = None
    quality_explanation_ar: str | None = None


class HintRequest(BaseModel):
    """Request for using a hint."""

    challenge_id: UUID
    mode: RouteMode = "shortest"


class HintResponse(BaseModel):
    """Response with hint data."""

    hint_type: Literal["progressive_1", "progressive_2", "progressive_3"]
    hint_data: dict[str, Any]
    hints_remaining: int


class GameCompleteResponse(BaseModel):
    """Response when game is completed."""

    completed: bool
    score: int
    total_guesses: int
    hints_used: int
    shortest_path: int
    is_optimal: bool  # True if user found shortest path


class GameStatsResponse(BaseModel):
    """User's game statistics."""

    games_played: int
    games_won: int
    win_rate: float
    current_streak: int
    max_streak: int
    average_guesses: float
    hints_used_total: int
    last_played: date | None


class PracticeSessionCreateRequest(BaseModel):
    """Request to start a practice session."""

    start_country_id: UUID
    end_country_id: UUID
    mode: RouteMode = "shortest"


class PracticeSessionResponse(BaseModel):
    """Practice session response."""

    session_id: UUID
    mode: Literal["practice"] = "practice"
    route_mode: RouteMode = "shortest"
    start_country: CountryBrief
    end_country: CountryBrief
    shortest_path: int
    path_country_codes: list[str] = Field(default_factory=list)
    user_progress: UserProgress | None = None


class PracticeGuessRequest(BaseModel):
    """Request for submitting a practice guess."""

    session_id: UUID
    country_id: UUID
    mode: RouteMode = "shortest"


class PracticeHintRequest(BaseModel):
    """Request for using a hint in practice mode."""

    session_id: UUID
    mode: RouteMode = "shortest"

"""
Pydantic schemas for request/response validation.
"""

from app.schemas.common import (
    MessageResponse,
    PaginatedResponse,
    PaginationParams,
)
from app.schemas.country import (
    CountryBase,
    CountryCreate,
    CountryResponse,
    CountryBrief,
    AutocompleteSuggestion,
    AutocompleteResponse,
)
from app.schemas.question import (
    QuestionBase,
    QuestionCreate,
    QuestionResponse,
    AnswerRequest,
    AnswerResponse,
    QuizSessionRequest,
    QuizSessionResponse,
    QuizStatsResponse,
)
from app.schemas.game import (
    DailyChallengeResponse,
    UserProgress,
    GuessRequest,
    GuessResponse,
    HintRequest,
    HintResponse,
    GameCompleteResponse,
    GameStatsResponse,
    PracticeSessionCreateRequest,
    PracticeSessionResponse,
    PracticeGuessRequest,
    PracticeHintRequest,
)
from app.schemas.user import (
    ProfileBase,
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
    AchievementResponse,
    UserAchievementResponse,
    LeaderboardEntry,
)

__all__ = [
    # Common
    "MessageResponse",
    "PaginatedResponse",
    "PaginationParams",
    # Country
    "CountryBase",
    "CountryCreate",
    "CountryResponse",
    "CountryBrief",
    "AutocompleteSuggestion",
    "AutocompleteResponse",
    # Question
    "QuestionBase",
    "QuestionCreate",
    "QuestionResponse",
    "AnswerRequest",
    "AnswerResponse",
    "QuizSessionRequest",
    "QuizSessionResponse",
    "QuizStatsResponse",
    # Game
    "DailyChallengeResponse",
    "UserProgress",
    "GuessRequest",
    "GuessResponse",
    "HintRequest",
    "HintResponse",
    "GameCompleteResponse",
    "GameStatsResponse",
    "PracticeSessionCreateRequest",
    "PracticeSessionResponse",
    "PracticeGuessRequest",
    "PracticeHintRequest",
    # User
    "ProfileBase",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfileResponse",
    "AchievementResponse",
    "UserAchievementResponse",
    "LeaderboardEntry",
]

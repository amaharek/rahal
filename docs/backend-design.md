# Backend Design Document
# رحال (Rahal) - Backend Architecture

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | January 30, 2026 |
| **Reference** | [PRD-Rahal.md](../PRD-Rahal.md) |
| **Database Design** | [database-design.md](./database-design.md) |

---

## 1. Overview & Architecture

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Next.js Web   │  │    PWA Mobile   │  │  Future Native  │         │
│  │   (React 19)    │  │                 │  │      Apps       │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
└───────────┼───────────────────┼───────────────────┼────────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      FastAPI Backend                              │   │
│  │                     (Python 3.11+)                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │  Game    │  │  Quiz    │  │  User    │  │  Admin   │        │   │
│  │  │  Router  │  │  Router  │  │  Router  │  │  Router  │        │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │   │
│  │       │             │             │             │               │   │
│  │       ▼             ▼             ▼             ▼               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                   SERVICE LAYER                          │   │   │
│  │  │  PathFinder │ QuizEngine │ ChallengeGen │ AchievementSvc │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  │       │             │             │             │               │   │
│  │       ▼             ▼             ▼             ▼               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                    CRUD LAYER                            │   │   │
│  │  │      (SQLAlchemy Async Operations)                       │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────────────────────────────────────────┬┘
            │                                                           │
            ▼                                                           ▼
┌─────────────────────────────┐                     ┌─────────────────────────────┐
│       Supabase              │                     │        Strapi CMS           │
│  ┌─────────────────────┐    │                     │  ┌─────────────────────┐    │
│  │    PostgreSQL       │    │                     │  │   Content Types     │    │
│  │    (Database)       │    │                     │  │   (Questions,       │    │
│  └─────────────────────┘    │                     │  │    Landmarks)       │    │
│  ┌─────────────────────┐    │                     │  └─────────────────────┘    │
│  │   Authentication    │    │                     │  ┌─────────────────────┐    │
│  │   (JWT/OAuth)       │    │                     │  │   Media Library     │    │
│  └─────────────────────┘    │                     │  │   (Images)          │    │
│  ┌─────────────────────┐    │                     │  └─────────────────────┘    │
│  │   Row Level         │    │                     └─────────────────────────────┘
│  │   Security          │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### 1.2 Design Principles

1. **Async-First**: All I/O operations use async/await for high concurrency
2. **Type-Safe**: Full type hints with Pydantic validation
3. **Layered Architecture**: Clear separation between routers, services, and data access
4. **Arabic-Native**: Built-in support for Arabic text processing and RTL
5. **Testable**: Dependency injection for easy mocking and testing
6. **Stateless**: No server-side session state; JWT-based authentication

---

## 2. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   │
│   ├── routers/                   # API route handlers
│   │   ├── __init__.py
│   │   ├── game.py               # /api/game/* endpoints
│   │   ├── quiz.py               # /api/quiz/* endpoints
│   │   ├── users.py              # /api/users/* endpoints
│   │   ├── autocomplete.py       # /api/autocomplete/* endpoints
│   │   └── admin.py              # /api/admin/* endpoints
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py               # Base model with common fields
│   │   ├── country.py            # Country, Border models
│   │   ├── question.py           # Question model with enums
│   │   ├── user.py               # Profile, Achievement models
│   │   └── game.py               # DailyChallenge, GameResult, QuizResult
│   │
│   ├── schemas/                   # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── country.py            # Country schemas
│   │   ├── question.py           # Question schemas
│   │   ├── game.py               # Game-related schemas
│   │   ├── user.py               # User/Profile schemas
│   │   └── common.py             # Shared schemas (pagination, errors)
│   │
│   ├── services/                  # Business logic layer
│   │   ├── __init__.py
│   │   ├── path_finder.py        # BFS/Dijkstra shortest path
│   │   ├── quiz_engine.py        # Question selection, scoring
│   │   ├── challenge_generator.py # Daily puzzle generation
│   │   ├── achievement_service.py # Achievement checking/awarding
│   │   └── score_calculator.py   # Emoji score calculation
│   │
│   ├── crud/                      # Database CRUD operations
│   │   ├── __init__.py
│   │   ├── base.py               # Generic CRUD base class
│   │   ├── country.py            # Country/Border CRUD
│   │   ├── question.py           # Question CRUD
│   │   ├── user.py               # Profile/Achievement CRUD
│   │   └── game.py               # Game/Quiz result CRUD
│   │
│   ├── core/                      # Core configuration & utilities
│   │   ├── __init__.py
│   │   ├── config.py             # Settings from environment
│   │   ├── database.py           # SQLAlchemy async engine/session
│   │   ├── security.py           # JWT verification, password hashing
│   │   └── deps.py               # FastAPI dependencies
│   │
│   └── utils/                     # Utility functions
│       ├── __init__.py
│       ├── arabic.py             # Arabic text processing
│       └── cache.py              # Caching utilities
│
├── alembic/                       # Database migrations
│   ├── versions/                  # Migration files
│   ├── env.py                    # Alembic environment config
│   └── script.py.mako            # Migration template
│
├── tests/                         # Test suite
│   ├── __init__.py
│   ├── conftest.py               # Pytest fixtures
│   ├── test_game.py
│   ├── test_quiz.py
│   ├── test_users.py
│   └── test_services/
│       ├── test_path_finder.py
│       └── test_quiz_engine.py
│
├── alembic.ini                    # Alembic configuration
├── pyproject.toml                 # Python dependencies (uv)
├── uv.lock                        # Dependency lock file
├── Dockerfile                     # Container configuration
└── .env.example                   # Environment variables template
```

---

## 3. Core Dependencies (pyproject.toml)

```toml
[project]
name = "rahal-backend"
version = "1.0.0"
description = "Rahal Arabic Geography Game Backend"
requires-python = ">=3.11"
dependencies = [
    # Web Framework
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",

    # Database
    "sqlalchemy[asyncio]>=2.0.25",
    "asyncpg>=0.29.0",
    "alembic>=1.13.1",

    # Validation & Serialization
    "pydantic>=2.5.3",
    "pydantic-settings>=2.1.0",

    # Authentication
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",

    # Supabase
    "supabase>=2.3.0",

    # Arabic Text Processing
    "arabic-reshaper>=3.0.0",
    "python-bidi>=0.4.2",

    # HTTP Client
    "httpx>=0.26.0",

    # Utilities
    "python-dotenv>=1.0.0",
    "python-multipart>=0.0.6",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.4",
    "pytest-asyncio>=0.23.3",
    "pytest-cov>=4.1.0",
    "httpx>=0.26.0",
    "ruff>=0.1.11",
    "mypy>=1.8.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.11"
strict = true
plugins = ["pydantic.mypy"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## 4. Database Layer (SQLAlchemy Async)

### 4.1 Database Configuration (`app/core/database.py`)

```python
"""
Database configuration and session management.
Uses SQLAlchemy 2.0 async API with asyncpg driver.
"""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL_ASYNC,
    echo=settings.DEBUG,
    poolclass=NullPool,  # Recommended for async
    future=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### 4.2 Base Model (`app/models/base.py`)

```python
"""
Base SQLAlchemy model with common fields and utilities.
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    # Common type annotations for all models
    type_annotation_map = {
        UUID: PGUUID(as_uuid=True),
    }


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UUIDMixin:
    """Mixin for UUID primary key."""

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
```

### 4.3 Generic CRUD Base (`app/crud/base.py`)

```python
"""
Generic CRUD operations base class.
"""

from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base class for CRUD operations."""

    def __init__(self, model: type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: UUID) -> ModelType | None:
        """Get a single record by ID."""
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        """Get multiple records with pagination."""
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count(self, db: AsyncSession) -> int:
        """Count total records."""
        result = await db.execute(select(func.count()).select_from(self.model))
        return result.scalar() or 0

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in.model_dump())
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict[str, Any],
    ) -> ModelType:
        """Update an existing record."""
        update_data = (
            obj_in.model_dump(exclude_unset=True)
            if isinstance(obj_in, BaseModel)
            else obj_in
        )
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: UUID) -> bool:
        """Delete a record by ID."""
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            return True
        return False
```

---

## 5. API Endpoints Specification

### 5.1 Game Endpoints (`app/routers/game.py`)

```python
"""
Game-related API endpoints for daily challenges.
"""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_optional, get_db
from app.models.user import Profile
from app.schemas.game import (
    DailyChallengeResponse,
    GuessRequest,
    GuessResponse,
    HintRequest,
    HintResponse,
    GameCompleteRequest,
    GameCompleteResponse,
    GameStatsResponse,
)
from app.services.path_finder import PathFinderService
from app.services.score_calculator import ScoreCalculator
from app.crud.game import game_result_crud, daily_challenge_crud

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/daily", response_model=DailyChallengeResponse)
async def get_daily_challenge(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile | None, Depends(get_current_user_optional)],
    challenge_date: date | None = None,
) -> DailyChallengeResponse:
    """
    Get today's daily challenge.

    Returns:
        - Start and end country with Arabic names
        - Shortest path length
        - User's existing progress (if logged in)

    Example Response:
    ```json
    {
        "id": "uuid",
        "challenge_date": "2026-01-30",
        "start_country": {
            "id": "uuid",
            "code": "SAU",
            "name_ar": "السعودية",
            "name_en": "Saudi Arabia",
            "flag_emoji": "🇸🇦"
        },
        "end_country": {
            "id": "uuid",
            "code": "EGY",
            "name_ar": "مصر",
            "name_en": "Egypt",
            "flag_emoji": "🇪🇬"
        },
        "shortest_path": 2,
        "user_progress": {
            "guesses": [...],
            "hints_used": 0,
            "completed": false
        }
    }
    ```
    """
    target_date = challenge_date or date.today()
    challenge = await daily_challenge_crud.get_by_date(db, target_date)

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا يوجد تحدٍ لهذا اليوم"  # No challenge for this day
        )

    # Get user's existing progress if logged in
    user_progress = None
    if current_user:
        result = await game_result_crud.get_by_user_and_challenge(
            db, current_user.id, challenge.id
        )
        if result:
            user_progress = {
                "guesses": result.guesses,
                "hints_used": result.hints_used,
                "completed": result.completed,
            }

    return DailyChallengeResponse(
        id=challenge.id,
        challenge_date=challenge.challenge_date,
        start_country=challenge.start_country,
        end_country=challenge.end_country,
        shortest_path=challenge.shortest_path,
        user_progress=user_progress,
    )


@router.post("/guess", response_model=GuessResponse)
async def submit_guess(
    request: GuessRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile | None, Depends(get_current_user_optional)],
    path_finder: Annotated[PathFinderService, Depends()],
    score_calc: Annotated[ScoreCalculator, Depends()],
) -> GuessResponse:
    """
    Submit a country guess for the daily challenge.

    Request Body:
    ```json
    {
        "challenge_id": "uuid",
        "country_id": "uuid"
    }
    ```

    Returns:
        - Score emoji (🟢🟡🟠🔴⚫)
        - Whether the game is complete
        - Updated guess list

    Example Response:
    ```json
    {
        "country": {
            "id": "uuid",
            "name_ar": "الأردن",
            "flag_emoji": "🇯🇴"
        },
        "score_emoji": "🟢",
        "score_description": "ممتاز",
        "is_on_shortest_path": true,
        "is_destination": false,
        "game_complete": false,
        "total_guesses": 1
    }
    ```
    """
    # Validate challenge exists
    challenge = await daily_challenge_crud.get(db, request.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="التحدي غير موجود"
        )

    # Get or create game result
    game_result = await game_result_crud.get_or_create_for_user(
        db, current_user.id if current_user else None, challenge.id
    )

    # Check if already completed
    if game_result.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد أكملت هذا التحدي بالفعل"
        )

    # Calculate score for this guess
    score_result = await score_calc.calculate_guess_score(
        db=db,
        challenge=challenge,
        guessed_country_id=request.country_id,
        previous_guesses=game_result.guesses,
    )

    # Update game result
    game_result.guesses.append(score_result.to_guess_entry())
    game_result.total_guesses += 1

    if score_result.is_destination:
        game_result.completed = True
        game_result.score = score_calc.calculate_final_score(
            game_result.total_guesses,
            game_result.hints_used,
            challenge.shortest_path,
        )

    await db.flush()

    return GuessResponse(
        country=score_result.country,
        score_emoji=score_result.emoji,
        score_description=score_result.description_ar,
        is_on_shortest_path=score_result.is_on_shortest_path,
        is_destination=score_result.is_destination,
        game_complete=game_result.completed,
        total_guesses=game_result.total_guesses,
    )


@router.post("/hint", response_model=HintResponse)
async def use_hint(
    request: HintRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile | None, Depends(get_current_user_optional)],
    path_finder: Annotated[PathFinderService, Depends()],
) -> HintResponse:
    """
    Use a hint for the daily challenge.

    Hint Types:
    1. `border_hint` - Show border outline of one country on path
    2. `all_borders_hint` - Show all countries on shortest path
    3. `first_letter_hint` - Show first letter of countries on path

    Request Body:
    ```json
    {
        "challenge_id": "uuid",
        "hint_type": "border_hint"
    }
    ```

    Example Response:
    ```json
    {
        "hint_type": "border_hint",
        "hint_data": {
            "country_name_ar": "الأردن",
            "border_countries": ["العراق", "سوريا", "السعودية", "فلسطين"]
        },
        "hints_remaining": 2
    }
    ```
    """
    challenge = await daily_challenge_crud.get(db, request.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="التحدي غير موجود"
        )

    game_result = await game_result_crud.get_or_create_for_user(
        db, current_user.id if current_user else None, challenge.id
    )

    if game_result.hints_used >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="استخدمت جميع التلميحات المتاحة"
        )

    # Generate hint based on type
    hint_data = await path_finder.generate_hint(
        db=db,
        challenge=challenge,
        hint_type=request.hint_type,
        previous_guesses=game_result.guesses,
    )

    game_result.hints_used += 1
    await db.flush()

    return HintResponse(
        hint_type=request.hint_type,
        hint_data=hint_data,
        hints_remaining=3 - game_result.hints_used,
    )


@router.get("/stats", response_model=GameStatsResponse)
async def get_game_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile, Depends(get_current_user)],
) -> GameStatsResponse:
    """
    Get user's game statistics.

    Example Response:
    ```json
    {
        "games_played": 42,
        "games_won": 38,
        "win_rate": 90.5,
        "current_streak": 7,
        "max_streak": 15,
        "average_guesses": 4.2,
        "hints_used_total": 23,
        "last_played": "2026-01-30"
    }
    ```
    """
    stats = await game_result_crud.get_user_stats(db, current_user.id)
    return GameStatsResponse(**stats)
```

### 5.2 Quiz Endpoints (`app/routers/quiz.py`)

```python
"""
Quiz-related API endpoints.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_optional, get_db
from app.models.user import Profile
from app.models.question import QuestionCategory, QuestionDifficulty, QuestionType
from app.schemas.quiz import (
    QuestionResponse,
    AnswerRequest,
    AnswerResponse,
    QuizSessionRequest,
    QuizSessionResponse,
    QuizStatsResponse,
)
from app.services.quiz_engine import QuizEngine
from app.crud.question import question_crud
from app.crud.game import quiz_result_crud

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.get("/question", response_model=QuestionResponse)
async def get_random_question(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: QuestionCategory | None = None,
    difficulty: QuestionDifficulty | None = None,
    question_type: QuestionType | None = None,
    exclude_ids: list[UUID] | None = Query(None),
) -> QuestionResponse:
    """
    Get a random question with optional filters.

    Query Parameters:
    - `category`: Filter by category (capitals, flags, landmarks, etc.)
    - `difficulty`: Filter by difficulty (easy, medium, hard)
    - `question_type`: Filter by type (multiple_choice, autocomplete)
    - `exclude_ids`: List of question IDs to exclude (already answered)

    Example Response (Multiple Choice):
    ```json
    {
        "id": "uuid",
        "category": "capitals",
        "difficulty": "easy",
        "question_type": "multiple_choice",
        "question_ar": "ما هي عاصمة مصر؟",
        "options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"],
        "hint": "أكبر مدينة في أفريقيا",
        "image_url": null
    }
    ```

    Example Response (Autocomplete):
    ```json
    {
        "id": "uuid",
        "category": "capitals",
        "difficulty": "medium",
        "question_type": "autocomplete",
        "question_ar": "ما هي عاصمة المغرب؟",
        "hint": "ليست الدار البيضاء",
        "image_url": null
    }
    ```
    """
    question = await question_crud.get_random(
        db,
        category=category,
        difficulty=difficulty,
        question_type=question_type,
        exclude_ids=exclude_ids or [],
    )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا توجد أسئلة متاحة بهذه المعايير"
        )

    # Don't include correct_answer in response
    return QuestionResponse(
        id=question.id,
        category=question.category,
        difficulty=question.difficulty,
        question_type=question.question_type,
        question_ar=question.question_ar,
        options=question.options if question.question_type == QuestionType.MULTIPLE_CHOICE else None,
        hint=question.hint,
        image_url=question.image_url,
    )


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(
    request: AnswerRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile | None, Depends(get_current_user_optional)],
    quiz_engine: Annotated[QuizEngine, Depends()],
) -> AnswerResponse:
    """
    Submit an answer to a question.

    Request Body:
    ```json
    {
        "question_id": "uuid",
        "answer": "القاهرة",
        "hints_used": 0,
        "time_taken_ms": 5432
    }
    ```

    Example Response:
    ```json
    {
        "is_correct": true,
        "correct_answer": "القاهرة",
        "score": 10,
        "explanation": "القاهرة هي عاصمة جمهورية مصر العربية"
    }
    ```
    """
    question = await question_crud.get(db, request.question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="السؤال غير موجود"
        )

    # Check answer
    result = quiz_engine.check_answer(
        question=question,
        user_answer=request.answer,
        hints_used=request.hints_used,
    )

    # Save result if user is logged in
    if current_user:
        await quiz_result_crud.create(
            db,
            user_id=current_user.id,
            question_id=question.id,
            user_answer=request.answer,
            is_correct=result.is_correct,
            hints_used=request.hints_used,
            time_taken_ms=request.time_taken_ms,
        )

        # Update user stats
        current_user.total_questions_answered += 1
        if result.is_correct:
            current_user.total_correct_answers += 1

    return AnswerResponse(
        is_correct=result.is_correct,
        correct_answer=question.correct_answer,
        score=result.score,
        explanation=result.explanation,
    )


@router.post("/session", response_model=QuizSessionResponse)
async def start_quiz_session(
    request: QuizSessionRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    quiz_engine: Annotated[QuizEngine, Depends()],
) -> QuizSessionResponse:
    """
    Start a quiz session with multiple questions.

    Request Body:
    ```json
    {
        "category": "capitals",
        "difficulty": "easy",
        "question_type": "multiple_choice",
        "num_questions": 10
    }
    ```

    Example Response:
    ```json
    {
        "session_id": "uuid",
        "questions": [...],
        "total_questions": 10,
        "time_limit_seconds": 300
    }
    ```
    """
    questions = await quiz_engine.generate_session(
        db=db,
        category=request.category,
        difficulty=request.difficulty,
        question_type=request.question_type,
        num_questions=request.num_questions,
    )

    return QuizSessionResponse(
        session_id=uuid4(),
        questions=questions,
        total_questions=len(questions),
        time_limit_seconds=request.num_questions * 30,  # 30 seconds per question
    )


@router.get("/stats", response_model=QuizStatsResponse)
async def get_quiz_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile, Depends(get_current_user)],
) -> QuizStatsResponse:
    """
    Get user's quiz statistics.

    Example Response:
    ```json
    {
        "total_answered": 156,
        "total_correct": 132,
        "accuracy": 84.6,
        "by_category": {
            "capitals": {"answered": 50, "correct": 45, "accuracy": 90.0},
            "flags": {"answered": 30, "correct": 22, "accuracy": 73.3}
        },
        "by_difficulty": {
            "easy": {"answered": 80, "correct": 75, "accuracy": 93.75},
            "medium": {"answered": 50, "correct": 40, "accuracy": 80.0},
            "hard": {"answered": 26, "correct": 17, "accuracy": 65.4}
        }
    }
    ```
    """
    stats = await quiz_result_crud.get_user_stats(db, current_user.id)
    return QuizStatsResponse(**stats)
```

### 5.3 Autocomplete Endpoints (`app/routers/autocomplete.py`)

```python
"""
Arabic autocomplete API endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.autocomplete import AutocompleteResponse, AutocompleteSuggestion
from app.crud.country import country_crud
from app.utils.arabic import normalize_arabic, calculate_similarity

router = APIRouter(prefix="/api/autocomplete", tags=["autocomplete"])


@router.get("/countries", response_model=AutocompleteResponse)
async def search_countries(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, max_length=50, description="Search query in Arabic"),
    limit: int = Query(10, ge=1, le=20),
) -> AutocompleteResponse:
    """
    Search countries by Arabic name with fuzzy matching.

    Supports:
    - Partial matching
    - Diacritic-insensitive search
    - Alef variation handling (أ، إ، آ، ا)

    Example Request:
    ```
    GET /api/autocomplete/countries?q=مص&limit=5
    ```

    Example Response:
    ```json
    {
        "query": "مص",
        "suggestions": [
            {
                "id": "uuid",
                "name_ar": "مصر",
                "name_en": "Egypt",
                "flag_emoji": "🇪🇬",
                "score": 1.0
            },
            {
                "id": "uuid",
                "name_ar": "عُمان",
                "name_en": "Oman",
                "flag_emoji": "🇴🇲",
                "score": 0.4
            }
        ]
    }
    ```
    """
    # Normalize query for search
    normalized_query = normalize_arabic(q)

    # Search in database
    countries = await country_crud.search_by_arabic_name(
        db,
        query=normalized_query,
        limit=limit * 2,  # Get more to filter by similarity
    )

    # Calculate similarity scores and sort
    suggestions = []
    for country in countries:
        similarity = calculate_similarity(normalized_query, country.name_ar_normalized)
        if similarity > 0.2:  # Minimum threshold
            suggestions.append(
                AutocompleteSuggestion(
                    id=country.id,
                    name_ar=country.name_ar,
                    name_en=country.name_en,
                    flag_emoji=country.flag_emoji,
                    score=similarity,
                )
            )

    # Sort by score and limit
    suggestions.sort(key=lambda x: x.score, reverse=True)
    suggestions = suggestions[:limit]

    return AutocompleteResponse(
        query=q,
        suggestions=suggestions,
    )


@router.get("/capitals", response_model=AutocompleteResponse)
async def search_capitals(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=20),
) -> AutocompleteResponse:
    """Search capitals by Arabic name."""
    normalized_query = normalize_arabic(q)
    countries = await country_crud.search_by_capital(db, normalized_query, limit)

    suggestions = [
        AutocompleteSuggestion(
            id=c.id,
            name_ar=c.capital_ar,
            name_en=c.capital_en,
            flag_emoji=c.flag_emoji,
            score=calculate_similarity(normalized_query, normalize_arabic(c.capital_ar)),
        )
        for c in countries
        if c.capital_ar
    ]

    return AutocompleteResponse(query=q, suggestions=suggestions)
```

### 5.4 User Endpoints (`app/routers/users.py`)

```python
"""
User profile and achievement API endpoints.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import Profile
from app.schemas.user import (
    ProfileResponse,
    ProfileUpdateRequest,
    AchievementResponse,
    LeaderboardResponse,
    LeaderboardEntry,
)
from app.crud.user import profile_crud, achievement_crud

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=ProfileResponse)
async def get_current_profile(
    current_user: Annotated[Profile, Depends(get_current_user)],
) -> ProfileResponse:
    """
    Get current user's profile.

    Example Response:
    ```json
    {
        "id": "uuid",
        "username": "ahmed123",
        "display_name": "أحمد",
        "avatar_url": "https://...",
        "current_streak": 7,
        "max_streak": 15,
        "games_played": 42,
        "games_won": 38,
        "total_questions_answered": 156,
        "total_correct_answers": 132,
        "created_at": "2026-01-15T10:30:00Z"
    }
    ```
    """
    return ProfileResponse.model_validate(current_user)


@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile, Depends(get_current_user)],
) -> ProfileResponse:
    """
    Update current user's profile.

    Request Body:
    ```json
    {
        "username": "new_username",
        "display_name": "اسم جديد",
        "avatar_url": "https://..."
    }
    ```
    """
    # Check username uniqueness if being updated
    if request.username and request.username != current_user.username:
        existing = await profile_crud.get_by_username(db, request.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم مستخدم بالفعل"
            )

    updated = await profile_crud.update(db, db_obj=current_user, obj_in=request)
    return ProfileResponse.model_validate(updated)


@router.get("/achievements", response_model=list[AchievementResponse])
async def get_user_achievements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile, Depends(get_current_user)],
) -> list[AchievementResponse]:
    """
    Get current user's achievements.

    Example Response:
    ```json
    [
        {
            "id": "uuid",
            "code": "first_win",
            "name_ar": "الفوز الأول",
            "name_en": "First Win",
            "description_ar": "أكمل أول تحدٍ يومي بنجاح",
            "icon": "🏆",
            "points": 10,
            "unlocked": true,
            "unlocked_at": "2026-01-20T15:30:00Z",
            "progress": {"current": 1, "target": 1}
        },
        {
            "id": "uuid",
            "code": "streak_7",
            "name_ar": "أسبوع كامل",
            "name_en": "Week Warrior",
            "description_ar": "حافظ على سلسلة فوز لمدة 7 أيام",
            "icon": "📅",
            "points": 100,
            "unlocked": false,
            "progress": {"current": 3, "target": 7}
        }
    ]
    ```
    """
    achievements = await achievement_crud.get_all_with_user_progress(
        db, current_user.id
    )
    return [AchievementResponse.model_validate(a) for a in achievements]


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Profile | None, Depends(get_current_user_optional)],
    type: str = "streak",  # streak, games_won, quiz_accuracy
    limit: int = 100,
) -> LeaderboardResponse:
    """
    Get global leaderboard.

    Query Parameters:
    - `type`: Leaderboard type (streak, games_won, quiz_accuracy)
    - `limit`: Number of entries to return

    Example Response:
    ```json
    {
        "type": "streak",
        "entries": [
            {
                "rank": 1,
                "user_id": "uuid",
                "display_name": "أحمد",
                "avatar_url": "https://...",
                "value": 45,
                "is_current_user": false
            },
            {
                "rank": 2,
                "user_id": "uuid",
                "display_name": "سارة",
                "avatar_url": "https://...",
                "value": 38,
                "is_current_user": true
            }
        ],
        "current_user_rank": 2
    }
    ```
    """
    entries = await profile_crud.get_leaderboard(db, type, limit)

    leaderboard_entries = []
    current_user_rank = None

    for rank, entry in enumerate(entries, start=1):
        is_current = current_user and entry.id == current_user.id
        if is_current:
            current_user_rank = rank

        leaderboard_entries.append(
            LeaderboardEntry(
                rank=rank,
                user_id=entry.id,
                display_name=entry.display_name or "مجهول",
                avatar_url=entry.avatar_url,
                value=getattr(entry, type) if type != "quiz_accuracy" else entry.quiz_accuracy,
                is_current_user=is_current,
            )
        )

    return LeaderboardResponse(
        type=type,
        entries=leaderboard_entries,
        current_user_rank=current_user_rank,
    )
```

---

## 6. Service Layer Design

### 6.1 PathFinder Service (`app/services/path_finder.py`)

```python
"""
Path finding service for country graph traversal.
Implements BFS/Dijkstra for shortest path calculation.
"""

from collections import deque
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.country import Country, Border
from app.models.game import DailyChallenge


class PathFinderService:
    """Service for finding shortest paths between countries."""

    async def build_graph(self, db: AsyncSession) -> dict[UUID, set[UUID]]:
        """
        Build adjacency list representation of country graph.

        Returns:
            Dict mapping country_id to set of neighbor country_ids
        """
        # Fetch all borders
        result = await db.execute(select(Border))
        borders = result.scalars().all()

        graph: dict[UUID, set[UUID]] = {}

        for border in borders:
            # Add bidirectional edges
            if border.country_a_id not in graph:
                graph[border.country_a_id] = set()
            if border.country_b_id not in graph:
                graph[border.country_b_id] = set()

            graph[border.country_a_id].add(border.country_b_id)
            graph[border.country_b_id].add(border.country_a_id)

        return graph

    async def find_shortest_path(
        self,
        db: AsyncSession,
        start_id: UUID,
        end_id: UUID,
    ) -> list[UUID] | None:
        """
        Find shortest path between two countries using BFS.

        Args:
            db: Database session
            start_id: Starting country ID
            end_id: Destination country ID

        Returns:
            List of country IDs in the shortest path, or None if no path exists
        """
        if start_id == end_id:
            return [start_id]

        graph = await self.build_graph(db)

        if start_id not in graph or end_id not in graph:
            return None

        # BFS
        queue = deque([(start_id, [start_id])])
        visited = {start_id}

        while queue:
            current, path = queue.popleft()

            for neighbor in graph.get(current, set()):
                if neighbor == end_id:
                    return path + [neighbor]

                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return None  # No path found

    async def calculate_shortest_path_length(
        self,
        db: AsyncSession,
        start_id: UUID,
        end_id: UUID,
    ) -> int:
        """Calculate the length of the shortest path (number of intermediate countries)."""
        path = await self.find_shortest_path(db, start_id, end_id)
        if path is None:
            return -1  # No path
        return len(path) - 2  # Exclude start and end

    async def get_all_shortest_paths(
        self,
        db: AsyncSession,
        start_id: UUID,
        end_id: UUID,
    ) -> list[list[UUID]]:
        """
        Find all shortest paths between two countries.
        Useful for determining if a guess is on ANY optimal path.
        """
        if start_id == end_id:
            return [[start_id]]

        graph = await self.build_graph(db)
        paths: list[list[UUID]] = []
        min_length = float('inf')

        queue = deque([(start_id, [start_id])])

        while queue:
            current, path = queue.popleft()

            if len(path) > min_length:
                continue

            for neighbor in graph.get(current, set()):
                if neighbor in path:  # Avoid cycles
                    continue

                new_path = path + [neighbor]

                if neighbor == end_id:
                    if len(new_path) < min_length:
                        min_length = len(new_path)
                        paths = [new_path]
                    elif len(new_path) == min_length:
                        paths.append(new_path)
                else:
                    queue.append((neighbor, new_path))

        return paths

    async def is_on_shortest_path(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        country_id: UUID,
    ) -> bool:
        """Check if a country is on any shortest path for the challenge."""
        all_paths = await self.get_all_shortest_paths(
            db, challenge.start_country_id, challenge.end_country_id
        )
        return any(country_id in path for path in all_paths)

    async def get_distance_from_path(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        country_id: UUID,
    ) -> int:
        """
        Calculate how far a country is from the shortest path.

        Returns:
            0 if on shortest path
            1 if one step away
            2+ for farther
            -1 if unreachable
        """
        all_paths = await self.get_all_shortest_paths(
            db, challenge.start_country_id, challenge.end_country_id
        )

        if not all_paths:
            return -1

        # Countries on shortest path
        path_countries = set()
        for path in all_paths:
            path_countries.update(path)

        if country_id in path_countries:
            return 0

        # Calculate distance to nearest path country
        graph = await self.build_graph(db)
        queue = deque([(country_id, 0)])
        visited = {country_id}

        while queue:
            current, dist = queue.popleft()

            if current in path_countries:
                return dist

            for neighbor in graph.get(current, set()):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, dist + 1))

        return -1

    async def generate_hint(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        hint_type: str,
        previous_guesses: list[dict],
    ) -> dict[str, Any]:
        """
        Generate hint based on hint type.

        Hint Types:
        - border_hint: Show borders of one country on path
        - all_borders_hint: Show all countries on shortest path
        - first_letter_hint: Show first letters of path countries
        """
        path = await self.find_shortest_path(
            db, challenge.start_country_id, challenge.end_country_id
        )

        if not path:
            return {"error": "No path found"}

        # Get country details
        result = await db.execute(
            select(Country).where(Country.id.in_(path))
        )
        countries = {c.id: c for c in result.scalars().all()}

        # Exclude start, end, and already guessed countries
        guessed_ids = {g["country_id"] for g in previous_guesses}
        hint_candidates = [
            cid for cid in path[1:-1]  # Exclude start and end
            if cid not in guessed_ids
        ]

        if hint_type == "border_hint":
            if not hint_candidates:
                return {"message": "لا توجد تلميحات إضافية"}

            # Pick a random country from path
            hint_country_id = hint_candidates[0]
            hint_country = countries[hint_country_id]

            # Get its borders
            graph = await self.build_graph(db)
            border_ids = graph.get(hint_country_id, set())
            border_result = await db.execute(
                select(Country).where(Country.id.in_(border_ids))
            )
            border_countries = border_result.scalars().all()

            return {
                "country_name_ar": hint_country.name_ar,
                "border_countries": [c.name_ar for c in border_countries],
            }

        elif hint_type == "all_borders_hint":
            path_countries = [countries[cid].name_ar for cid in path[1:-1]]
            return {
                "path_countries": path_countries,
                "path_length": len(path) - 2,
            }

        elif hint_type == "first_letter_hint":
            first_letters = [
                countries[cid].name_ar[0] for cid in hint_candidates
            ]
            return {
                "first_letters": first_letters,
                "remaining_count": len(hint_candidates),
            }

        return {"error": "Unknown hint type"}
```

### 6.2 QuizEngine Service (`app/services/quiz_engine.py`)

```python
"""
Quiz engine service for question selection and scoring.
"""

from typing import Any
from uuid import UUID
import random

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question, QuestionCategory, QuestionDifficulty, QuestionType
from app.schemas.quiz import QuestionResponse, AnswerResult
from app.utils.arabic import normalize_arabic, calculate_similarity


class QuizEngine:
    """Service for quiz game logic."""

    # Scoring constants
    BASE_SCORE = 10
    HINT_PENALTY = 3
    TIME_BONUS_THRESHOLD_MS = 5000  # 5 seconds
    TIME_BONUS_POINTS = 2

    async def generate_session(
        self,
        db: AsyncSession,
        category: QuestionCategory | None = None,
        difficulty: QuestionDifficulty | None = None,
        question_type: QuestionType | None = None,
        num_questions: int = 10,
    ) -> list[QuestionResponse]:
        """
        Generate a quiz session with specified number of questions.
        Ensures good distribution of categories and difficulties.
        """
        query = select(Question).where(Question.is_active == True)

        if category:
            query = query.where(Question.category == category)
        if difficulty:
            query = query.where(Question.difficulty == difficulty)
        if question_type:
            query = query.where(Question.question_type == question_type)

        # Get more questions than needed for random selection
        query = query.order_by(func.random()).limit(num_questions * 2)
        result = await db.execute(query)
        questions = list(result.scalars().all())

        # Shuffle and select
        random.shuffle(questions)
        selected = questions[:num_questions]

        return [
            QuestionResponse(
                id=q.id,
                category=q.category,
                difficulty=q.difficulty,
                question_type=q.question_type,
                question_ar=q.question_ar,
                options=q.options if q.question_type == QuestionType.MULTIPLE_CHOICE else None,
                hint=q.hint,
                image_url=q.image_url,
            )
            for q in selected
        ]

    def check_answer(
        self,
        question: Question,
        user_answer: str,
        hints_used: int = 0,
        time_taken_ms: int | None = None,
    ) -> AnswerResult:
        """
        Check if the user's answer is correct.

        For autocomplete questions, uses fuzzy matching.
        For multiple choice, uses exact matching.
        """
        is_correct = False
        score = 0
        explanation = None

        if question.question_type == QuestionType.MULTIPLE_CHOICE:
            # Exact match for multiple choice
            is_correct = user_answer == question.correct_answer

        else:  # Autocomplete
            # Fuzzy matching for autocomplete
            normalized_answer = normalize_arabic(user_answer)
            normalized_correct = normalize_arabic(question.correct_answer)

            # Check exact match first
            if normalized_answer == normalized_correct:
                is_correct = True
            else:
                # Fuzzy match with high threshold
                similarity = calculate_similarity(normalized_answer, normalized_correct)
                is_correct = similarity >= 0.85

        if is_correct:
            # Calculate score
            if question.question_type == QuestionType.MULTIPLE_CHOICE:
                score = self.BASE_SCORE
            else:
                # Autocomplete gets higher base score
                score = 15 - (hints_used * self.HINT_PENALTY)

            # Time bonus
            if time_taken_ms and time_taken_ms < self.TIME_BONUS_THRESHOLD_MS:
                score += self.TIME_BONUS_POINTS

            # Difficulty multiplier
            if question.difficulty == QuestionDifficulty.MEDIUM:
                score = int(score * 1.5)
            elif question.difficulty == QuestionDifficulty.HARD:
                score = int(score * 2)

            score = max(score, 1)  # Minimum 1 point

        return AnswerResult(
            is_correct=is_correct,
            score=score,
            explanation=explanation,
        )

    async def get_daily_quiz(
        self,
        db: AsyncSession,
        num_questions: int = 10,
    ) -> list[QuestionResponse]:
        """
        Get a consistent daily quiz (same questions for all users on same day).
        Uses date as seed for random selection.
        """
        from datetime import date
        today = date.today()
        seed = int(today.strftime("%Y%m%d"))

        # Get all active questions
        result = await db.execute(
            select(Question).where(Question.is_active == True)
        )
        all_questions = list(result.scalars().all())

        # Seed random for consistent daily selection
        rng = random.Random(seed)
        rng.shuffle(all_questions)

        # Select with category distribution
        selected = self._select_with_distribution(all_questions, num_questions, rng)

        return [
            QuestionResponse(
                id=q.id,
                category=q.category,
                difficulty=q.difficulty,
                question_type=q.question_type,
                question_ar=q.question_ar,
                options=q.options if q.question_type == QuestionType.MULTIPLE_CHOICE else None,
                hint=q.hint,
                image_url=q.image_url,
            )
            for q in selected
        ]

    def _select_with_distribution(
        self,
        questions: list[Question],
        num_questions: int,
        rng: random.Random,
    ) -> list[Question]:
        """
        Select questions with good distribution across categories and difficulties.
        """
        # Group by category
        by_category: dict[QuestionCategory, list[Question]] = {}
        for q in questions:
            if q.category not in by_category:
                by_category[q.category] = []
            by_category[q.category].append(q)

        selected = []
        categories = list(by_category.keys())
        rng.shuffle(categories)

        # Round-robin selection from categories
        category_index = 0
        while len(selected) < num_questions and any(by_category.values()):
            cat = categories[category_index % len(categories)]
            if by_category[cat]:
                selected.append(by_category[cat].pop())
            category_index += 1

            # Remove empty categories
            categories = [c for c in categories if by_category[c]]

        return selected[:num_questions]
```

### 6.3 Score Calculator (`app/services/score_calculator.py`)

```python
"""
Score calculation service for the path game.
Determines emoji feedback based on guess quality.
"""

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.country import Country
from app.models.game import DailyChallenge
from app.services.path_finder import PathFinderService


@dataclass
class GuessScoreResult:
    """Result of scoring a guess."""
    country: Country
    emoji: str
    description_ar: str
    is_on_shortest_path: bool
    is_destination: bool
    distance_from_path: int

    def to_guess_entry(self) -> dict[str, Any]:
        """Convert to dictionary for storing in game result."""
        return {
            "country_id": str(self.country.id),
            "name_ar": self.country.name_ar,
            "emoji": self.emoji,
            "is_on_path": self.is_on_shortest_path,
        }


class ScoreCalculator:
    """Service for calculating guess scores in the path game."""

    # Emoji mapping
    EMOJI_EXCELLENT = "🟢"  # On shortest path, correct position
    EMOJI_GOOD = "🟡"       # On shortest path, wrong position
    EMOJI_OKAY = "🟠"       # Close to shortest path (1 step away)
    EMOJI_FAR = "🔴"        # Far from shortest path (2+ steps)
    EMOJI_WRONG = "⚫"      # Different continent/unreachable

    # Arabic descriptions
    DESCRIPTIONS = {
        "🟢": "ممتاز",
        "🟡": "جيد",
        "🟠": "مقبول",
        "🔴": "بعيد",
        "⚫": "قارة مختلفة",
    }

    def __init__(self):
        self.path_finder = PathFinderService()

    async def calculate_guess_score(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        guessed_country_id: UUID,
        previous_guesses: list[dict],
    ) -> GuessScoreResult:
        """
        Calculate score for a guess.

        Scoring Logic:
        - 🟢 (Excellent): On shortest path AND in correct order
        - 🟡 (Good): On shortest path BUT wrong order
        - 🟠 (Okay): One step away from shortest path
        - 🔴 (Far): 2+ steps away from shortest path
        - ⚫ (Wrong Continent): Different landmass or unreachable
        """
        # Get country details
        from sqlalchemy import select
        result = await db.execute(
            select(Country).where(Country.id == guessed_country_id)
        )
        country = result.scalar_one_or_none()

        if not country:
            raise ValueError("Country not found")

        # Check if this is the destination
        is_destination = guessed_country_id == challenge.end_country_id

        if is_destination:
            return GuessScoreResult(
                country=country,
                emoji=self.EMOJI_EXCELLENT,
                description_ar=self.DESCRIPTIONS[self.EMOJI_EXCELLENT],
                is_on_shortest_path=True,
                is_destination=True,
                distance_from_path=0,
            )

        # Get all shortest paths
        all_paths = await self.path_finder.get_all_shortest_paths(
            db, challenge.start_country_id, challenge.end_country_id
        )

        if not all_paths:
            return GuessScoreResult(
                country=country,
                emoji=self.EMOJI_WRONG,
                description_ar=self.DESCRIPTIONS[self.EMOJI_WRONG],
                is_on_shortest_path=False,
                is_destination=False,
                distance_from_path=-1,
            )

        # Check if on any shortest path
        is_on_path = any(guessed_country_id in path for path in all_paths)

        if is_on_path:
            # Check if in correct order
            # A guess is in "correct order" if it could be the next step
            # from the last correct guess
            in_correct_order = self._is_in_correct_order(
                guessed_country_id, previous_guesses, all_paths, challenge
            )

            emoji = self.EMOJI_EXCELLENT if in_correct_order else self.EMOJI_GOOD

            return GuessScoreResult(
                country=country,
                emoji=emoji,
                description_ar=self.DESCRIPTIONS[emoji],
                is_on_shortest_path=True,
                is_destination=False,
                distance_from_path=0,
            )

        # Calculate distance from path
        distance = await self.path_finder.get_distance_from_path(
            db, challenge, guessed_country_id
        )

        # Check if same continent
        start_country = await db.get(Country, challenge.start_country_id)
        same_continent = country.continent == start_country.continent

        if distance == -1 or not same_continent:
            emoji = self.EMOJI_WRONG
        elif distance == 1:
            emoji = self.EMOJI_OKAY
        else:
            emoji = self.EMOJI_FAR

        return GuessScoreResult(
            country=country,
            emoji=emoji,
            description_ar=self.DESCRIPTIONS[emoji],
            is_on_shortest_path=False,
            is_destination=False,
            distance_from_path=distance,
        )

    def _is_in_correct_order(
        self,
        guessed_id: UUID,
        previous_guesses: list[dict],
        all_paths: list[list[UUID]],
        challenge: DailyChallenge,
    ) -> bool:
        """
        Check if the guess is in the correct order.

        A guess is in correct order if it's a valid next step from either:
        1. The start country (if no correct guesses yet)
        2. The last correctly guessed country on the path
        """
        # Get previous correct guesses
        correct_guesses = [
            UUID(g["country_id"]) for g in previous_guesses
            if g.get("is_on_path", False)
        ]

        # Find current position in any path
        last_position = challenge.start_country_id
        if correct_guesses:
            last_position = correct_guesses[-1]

        # Check if guessed country can follow the last position in any path
        for path in all_paths:
            try:
                last_idx = path.index(last_position)
                if last_idx + 1 < len(path) and path[last_idx + 1] == guessed_id:
                    return True
            except ValueError:
                continue

        return False

    def calculate_final_score(
        self,
        total_guesses: int,
        hints_used: int,
        shortest_path: int,
    ) -> int:
        """
        Calculate final score when game is completed.

        Scoring:
        - Base: 100 points
        - Efficiency bonus: +50 if guesses == shortest_path
        - Hint penalty: -10 per hint used
        - Extra guesses penalty: -5 per guess over shortest path
        """
        base_score = 100

        # Efficiency bonus
        if total_guesses <= shortest_path:
            efficiency_bonus = 50
        else:
            efficiency_bonus = max(0, 50 - (total_guesses - shortest_path) * 5)

        # Hint penalty
        hint_penalty = hints_used * 10

        final_score = max(10, base_score + efficiency_bonus - hint_penalty)
        return final_score
```

---

## 7. Authentication (Supabase JWT)

### 7.1 Security Module (`app/core/security.py`)

```python
"""
Security utilities for JWT verification with Supabase.
"""

from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings


class SupabaseAuth:
    """Supabase JWT authentication handler."""

    def __init__(self):
        self.jwt_secret = settings.SUPABASE_JWT_SECRET
        self.algorithm = "HS256"

    def verify_token(self, token: str) -> dict[str, Any]:
        """
        Verify a Supabase JWT token.

        Returns:
            Decoded token payload with user info

        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.algorithm],
                audience="authenticated",
            )

            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="انتهت صلاحية الجلسة",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            return payload

        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="رمز التحقق غير صالح",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def get_user_id(self, token: str) -> str:
        """Extract user ID from token."""
        payload = self.verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="معرف المستخدم غير موجود في الرمز",
            )
        return user_id


supabase_auth = SupabaseAuth()
```

### 7.2 Dependencies (`app/core/deps.py`)

```python
"""
FastAPI dependencies for authentication and database access.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import supabase_auth
from app.models.user import Profile
from app.crud.user import profile_crud

# Bearer token scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Profile:
    """
    Get the current authenticated user.

    Raises:
        HTTPException: If not authenticated or user not found
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="يجب تسجيل الدخول",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = supabase_auth.get_user_id(credentials.credentials)

    profile = await profile_crud.get(db, UUID(user_id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الملف الشخصي غير موجود",
        )

    return profile


async def get_current_user_optional(
    db: Annotated[AsyncSession, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Profile | None:
    """
    Get the current user if authenticated, otherwise None.
    Used for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None

    try:
        user_id = supabase_auth.get_user_id(credentials.credentials)
        return await profile_crud.get(db, UUID(user_id))
    except HTTPException:
        return None
```

---

## 8. Arabic Text Processing

### 8.1 Arabic Utilities (`app/utils/arabic.py`)

```python
"""
Arabic text processing utilities.
Handles diacritics, normalization, and fuzzy matching.
"""

import re
import unicodedata
from functools import lru_cache


# Arabic diacritics (tashkeel) Unicode range
ARABIC_DIACRITICS = re.compile(r'[\u064B-\u065F\u0670]')

# Arabic tatweel (kashida)
TATWEEL = '\u0640'

# Alef variations
ALEF_VARIATIONS = {
    'أ': 'ا',  # Alef with hamza above
    'إ': 'ا',  # Alef with hamza below
    'آ': 'ا',  # Alef with madda
    'ٱ': 'ا',  # Alef wasla
}

# Yeh/Alef maksura variations
YEH_VARIATIONS = {
    'ى': 'ي',  # Alef maksura to yeh
    'ئ': 'ي',  # Yeh with hamza
}

# Teh marbuta to heh
TEH_MARBUTA = {
    'ة': 'ه',
}


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for comparison and search.

    Transformations:
    1. Unicode NFKC normalization
    2. Remove diacritics (tashkeel)
    3. Remove tatweel (kashida)
    4. Normalize alef variations
    5. Normalize yeh/alef maksura
    6. Strip whitespace

    Example:
        normalize_arabic("السَّعُودِيَّة") → "السعوديه"
        normalize_arabic("الإمارات") → "الامارات"
    """
    if not text:
        return ""

    # Unicode normalization
    text = unicodedata.normalize("NFKC", text)

    # Remove diacritics
    text = ARABIC_DIACRITICS.sub('', text)

    # Remove tatweel
    text = text.replace(TATWEEL, '')

    # Normalize alef
    for original, replacement in ALEF_VARIATIONS.items():
        text = text.replace(original, replacement)

    # Normalize yeh
    for original, replacement in YEH_VARIATIONS.items():
        text = text.replace(original, replacement)

    # Normalize teh marbuta (optional, depends on use case)
    for original, replacement in TEH_MARBUTA.items():
        text = text.replace(original, replacement)

    return text.strip()


def remove_diacritics(text: str) -> str:
    """Remove Arabic diacritics only."""
    return ARABIC_DIACRITICS.sub('', text)


@lru_cache(maxsize=10000)
def calculate_similarity(s1: str, s2: str) -> float:
    """
    Calculate similarity between two strings.
    Uses Levenshtein distance normalized to 0-1 range.

    Returns:
        Float between 0 (completely different) and 1 (identical)
    """
    if not s1 or not s2:
        return 0.0

    if s1 == s2:
        return 1.0

    # Normalize both strings
    s1 = normalize_arabic(s1)
    s2 = normalize_arabic(s2)

    if s1 == s2:
        return 1.0

    # Calculate Levenshtein distance
    len1, len2 = len(s1), len(s2)
    if len1 > len2:
        s1, s2 = s2, s1
        len1, len2 = len2, len1

    # Early exit for very different lengths
    if len2 - len1 > len2 * 0.5:
        return 0.0

    # DP array
    current_row = list(range(len1 + 1))

    for i in range(1, len2 + 1):
        previous_row = current_row
        current_row = [i] + [0] * len1

        for j in range(1, len1 + 1):
            add = previous_row[j] + 1
            delete = current_row[j - 1] + 1
            change = previous_row[j - 1]
            if s1[j - 1] != s2[i - 1]:
                change += 1
            current_row[j] = min(add, delete, change)

    distance = current_row[len1]
    max_len = max(len1, len2)

    return 1 - (distance / max_len)


def fuzzy_match(query: str, candidates: list[str], threshold: float = 0.6) -> list[tuple[str, float]]:
    """
    Find fuzzy matches for a query in a list of candidates.

    Returns:
        List of (candidate, score) tuples above threshold, sorted by score descending
    """
    query = normalize_arabic(query)
    results = []

    for candidate in candidates:
        score = calculate_similarity(query, candidate)
        if score >= threshold:
            results.append((candidate, score))

    return sorted(results, key=lambda x: x[1], reverse=True)


def extract_first_letter(text: str) -> str:
    """
    Extract the first meaningful letter from Arabic text.
    Skips the definite article "ال" if present.
    """
    text = text.strip()
    if not text:
        return ""

    # Skip "ال" at the beginning
    if text.startswith("ال") and len(text) > 2:
        return text[2]

    return text[0]


def is_arabic(text: str) -> bool:
    """Check if text contains Arabic characters."""
    return bool(re.search(r'[\u0600-\u06FF]', text))


def contains_arabic_digits(text: str) -> bool:
    """Check if text contains Arabic-Indic digits."""
    return bool(re.search(r'[٠-٩]', text))


def arabic_to_western_digits(text: str) -> str:
    """Convert Arabic-Indic digits to Western digits."""
    arabic_digits = '٠١٢٣٤٥٦٧٨٩'
    western_digits = '0123456789'

    for a, w in zip(arabic_digits, western_digits):
        text = text.replace(a, w)

    return text
```

---

## 9. Error Handling & Validation

### 9.1 Exception Handlers (`app/core/exceptions.py`)

```python
"""
Custom exceptions and error handlers.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError


class RahalException(Exception):
    """Base exception for Rahal application."""

    def __init__(
        self,
        message_ar: str,
        message_en: str = "",
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ):
        self.message_ar = message_ar
        self.message_en = message_en or message_ar
        self.status_code = status_code
        super().__init__(self.message_ar)


class NotFoundError(RahalException):
    """Resource not found."""

    def __init__(self, resource: str = "المورد"):
        super().__init__(
            message_ar=f"{resource} غير موجود",
            message_en=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class AuthenticationError(RahalException):
    """Authentication failed."""

    def __init__(self, message_ar: str = "فشل في التحقق"):
        super().__init__(
            message_ar=message_ar,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class PermissionError(RahalException):
    """Permission denied."""

    def __init__(self):
        super().__init__(
            message_ar="ليس لديك صلاحية لهذا الإجراء",
            message_en="Permission denied",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class GameError(RahalException):
    """Game-related error."""

    def __init__(self, message_ar: str):
        super().__init__(
            message_ar=message_ar,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers."""

    @app.exception_handler(RahalException)
    async def rahal_exception_handler(request: Request, exc: RahalException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message_ar,
                "detail_en": exc.message_en,
                "type": exc.__class__.__name__,
            },
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "بيانات غير صالحة",
                "detail_en": "Invalid data",
                "errors": exc.errors(),
            },
        )
```

### 9.2 Response Schemas (`app/schemas/common.py`)

```python
"""
Common response schemas.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str = Field(..., description="Error message in Arabic")
    detail_en: str | None = Field(None, description="Error message in English")
    type: str | None = Field(None, description="Error type")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: list[T]
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: str = Field(default="تمت العملية بنجاح")
    data: dict[str, Any] | None = None
```

---

## 10. Testing Strategy

### 10.1 Test Configuration (`tests/conftest.py`)

```python
"""
Pytest fixtures and configuration.
"""

import asyncio
from typing import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres_test"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
)

TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with overridden database."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, db_session: AsyncSession) -> AsyncClient:
    """Create authenticated test client."""
    from app.models.user import Profile

    # Create test user
    user_id = uuid4()
    profile = Profile(
        id=user_id,
        username="testuser",
        display_name="Test User",
    )
    db_session.add(profile)
    await db_session.commit()

    # Create mock JWT token (for testing only)
    from jose import jwt
    from app.core.config import settings

    token = jwt.encode(
        {"sub": str(user_id), "aud": "authenticated"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )

    client.headers["Authorization"] = f"Bearer {token}"
    return client
```

### 10.2 Sample Tests (`tests/test_game.py`)

```python
"""
Tests for game API endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.country import Country, Border
from app.models.game import DailyChallenge


@pytest.mark.asyncio
async def test_get_daily_challenge(client: AsyncClient, db_session: AsyncSession):
    """Test getting daily challenge."""
    # Create test countries
    egypt = Country(
        code="EGY",
        name_ar="مصر",
        name_en="Egypt",
        name_ar_normalized="مصر",
    )
    jordan = Country(
        code="JOR",
        name_ar="الأردن",
        name_en="Jordan",
        name_ar_normalized="الاردن",
    )
    db_session.add_all([egypt, jordan])
    await db_session.flush()

    # Create challenge
    from datetime import date
    challenge = DailyChallenge(
        challenge_date=date.today(),
        start_country_id=egypt.id,
        end_country_id=jordan.id,
        shortest_path=2,
    )
    db_session.add(challenge)
    await db_session.commit()

    # Test endpoint
    response = await client.get("/api/game/daily")
    assert response.status_code == 200

    data = response.json()
    assert data["start_country"]["name_ar"] == "مصر"
    assert data["end_country"]["name_ar"] == "الأردن"
    assert data["shortest_path"] == 2


@pytest.mark.asyncio
async def test_submit_guess(auth_client: AsyncClient, db_session: AsyncSession):
    """Test submitting a guess."""
    # Setup: Create countries, borders, and challenge
    # ... (similar setup as above)

    response = await auth_client.post(
        "/api/game/guess",
        json={
            "challenge_id": str(challenge_id),
            "country_id": str(guess_country_id),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "score_emoji" in data
    assert data["score_emoji"] in ["🟢", "🟡", "🟠", "🔴", "⚫"]
```

---

## 11. Environment Configuration

### 11.1 Configuration (`app/core/config.py`)

```python
"""
Application settings from environment variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "Rahal API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:54322/postgres"
    DATABASE_URL_ASYNC: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"

    # Supabase
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = "super-secret-jwt-token-with-at-least-32-characters-long"

    # Strapi CMS
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Cache
    REDIS_URL: str | None = None

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

### 11.2 Environment File Template (`.env.example`)

```env
# Application
APP_NAME=Rahal API
DEBUG=true
ENVIRONMENT=development

# Database (Supabase local)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DATABASE_URL_ASYNC=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres

# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Strapi CMS
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Cache (optional)
REDIS_URL=
```

---

## 12. Deployment Guide

### 12.1 Docker Configuration (`Dockerfile`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

# Expose port
EXPOSE 8000

# Run application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 12.2 Main Application (`app/main.py`)

```python
"""
FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.routers import game, quiz, users, autocomplete, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="رحال - Arabic Geography Game API",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(game.router)
app.include_router(quiz.router)
app.include_router(users.router)
app.include_router(autocomplete.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "رحال API",
        "name_en": "Rahal API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else None,
    }
```

### 12.3 Deployment Checklist

**Pre-deployment:**
- [ ] Run all tests: `pytest`
- [ ] Run linter: `ruff check .`
- [ ] Run type checker: `mypy .`
- [ ] Update version in `pyproject.toml`
- [ ] Run migrations locally: `alembic upgrade head`

**Production Environment:**
- [ ] Set `DEBUG=false`
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure production database URL
- [ ] Set up SSL/TLS
- [ ] Configure CORS origins
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Set up logging
- [ ] Configure rate limiting

**Deployment Platforms:**

| Platform | Command/Process |
|----------|-----------------|
| **Railway** | Connect GitHub repo, auto-deploys on push |
| **Render** | Connect GitHub repo, auto-deploys on push |
| **Fly.io** | `fly launch && fly deploy` |
| **Docker** | `docker build -t rahal-backend . && docker run -p 8000:8000 rahal-backend` |

---

## Appendix A: API Response Examples

### Daily Challenge Response

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "challenge_date": "2026-01-30",
    "start_country": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "code": "SAU",
        "name_ar": "السعودية",
        "name_en": "Saudi Arabia",
        "flag_emoji": "🇸🇦",
        "continent": "آسيا"
    },
    "end_country": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "code": "EGY",
        "name_ar": "مصر",
        "name_en": "Egypt",
        "flag_emoji": "🇪🇬",
        "continent": "أفريقيا"
    },
    "shortest_path": 2,
    "user_progress": null
}
```

### Guess Response

```json
{
    "country": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name_ar": "الأردن",
        "name_en": "Jordan",
        "flag_emoji": "🇯🇴"
    },
    "score_emoji": "🟢",
    "score_description": "ممتاز",
    "is_on_shortest_path": true,
    "is_destination": false,
    "game_complete": false,
    "total_guesses": 1
}
```

---

**Document Status:** Complete
**Next Steps:** Implement front-end.md

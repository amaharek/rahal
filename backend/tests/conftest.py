"""
Pytest configuration and fixtures for Rahal backend tests.
Provides database sessions, test clients, mock data, and utilities.
"""

import asyncio
import os
from typing import AsyncGenerator, Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.models.base import Base
from app.main import app
from app.models.country import Country, Border
from app.models.user import Profile
from app.models.game import DailyChallenge, GameResult
from app.models.question import Question


# Override database URL for testing
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"
)

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,  # Disable connection pooling for tests
)

# Create test session maker
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test.
    Rolls back all changes after the test completes.
    """
    async with test_engine.connect() as connection:
        # Drop all tables (including non-managed ones like daily_quizzes) with CASCADE
        await connection.execute(text("DROP SCHEMA public CASCADE"))
        await connection.execute(text("CREATE SCHEMA public"))
        await connection.commit()
        await connection.run_sync(Base.metadata.create_all)
        await connection.commit()

        async with AsyncSession(bind=connection, expire_on_commit=False) as session:
            yield session
            await session.rollback()

        await connection.execute(text("DROP SCHEMA public CASCADE"))
        await connection.execute(text("CREATE SCHEMA public"))
        await connection.commit()


@pytest.fixture
def client(db_session: AsyncSession) -> TestClient:
    """
    Create a test client with overridden database dependency.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async test client for testing async endpoints.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def sample_countries(db_session: AsyncSession) -> list[Country]:
    """
    Create sample countries for testing.
    Returns a graph: Egypt -> Sudan -> Ethiopia
                            -> Jordan -> Syria
    """
    countries = [
        Country(
            id=uuid4(),
            name_ar="مصر",
            name_en="Egypt",
            code="EGY",
            name_ar_normalized="مصر",
            flag_emoji="🇪🇬",
            continent="Africa",
        ),
        Country(
            id=uuid4(),
            name_ar="السودان",
            name_en="Sudan",
            code="SDN",
            name_ar_normalized="السودان",
            flag_emoji="🇸🇩",
            continent="Africa",
        ),
        Country(
            id=uuid4(),
            name_ar="إثيوبيا",
            name_en="Ethiopia",
            code="ETH",
            name_ar_normalized="اثيوبيا",
            flag_emoji="🇪🇹",
            continent="Africa",
        ),
        Country(
            id=uuid4(),
            name_ar="الأردن",
            name_en="Jordan",
            code="JOR",
            name_ar_normalized="الاردن",
            flag_emoji="🇯🇴",
            continent="Asia",
        ),
        Country(
            id=uuid4(),
            name_ar="سوريا",
            name_en="Syria",
            code="SYR",
            name_ar_normalized="سوريا",
            flag_emoji="🇸🇾",
            continent="Asia",
        ),
    ]

    for country in countries:
        db_session.add(country)
    await db_session.commit()

    # Add borders: Egypt <-> Sudan <-> Ethiopia
    #              Egypt <-> Jordan <-> Syria
    # Border CHECK constraint requires country_a_id < country_b_id
    def make_border(id_a, id_b):
        a, b = (id_a, id_b) if str(id_a) < str(id_b) else (id_b, id_a)
        return Border(country_a_id=a, country_b_id=b)

    borders = [
        make_border(countries[0].id, countries[1].id),  # Egypt-Sudan
        make_border(countries[1].id, countries[2].id),  # Sudan-Ethiopia
        make_border(countries[0].id, countries[3].id),  # Egypt-Jordan
        make_border(countries[3].id, countries[4].id),  # Jordan-Syria
    ]

    for border in borders:
        db_session.add(border)
    await db_session.commit()

    # Refresh to load relationships
    for country in countries:
        await db_session.refresh(country)

    return countries


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> Profile:
    """
    Create a sample user for testing.
    """
    user = Profile(
        id=uuid4(),
        username="testuser",
        display_name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_questions(db_session: AsyncSession) -> list[Question]:
    """
    Create sample quiz questions for testing.
    """
    questions = [
        Question(
            id=uuid4(),
            question_ar="ما هي عاصمة مصر؟",
            correct_answer="القاهرة",
            correct_answer_normalized="القاهره",
            options={"options": ["القاهرة", "الإسكندرية", "الجيزة", "الأقصر"]},
            category="capitals",
            difficulty="easy",
            question_type="multiple_choice",
        ),
        Question(
            id=uuid4(),
            question_ar="ما هو أطول نهر في العالم؟",
            correct_answer="النيل",
            correct_answer_normalized="النيل",
            options=None,
            category="geography",
            difficulty="medium",
            question_type="autocomplete",
        ),
        Question(
            id=uuid4(),
            question_ar="ما هي أكبر قارة في العالم؟",
            correct_answer="آسيا",
            correct_answer_normalized="اسيا",
            options={"options": ["آسيا", "أفريقيا", "أمريكا الشمالية", "أوروبا"]},
            category="geography",
            difficulty="easy",
            question_type="multiple_choice",
        ),
    ]

    for question in questions:
        db_session.add(question)
    await db_session.commit()

    for question in questions:
        await db_session.refresh(question)

    return questions


@pytest.fixture
async def sample_daily_challenge(
    db_session: AsyncSession,
    sample_countries: list[Country]
) -> DailyChallenge:
    """
    Create a sample daily challenge for testing.
    """
    from datetime import date

    challenge = DailyChallenge(
        id=uuid4(),
        challenge_date=date.today(),
        start_country_id=sample_countries[0].id,  # Egypt
        end_country_id=sample_countries[2].id,    # Ethiopia
        shortest_path=3,  # Egypt -> Sudan -> Ethiopia
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)
    return challenge


@pytest.fixture
def auth_headers(sample_user: Profile) -> dict[str, str]:
    """
    Generate authentication headers for testing protected endpoints.
    Uses Supabase JWT secret so verify_supabase_token accepts the token.
    """
    from datetime import datetime, timedelta, timezone
    from jose import jwt
    from app.core.config import settings

    payload = {
        "sub": str(sample_user.id),
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


# Utility functions for tests

def assert_country_equal(country1: Country, country2: Country):
    """Assert two countries are equal."""
    assert country1.id == country2.id
    assert country1.name_ar == country2.name_ar
    assert country1.name_en == country2.name_en
    assert country1.code == country2.code


def assert_question_equal(question1: Question, question2: Question):
    """Assert two questions are equal."""
    assert question1.id == question2.id
    assert question1.question_ar == question2.question_ar
    assert question1.correct_answer == question2.correct_answer
    assert question1.category == question2.category
    assert question1.difficulty == question2.difficulty

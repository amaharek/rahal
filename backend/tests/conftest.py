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
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.models.country import Country, CountryBorder
from app.models.user import User
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
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        
        async with TestSessionLocal() as session:
            yield session
            await session.rollback()
        
        await connection.run_sync(Base.metadata.drop_all)


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
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
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
            iso_alpha_2="EG",
            iso_alpha_3="EGY",
            flag_emoji="🇪🇬",
            continent="Africa",
            latitude=26.8206,
            longitude=30.8025,
        ),
        Country(
            id=uuid4(),
            name_ar="السودان",
            name_en="Sudan",
            iso_alpha_2="SD",
            iso_alpha_3="SDN",
            flag_emoji="🇸🇩",
            continent="Africa",
            latitude=12.8628,
            longitude=30.2176,
        ),
        Country(
            id=uuid4(),
            name_ar="إثيوبيا",
            name_en="Ethiopia",
            iso_alpha_2="ET",
            iso_alpha_3="ETH",
            flag_emoji="🇪🇹",
            continent="Africa",
            latitude=9.145,
            longitude=40.4897,
        ),
        Country(
            id=uuid4(),
            name_ar="الأردن",
            name_en="Jordan",
            iso_alpha_2="JO",
            iso_alpha_3="JOR",
            flag_emoji="🇯🇴",
            continent="Asia",
            latitude=30.5852,
            longitude=36.2384,
        ),
        Country(
            id=uuid4(),
            name_ar="سوريا",
            name_en="Syria",
            iso_alpha_2="SY",
            iso_alpha_3="SYR",
            flag_emoji="🇸🇾",
            continent="Asia",
            latitude=34.8021,
            longitude=38.9968,
        ),
    ]
    
    for country in countries:
        db_session.add(country)
    await db_session.commit()
    
    # Add borders: Egypt <-> Sudan <-> Ethiopia
    #              Egypt <-> Jordan <-> Syria
    borders = [
        CountryBorder(country_a_id=countries[0].id, country_b_id=countries[1].id),  # Egypt-Sudan
        CountryBorder(country_a_id=countries[1].id, country_b_id=countries[2].id),  # Sudan-Ethiopia
        CountryBorder(country_a_id=countries[0].id, country_b_id=countries[3].id),  # Egypt-Jordan
        CountryBorder(country_a_id=countries[3].id, country_b_id=countries[4].id),  # Jordan-Syria
    ]
    
    for border in borders:
        db_session.add(border)
    await db_session.commit()
    
    # Refresh to load relationships
    for country in countries:
        await db_session.refresh(country)
    
    return countries


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    """
    Create a sample user for testing.
    """
    user = User(
        id=uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYC5rvHa.uK",  # "password"
        full_name="Test User",
        is_active=True,
        is_superuser=False,
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
            question_en="What is the capital of Egypt?",
            correct_answer_ar="القاهرة",
            correct_answer_en="Cairo",
            options_ar=["القاهرة", "الإسكندرية", "الجيزة", "الأقصر"],
            options_en=["Cairo", "Alexandria", "Giza", "Luxor"],
            category="capitals",
            difficulty="easy",
            question_type="multiple_choice",
            points=10,
        ),
        Question(
            id=uuid4(),
            question_ar="ما هو أطول نهر في العالم؟",
            question_en="What is the longest river in the world?",
            correct_answer_ar="النيل",
            correct_answer_en="Nile",
            options_ar=None,
            options_en=None,
            category="geography",
            difficulty="medium",
            question_type="autocomplete",
            points=15,
        ),
        Question(
            id=uuid4(),
            question_ar="ما هي أكبر قارة في العالم؟",
            question_en="What is the largest continent in the world?",
            correct_answer_ar="آسيا",
            correct_answer_en="Asia",
            options_ar=["آسيا", "أفريقيا", "أمريكا الشمالية", "أوروبا"],
            options_en=["Asia", "Africa", "North America", "Europe"],
            category="geography",
            difficulty="easy",
            question_type="multiple_choice",
            points=10,
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
        date=date.today(),
        start_country_id=sample_countries[0].id,  # Egypt
        end_country_id=sample_countries[2].id,    # Ethiopia
        optimal_path_length=3,  # Egypt -> Sudan -> Ethiopia
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)
    return challenge


@pytest.fixture
def auth_headers(sample_user: User) -> dict[str, str]:
    """
    Generate authentication headers for testing protected endpoints.
    """
    from app.core.security import create_access_token
    
    access_token = create_access_token(subject=str(sample_user.id))
    return {"Authorization": f"Bearer {access_token}"}


# Utility functions for tests

def assert_country_equal(country1: Country, country2: Country):
    """Assert two countries are equal."""
    assert country1.id == country2.id
    assert country1.name_ar == country2.name_ar
    assert country1.name_en == country2.name_en
    assert country1.iso_alpha_2 == country2.iso_alpha_2


def assert_question_equal(question1: Question, question2: Question):
    """Assert two questions are equal."""
    assert question1.id == question2.id
    assert question1.question_ar == question2.question_ar
    assert question1.correct_answer_ar == question2.correct_answer_ar
    assert question1.category == question2.category
    assert question1.difficulty == question2.difficulty

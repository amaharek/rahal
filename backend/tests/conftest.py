"""Fresh conftest matching actual models."""
from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.core.config import settings
from app.core.database import get_db
from app.models.base import Base
from app.routers import game as game_router

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres_test"


@pytest.fixture
async def engine():
    """Create isolated test database engine per test."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(engine):
    """Create fresh database session for each test."""
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session):
    """Create test client with database override."""
    async def override_get_db():
        yield db_session
        await db_session.commit()

    # Reset cached in-memory graph state so each test sees fresh DB data.
    game_router.path_finder_service._graph = None
    game_router.path_finder_service._countries = None
    game_router.score_calculator.path_finder._graph = None
    game_router.score_calculator.path_finder._countries = None

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    """Create valid JWT token for tests."""
    user_id = "00000000-0000-0000-0000-000000000999"
    token = jwt.encode(
        {
            "sub": user_id,
            "aud": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1)
        },
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )
    return {"Authorization": f"Bearer {token}"}

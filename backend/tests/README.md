# Backend Test Suite Documentation

## Table of Contents
1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Quick Start](#quick-start)
4. [Test Categories](#test-categories)
5. [Test Case Index](#test-case-index)
6. [Writing Tests](#writing-tests)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This directory contains the complete test suite for the Rahal backend application. The tests are organized into multiple categories covering unit tests, integration tests, and data validation.

**Test Statistics:**
- **Total Test Files**: 8
- **Total Test Cases**: 270+
- **Coverage Target**: 60% → 70% → 80%
- **Test Framework**: pytest 9.0.2 with pytest-asyncio

---

## Test Structure

```
tests/
├── conftest.py                      # Shared fixtures and configuration
├── test_data_validation.py          # Data integrity tests (27 tests)
├── test_security.py                 # Security requirement tests (22 tests)
├── test_rate_limiting.py            # Rate limiting tests (13 tests)
├── test_services/
│   ├── test_path_finder.py          # PathFinder service tests (33 tests)
│   ├── test_score_calculator.py     # ScoreCalculator tests (55 tests)
│   └── test_quiz_engine.py          # QuizEngine tests (50 tests)
└── test_routers/
    ├── test_game.py                 # Game API tests (40 tests)
    └── test_quiz.py                 # Quiz API tests (55 tests)
```

---

## Quick Start

### Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies using uv
uv pip install -e ".[dev]"

# Ensure PostgreSQL is running
docker-compose up -d postgres

# Set test database URL (if different from default)
export TEST_DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"
```

### Run Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=app --cov-report=html --cov-report=term

# Run in parallel (faster)
uv run pytest -n auto

# Run specific test file
uv run pytest tests/test_services/test_quiz_engine.py

# Run specific test class
uv run pytest tests/test_routers/test_game.py::TestGetDailyChallenge

# Run specific test
uv run pytest tests/test_routers/test_game.py::TestGetDailyChallenge::test_get_todays_challenge_success

# Run with verbose output
uv run pytest -v

# Run with extra verbose output (shows all print statements)
uv run pytest -vv -s

# Stop on first failure
uv run pytest -x

# Run only failed tests from last run
uv run pytest --lf

# Show test durations (slowest 10)
uv run pytest --durations=10
```

---

## Test Categories

### 1. Data Validation Tests (`test_data_validation.py`)

**Purpose**: Ensure data integrity before and after database seeding

**Test Classes**:
- `TestBorderGraphCompleteness` - Border relationship validation
- `TestCountryDataCompleteness` - Country data validation
- `TestQuestionDataDistribution` - Question quality checks
- `TestDatabaseSeedingIdempotency` - Seeding consistency

**Run**: `uv run pytest tests/test_data_validation.py -v`

**Expected**: Some failures until database is properly seeded (300+ borders, 195 countries, 100+ questions)

---

### 2. Security Tests (`test_security.py`, `test_rate_limiting.py`)

**Purpose**: Define security requirements and validate implementation

**Test Classes**:
- `TestAuthentication` - JWT validation
- `TestAuthorization` - Permission checks
- `TestInputValidation` - SQL injection, XSS, path traversal
- `TestRateLimiting` - 100 req/min per IP enforcement

**Run**: 
```bash
uv run pytest tests/test_security.py -v
uv run pytest tests/test_rate_limiting.py -v
```

**Expected**: Rate limiting tests will fail until middleware is implemented

---

### 3. Service Unit Tests (`test_services/`)

**Purpose**: Test core business logic in isolation

#### PathFinder Service (`test_path_finder.py`)

**Tests**: 33 test cases across 7 classes
- Graph building from border data
- BFS shortest path algorithm
- Multiple path finding
- Path validation (borders exist)
- Distance calculation
- Hint generation (3 types)
- Performance benchmarks

**Run**: `uv run pytest tests/test_services/test_path_finder.py -v`

**Key Methods Tested**:
- `build_graph()`
- `find_shortest_path(start, end)`
- `find_all_paths(start, end, max_length)`
- `is_valid_path(path)`
- `get_distance(country1, country2)`
- `generate_hint(challenge, hint_type)`

---

#### ScoreCalculator Service (`test_score_calculator.py`)

**Tests**: 55+ test cases across 5 classes
- Emoji assignment (🟢🟡🟠🔴⚫)
- Final score calculation
- Share text generation (Arabic)
- Optimal path detection
- Edge cases

**Run**: `uv run pytest tests/test_services/test_score_calculator.py -v`

**Key Methods Tested**:
- `calculate_guess_score(challenge, guessed_country_id)`
- `calculate_final_score(guesses, hints, shortest_path)`
- `generate_share_text(result, language)`

**Scoring Formula**:
```python
base_score = 1000
penalty_per_extra_guess = 50
penalty_per_hint = 100
optimal_bonus = 200
final_score = max(0, base_score - penalties + bonuses)
```

---

#### QuizEngine Service (`test_quiz_engine.py`)

**Tests**: 50+ test cases across 7 classes
- Arabic text normalization
- Fuzzy matching (85% threshold)
- Answer checking (MC vs autocomplete)
- Scoring system
- Session generation
- Daily quiz balancing (33/33/33%)
- Edge cases

**Run**: `uv run pytest tests/test_services/test_quiz_engine.py -v`

**Key Methods Tested**:
- `check_answer(question, user_answer, hints_used)`
- `generate_session(db, num_questions, filters)`
- `generate_daily_quiz(db, num_questions)`

**Scoring Rules**:
- Multiple Choice: 10 points base
- Autocomplete: 15 points base
- Hint Penalty: -3 points per hint
- Minimum Score: 0 (never negative)

---

### 4. API Integration Tests (`test_routers/`)

**Purpose**: Test API endpoints with full request/response cycle

#### Game API Tests (`test_game.py`)

**Tests**: 40+ test cases across 4 classes + game flows

**Endpoints Tested**:
- `GET /api/game/daily` - Get daily challenge
- `POST /api/game/guess` - Submit guess
- `POST /api/game/hint` - Use hint (3 max)
- `GET /api/game/stats` - User statistics (auth required)

**Run**: `uv run pytest tests/test_routers/test_game.py -v`

**Test Classes**:
- `TestGetDailyChallenge` - Challenge retrieval
- `TestSubmitGuess` - Guessing mechanics
- `TestUseHint` - Hint system
- `TestGetGameStats` - Statistics
- `TestGameFlow` - Complete game scenarios

---

#### Quiz API Tests (`test_quiz.py`)

**Tests**: 55+ test cases across 6 classes + quiz flows

**Endpoints Tested**:
- `GET /api/quiz/question` - Random question with filters
- `POST /api/quiz/answer` - Submit answer
- `POST /api/quiz/session` - Start quiz session
- `GET /api/quiz/daily` - Balanced daily quiz
- `GET /api/quiz/stats` - User quiz stats (auth required)
- `GET /api/quiz/categories` - Available categories

**Run**: `uv run pytest tests/test_routers/test_quiz.py -v`

**Test Classes**:
- `TestGetRandomQuestion` - Question retrieval with filters
- `TestSubmitAnswer` - Answer validation and scoring
- `TestQuizSession` - Session management
- `TestDailyQuiz` - Balanced difficulty distribution
- `TestQuizStats` - Statistics tracking
- `TestGetCategories` - Category listing
- `TestQuizFlow` - Complete quiz scenarios

---

## Test Case Index

### By Priority

#### P0 (Critical - Must Pass for Production)
- All `test_data_validation.py` tests
- `test_path_finder.py::TestShortestPath`
- `test_score_calculator.py::TestFinalScoreCalculation`
- `test_game.py::TestGetDailyChallenge::test_get_todays_challenge_success`
- `test_quiz.py::TestSubmitAnswer::test_submit_correct_answer`

#### P1 (High Priority - Core Features)
- All service unit tests
- Game API integration tests
- Quiz API integration tests
- Security authentication tests

#### P2 (Medium Priority - Enhanced Features)
- Rate limiting tests
- Hint generation tests
- Quiz session tests
- Statistics tests

#### P3 (Low Priority - Edge Cases)
- Edge case tests in all categories
- Performance benchmark tests

---

### By Component

#### Country/Border System
- `test_data_validation.py::TestBorderGraphCompleteness`
- `test_path_finder.py::TestGraphBuilding`
- `test_path_finder.py::TestPathValidation`

#### Game Logic
- `test_path_finder.py::TestShortestPath`
- `test_score_calculator.py` (all)
- `test_game.py::TestSubmitGuess`
- `test_game.py::TestGameFlow`

#### Quiz System
- `test_quiz_engine.py` (all)
- `test_quiz.py::TestSubmitAnswer`
- `test_quiz.py::TestQuizSession`
- `test_quiz.py::TestDailyQuiz`

#### Arabic Language Support
- `test_quiz_engine.py::TestArabicNormalization`
- `test_quiz_engine.py::TestFuzzyMatching`
- `test_score_calculator.py::TestShareTextGeneration`

#### Security
- `test_security.py` (all)
- `test_rate_limiting.py` (all)

---

## Writing Tests

### Test Structure (AAA Pattern)

```python
import pytest
from uuid import uuid4

class TestNewFeature:
    """Test suite for new feature."""
    
    @pytest.mark.asyncio
    async def test_specific_behavior(self, db_session, sample_user):
        """Test that specific behavior works as expected."""
        # Arrange - Set up test data
        data = {
            "key": "value",
            "user_id": sample_user.id
        }
        
        # Act - Execute the code under test
        result = await some_function(db_session, data)
        
        # Assert - Verify the outcome
        assert result.status == "success"
        assert result.value == expected_value
```

### Using Fixtures

Available fixtures from `conftest.py`:

```python
# Database
@pytest.fixture
async def db_session() -> AsyncSession:
    """Fresh database session with rollback."""
    
# Sample Data
@pytest.fixture
async def sample_countries(db_session) -> list[Country]:
    """Sample countries with border relationships."""
    
@pytest.fixture
async def sample_questions(db_session) -> list[Question]:
    """Sample quiz questions."""
    
@pytest.fixture
async def sample_user(db_session) -> User:
    """Sample user with hashed password."""
    
@pytest.fixture
async def sample_challenge(db_session, sample_countries) -> DailyChallenge:
    """Sample daily challenge."""
    
# Authentication
@pytest.fixture
def auth_headers(sample_user) -> dict:
    """JWT authentication headers."""
    
# HTTP Client
@pytest.fixture
async def async_client(db_session) -> AsyncClient:
    """Async HTTP client with DB override."""
```

### Async Test Pattern

```python
@pytest.mark.asyncio
async def test_async_operation(db_session):
    """Test async database operation."""
    # Create object
    obj = MyModel(name="test")
    db_session.add(obj)
    await db_session.commit()
    await db_session.refresh(obj)
    
    # Query object
    result = await db_session.get(MyModel, obj.id)
    assert result is not None
```

### API Test Pattern

```python
@pytest.mark.asyncio
async def test_api_endpoint(async_client, auth_headers):
    """Test API endpoint behavior."""
    response = await async_client.post(
        "/api/endpoint",
        headers=auth_headers,
        json={"key": "value"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "expected_value"
```

### Mocking External Dependencies

```python
@pytest.mark.asyncio
async def test_with_mock(async_client, mocker):
    """Test with mocked external service."""
    # Mock external API call
    mock_external = mocker.patch('app.services.external.call_api')
    mock_external.return_value = {"status": "success"}
    
    response = await async_client.get("/api/endpoint")
    
    assert response.status_code == 200
    mock_external.assert_called_once()
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution**:
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check connection
docker-compose ps

# Verify TEST_DATABASE_URL
echo $TEST_DATABASE_URL
```

---

#### 2. Fixture Not Found
```
fixture 'sample_questions' not found
```

**Solution**:
- Ensure `conftest.py` is in the `tests/` directory
- Check fixture is defined in `conftest.py`
- Verify pytest can discover the file:
  ```bash
  uv run pytest --fixtures | grep sample_questions
  ```

---

#### 3. Async Test Not Running
```
RuntimeError: no running event loop
```

**Solution**:
- Add `@pytest.mark.asyncio` decorator
- Ensure `pytest-asyncio` is installed:
  ```bash
  uv pip install pytest-asyncio
  ```

---

#### 4. Import Errors
```
ModuleNotFoundError: No module named 'app'
```

**Solution**:
```bash
# Install in editable mode
cd backend
uv pip install -e .

# Or set PYTHONPATH
export PYTHONPATH=/path/to/backend:$PYTHONPATH
```

---

#### 5. Tests Timing Out
```
asyncio.TimeoutError
```

**Solution**:
- Increase timeout in `pytest.ini`:
  ```ini
  [pytest]
  asyncio_mode = auto
  timeout = 60
  ```
- Check for infinite loops or deadlocks
- Use `uv run pytest -vv -s` to see where it hangs

---

#### 6. Sample Data Conflicts
```
IntegrityError: duplicate key value violates unique constraint
```

**Solution**:
- Ensure fixtures use `uuid4()` for unique IDs
- Check database is rolled back after each test
- Verify `db_session` fixture scope is `function`

---

### Debug Mode

Run tests with maximum verbosity and debugging:

```bash
# Show all output including print statements
uv run pytest -vv -s

# Show local variables on failure
uv run pytest -vv -l

# Enter debugger on failure
uv run pytest --pdb

# Start debugger at beginning of test
uv run pytest --trace
```

---

### Performance Profiling

```bash
# Show 10 slowest tests
uv run pytest --durations=10

# Profile with py-spy (if installed)
py-spy record -o profile.svg -- pytest

# Memory profiling
uv run pytest --memray
```

---

## Best Practices

### ✅ Do's
- Use descriptive test names: `test_returns_404_when_challenge_not_found`
- Follow AAA pattern: Arrange, Act, Assert
- Test one thing per test
- Use fixtures for reusable setup
- Mock external dependencies
- Test edge cases and error conditions
- Write async tests for async code
- Use parametrize for similar test cases
- Keep tests independent and isolated

### ❌ Don'ts
- Don't test implementation details
- Don't use real external APIs
- Don't share state between tests
- Don't skip tests without good reason
- Don't write tests that depend on execution order
- Don't ignore deprecation warnings
- Don't commit commented-out tests

---

## Coverage Reports

### Generate HTML Coverage Report

```bash
uv run pytest --cov=app --cov-report=html
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

### Coverage Targets

| Phase | Target | Current Status |
|-------|--------|---------------|
| Phase 1 | 60% | ✅ Achieved |
| Phase 2 | 70% | 🔄 In Progress |
| Phase 3 | 80% | 📋 Planned |

### View Coverage in Terminal

```bash
uv run pytest --cov=app --cov-report=term-missing
```

Shows which lines are not covered.

---

## CI/CD Integration

Tests run automatically via GitHub Actions on:
- Push to `main`, `develop` branches
- Pull requests to `main`, `develop`

See [.github/workflows/test.yml](../../.github/workflows/test.yml) for configuration.

---

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing Guide](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

---

**Last Updated**: February 5, 2026  
**Maintained By**: QA Team  
**Questions?**: Open an issue or contact the development team

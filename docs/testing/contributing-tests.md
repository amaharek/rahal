# Contributing to Rahal Tests

This guide helps developers write and maintain tests for the Rahal project.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Test Types](#test-types)
3. [Writing Guidelines](#writing-guidelines)
4. [Common Patterns](#common-patterns)
5. [Fixtures and Helpers](#fixtures-and-helpers)
6. [Best Practices](#best-practices)
7. [Code Review](#code-review)

---

## Getting Started

### Prerequisites

Before writing tests, ensure you have:
- Development environment set up
- Backend and frontend dependencies installed
- Test frameworks configured
- Database running (for integration tests)

### Quick Start

```bash
# 1. Create feature branch
git checkout -b feature/new-component

# 2. Write tests first (TDD)
# Backend: backend/tests/test_new_feature.py
# Frontend: frontend/components/NewComponent.test.tsx

# 3. Run tests (they should fail)
pytest tests/test_new_feature.py
npm run test NewComponent.test.tsx

# 4. Implement feature

# 5. Run tests again (they should pass)

# 6. Commit with descriptive message
git commit -m "feat: Add NewComponent with tests"
```

---

## Test Types

### 1. Unit Tests

**Purpose**: Test isolated units of code (functions, classes, components)

**When to Use**:
- Testing individual functions
- Testing component rendering
- Testing utility functions
- Testing business logic

**Example - Backend**:
```python
import pytest
from app.utils.arabic import normalize_arabic_text

def test_normalize_arabic_text_removes_diacritics():
    # Arrange
    text_with_diacritics = "مَرْحَباً"
    expected = "مرحبا"
    
    # Act
    result = normalize_arabic_text(text_with_diacritics)
    
    # Assert
    assert result == expected
```

**Example - Frontend**:
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

it('renders button with text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click Me');
});
```

---

### 2. Integration Tests

**Purpose**: Test interaction between components/modules

**When to Use**:
- Testing API endpoints
- Testing database operations
- Testing service interactions
- Testing component integration

**Example - Backend API**:
```python
@pytest.mark.asyncio
async def test_create_game_session(async_client, sample_user):
    # Arrange
    payload = {
        "start_country": "EG",
        "end_country": "SA",
        "difficulty": "medium"
    }
    
    # Act
    response = await async_client.post(
        "/api/v1/game/start",
        json=payload,
        headers={"Authorization": f"Bearer {sample_user['token']}"}
    )
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["start_country"] == "EG"
    assert data["end_country"] == "SA"
    assert "session_id" in data
```

---

### 3. E2E Tests

**Purpose**: Test complete user workflows

**When to Use**:
- Testing user journeys
- Testing multi-page flows
- Testing authentication flows
- Testing critical business processes

**Example - Playwright**:
```typescript
test('user completes quiz from start to finish', async ({ page }) => {
  // Navigate to quiz page
  await page.goto('/ar/quiz');
  
  // Start quiz
  await page.click('[data-testid="start-quiz"]');
  
  // Answer 10 questions
  for (let i = 0; i < 10; i++) {
    await page.click('[data-testid="answer-option-1"]');
    await page.click('[data-testid="next-question"]');
  }
  
  // Verify results page
  await expect(page.locator('[data-testid="quiz-complete"]')).toBeVisible();
  await expect(page.locator('[data-testid="final-score"]')).toContainText(/\d+/);
});
```

---

## Writing Guidelines

### Naming Conventions

#### Test Files
- Backend: `test_<module_name>.py`
- Frontend Unit: `<ComponentName>.test.tsx`
- Frontend E2E: `<feature-name>.spec.ts`

#### Test Functions/Cases
- Backend: `test_<what_it_does_when_condition>`
  ```python
  def test_calculate_score_returns_100_when_all_answers_correct():
      pass
  ```

- Frontend: `it('<describes behavior in plain English>')`
  ```typescript
  it('displays error message when API call fails', () => {});
  ```

- E2E: `test('should <expected outcome from user perspective>')`
  ```typescript
  test('should allow user to filter leaderboard by country', async ({ page }) => {});
  ```

---

### Test Structure (AAA Pattern)

Always use the **Arrange-Act-Assert** pattern:

```python
def test_path_finder_finds_shortest_path():
    # Arrange - Set up test data and conditions
    path_finder = PathFinderService()
    start = "EG"
    end = "SA"
    
    # Act - Execute the functionality being tested
    result = path_finder.find_path(start, end)
    
    # Assert - Verify the outcome
    assert result is not None
    assert result["path"] == ["EG", "SA"]
    assert result["distance"] == 1
```

---

### Test Isolation

Each test should be **independent** and **isolated**:

```python
# ❌ Bad - Tests depend on each other
game_session = None

def test_create_game():
    global game_session
    game_session = create_game()
    assert game_session is not None

def test_play_game():
    # Depends on previous test
    play_game(game_session)

# ✅ Good - Tests are independent
@pytest.fixture
def game_session():
    return create_game()

def test_create_game(game_session):
    assert game_session is not None

def test_play_game(game_session):
    play_game(game_session)
```

---

### Async Testing

#### Backend (pytest-asyncio)

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    # Use async/await
    result = await async_function()
    assert result == expected
```

#### Frontend (Vitest + React Testing Library)

```typescript
import { waitFor } from '@testing-library/react';

it('loads data asynchronously', async () => {
  render(<AsyncComponent />);
  
  // Wait for async operation
  await waitFor(() => {
    expect(screen.getByText('Data Loaded')).toBeInTheDocument();
  });
});
```

---

## Common Patterns

### Pattern 1: Testing Error Cases

```python
import pytest

def test_raises_error_when_invalid_input():
    with pytest.raises(ValueError, match="Invalid country code"):
        path_finder.find_path("INVALID", "SA")
```

```typescript
it('displays error message on API failure', async () => {
  // Mock API to fail
  global.fetch = vi.fn(() => Promise.reject(new Error('API Error')));
  
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });
});
```

---

### Pattern 2: Testing Loading States

```typescript
it('shows loading spinner while fetching data', async () => {
  // Mock delayed response
  global.fetch = vi.fn(() => 
    new Promise(resolve => setTimeout(() => resolve({ json: () => ({}) }), 100))
  );
  
  render(<DataComponent />);
  
  // Check loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Wait for loaded state
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
```

---

### Pattern 3: Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('updates input value when user types', async () => {
  const user = userEvent.setup();
  render(<InputComponent />);
  
  const input = screen.getByRole('textbox');
  await user.type(input, 'Test value');
  
  expect(input).toHaveValue('Test value');
});
```

---

### Pattern 4: Testing Form Submission

```typescript
it('submits form with correct data', async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();
  
  render(<Form onSubmit={handleSubmit} />);
  
  // Fill form
  await user.type(screen.getByLabelText('Name'), 'John');
  await user.type(screen.getByLabelText('Email'), 'john@example.com');
  
  // Submit
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  // Verify
  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'John',
    email: 'john@example.com'
  });
});
```

---

### Pattern 5: Testing API Calls

```python
@pytest.mark.asyncio
async def test_api_endpoint_returns_correct_data(async_client):
    # Arrange
    expected_data = {"country": "Egypt", "code": "EG"}
    
    # Act
    response = await async_client.get("/api/v1/countries/EG")
    
    # Assert
    assert response.status_code == 200
    assert response.json() == expected_data
```

---

### Pattern 6: Testing with Mocks

```python
from unittest.mock import Mock, patch

def test_external_api_call():
    # Mock external API
    with patch('app.services.external_api.call') as mock_call:
        mock_call.return_value = {"data": "test"}
        
        # Test function that uses external API
        result = function_using_external_api()
        
        assert result == {"data": "test"}
        mock_call.assert_called_once()
```

```typescript
import { vi } from 'vitest';

it('calls API with correct parameters', async () => {
  const mockFetch = vi.fn(() => 
    Promise.resolve({ json: () => Promise.resolve({ success: true }) })
  );
  global.fetch = mockFetch;
  
  render(<Component userId="123" />);
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/users/123');
  });
});
```

---

## Fixtures and Helpers

### Backend Fixtures (pytest)

**Location**: `backend/tests/conftest.py`

#### Using Existing Fixtures

```python
def test_with_database(db_session):
    # db_session fixture provides database connection
    user = User(email="test@example.com")
    db_session.add(user)
    await db_session.commit()

def test_with_sample_data(sample_countries):
    # sample_countries fixture provides test data
    assert len(sample_countries) > 0
    assert sample_countries[0]["code"] == "EG"

def test_with_auth(auth_headers):
    # auth_headers fixture provides authentication headers
    response = await client.get("/api/protected", headers=auth_headers)
    assert response.status_code == 200
```

#### Creating New Fixtures

```python
import pytest

@pytest.fixture
async def sample_quiz():
    """Fixture providing a sample quiz session"""
    quiz = QuizSession(
        user_id=1,
        difficulty="medium",
        questions_count=10
    )
    return quiz

@pytest.fixture
def mock_path_finder():
    """Fixture providing mocked PathFinder"""
    mock = Mock(spec=PathFinderService)
    mock.find_path.return_value = {"path": ["EG", "SA"], "distance": 1}
    return mock
```

---

### Frontend Test Helpers

**Location**: `frontend/vitest.setup.ts`

#### Using Test Utilities

```typescript
// Wrapper for components requiring providers
function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(
    <IntlProvider locale="ar" messages={messages}>
      {ui}
    </IntlProvider>,
    options
  );
}

// Use in tests
it('renders with i18n support', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('مرحبا')).toBeInTheDocument();
});
```

---

## Best Practices

### ✅ Do's

1. **Write Tests First (TDD)**
   ```typescript
   // 1. Write failing test
   it('displays user name', () => {
     render(<UserProfile userId="123" />);
     expect(screen.getByText('John Doe')).toBeInTheDocument();
   });
   
   // 2. Implement component
   // 3. Test passes
   ```

2. **Test User Behavior, Not Implementation**
   ```typescript
   // ❌ Bad - Testing implementation
   it('calls setState with new value', () => {
     const { result } = renderHook(() => useState(0));
     // Testing internal state management
   });
   
   // ✅ Good - Testing user-visible behavior
   it('displays updated count when button clicked', async () => {
     render(<Counter />);
     await userEvent.click(screen.getByRole('button'));
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

3. **Use Descriptive Test Names**
   ```python
   # ❌ Bad
   def test_score():
       pass
   
   # ✅ Good
   def test_calculate_score_returns_zero_when_all_answers_incorrect():
       pass
   ```

4. **Keep Tests Simple and Focused**
   ```python
   # ❌ Bad - Testing multiple things
   def test_game_session():
       session = create_game()
       assert session is not None
       play_game(session)
       assert session.is_complete
       score = calculate_score(session)
       assert score > 0
   
   # ✅ Good - One test per behavior
   def test_create_game_returns_valid_session():
       session = create_game()
       assert session is not None
   
   def test_game_marked_complete_after_all_questions_answered():
       session = create_game()
       play_game(session)
       assert session.is_complete
   ```

5. **Use Fixtures for Shared Setup**
   ```python
   @pytest.fixture
   def game_session():
       return GameSession(difficulty="medium")
   
   def test_a(game_session):
       # Use shared setup
       pass
   
   def test_b(game_session):
       # Use shared setup
       pass
   ```

---

### ❌ Don'ts

1. **Don't Test Third-Party Libraries**
   ```typescript
   // ❌ Bad - Testing React itself
   it('useState works correctly', () => {
     // Don't test React's functionality
   });
   
   // ✅ Good - Test your usage
   it('updates displayed count when button clicked', () => {
     // Test your component's behavior
   });
   ```

2. **Don't Use Brittle Selectors**
   ```typescript
   // ❌ Bad - Fragile CSS selector
   await page.click('.btn.btn-primary.submit-button');
   
   // ✅ Good - Semantic selector
   await page.click('[data-testid="submit-button"]');
   // or
   await page.getByRole('button', { name: 'Submit' }).click();
   ```

3. **Don't Write Dependent Tests**
   ```python
   # ❌ Bad - Test B depends on Test A
   game = None
   
   def test_a_create_game():
       global game
       game = create_game()
   
   def test_b_play_game():
       play_game(game)  # Fails if test_a doesn't run first
   
   # ✅ Good - Independent tests
   @pytest.fixture
   def game():
       return create_game()
   
   def test_create_game(game):
       assert game is not None
   
   def test_play_game(game):
       play_game(game)
   ```

4. **Don't Ignore Flaky Tests**
   ```python
   # ❌ Bad - Ignoring flakiness
   @pytest.mark.skip(reason="Test is flaky")
   def test_sometimes_fails():
       pass
   
   # ✅ Good - Fix the flakiness
   def test_with_proper_waits():
       # Add proper waits, fix race conditions
       await waitFor(() => ...)
   ```

5. **Don't Mock Everything**
   ```python
   # ❌ Bad - Over-mocking
   def test_function_with_everything_mocked():
       mock_a = Mock()
       mock_b = Mock()
       mock_c = Mock()
       # Testing nothing real
   
   # ✅ Good - Mock only external dependencies
   def test_function_with_minimal_mocking():
       with patch('external_api.call') as mock_api:
           # Test real code with mocked external dependency
           result = my_function()
   ```

---

## Code Review

### Checklist for Test Authors

Before submitting PR:

- [ ] All tests pass locally
- [ ] Tests follow AAA pattern
- [ ] Test names are descriptive
- [ ] Tests are isolated and independent
- [ ] Async operations use proper await
- [ ] No hardcoded delays (use waitFor)
- [ ] Fixtures used appropriately
- [ ] Edge cases covered
- [ ] Documentation updated
- [ ] No .only() or .skip() left in code

---

### Checklist for Reviewers

When reviewing test PRs:

- [ ] Tests are meaningful (not testing implementation)
- [ ] Coverage increased or maintained
- [ ] No flaky tests
- [ ] Performance acceptable
- [ ] Follows project conventions
- [ ] Documentation clear
- [ ] Tests can be easily understood
- [ ] Edge cases considered

---

## Examples

### Complete Example: Backend Service Test

```python
import pytest
from app.services.score_calculator import ScoreCalculator

class TestScoreCalculator:
    """Test suite for ScoreCalculator service"""
    
    @pytest.fixture
    def calculator(self):
        """Fixture providing ScoreCalculator instance"""
        return ScoreCalculator()
    
    def test_calculate_score_perfect(self, calculator):
        """Test perfect score calculation (all correct, no hints)"""
        # Arrange
        correct_answers = 10
        total_questions = 10
        hints_used = 0
        
        # Act
        result = calculator.calculate(
            correct_answers=correct_answers,
            total_questions=total_questions,
            hints_used=hints_used
        )
        
        # Assert
        assert result["score"] == 100
        assert result["emoji"] == "🔥"
        assert result["message"] == "Perfect score!"
    
    def test_calculate_score_with_hints(self, calculator):
        """Test score calculation with hint penalty"""
        # Arrange
        correct_answers = 10
        total_questions = 10
        hints_used = 2  # -3 points each = -6 total
        
        # Act
        result = calculator.calculate(
            correct_answers=correct_answers,
            total_questions=total_questions,
            hints_used=hints_used
        )
        
        # Assert
        assert result["score"] == 94  # 100 - 6
        assert result["emoji"] == "🔥"
    
    def test_calculate_score_zero(self, calculator):
        """Test zero score calculation"""
        # Arrange
        correct_answers = 0
        total_questions = 10
        hints_used = 0
        
        # Act
        result = calculator.calculate(
            correct_answers=correct_answers,
            total_questions=total_questions,
            hints_used=hints_used
        )
        
        # Assert
        assert result["score"] == 0
        assert result["emoji"] == "😢"
        assert result["message"] == "Better luck next time!"
```

---

### Complete Example: Frontend Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizQuestion } from './QuizQuestion';

describe('QuizQuestion', () => {
  it('renders question text in Arabic', () => {
    // Arrange
    const question = {
      text: 'ما هي عاصمة مصر؟',
      options: ['القاهرة', 'الإسكندرية', 'الجيزة', 'أسوان']
    };
    
    // Act
    render(<QuizQuestion question={question} />);
    
    // Assert
    expect(screen.getByText('ما هي عاصمة مصر؟')).toBeInTheDocument();
  });
  
  it('highlights selected answer', async () => {
    // Arrange
    const user = userEvent.setup();
    const question = {
      text: 'Test question',
      options: ['Option A', 'Option B', 'Option C', 'Option D']
    };
    
    render(<QuizQuestion question={question} />);
    
    // Act
    const optionB = screen.getByText('Option B');
    await user.click(optionB);
    
    // Assert
    expect(optionB).toHaveClass('selected');
  });
  
  it('calls onAnswer when answer submitted', async () => {
    // Arrange
    const handleAnswer = vi.fn();
    const user = userEvent.setup();
    const question = {
      text: 'Test question',
      options: ['Option A', 'Option B']
    };
    
    render(<QuizQuestion question={question} onAnswer={handleAnswer} />);
    
    // Act
    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    // Assert
    expect(handleAnswer).toHaveBeenCalledWith('Option A');
  });
  
  it('disables options after submission', async () => {
    // Arrange
    const user = userEvent.setup();
    const question = {
      text: 'Test question',
      options: ['Option A', 'Option B']
    };
    
    render(<QuizQuestion question={question} />);
    
    // Act
    await user.click(screen.getByText('Option A'));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    // Assert
    const buttons = screen.getAllByRole('button', { name: /Option/ });
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
```

---

### Complete Example: E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Quiz Flow - Complete Session', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to quiz page
    await page.goto('/ar/quiz');
    await page.waitForLoadState('networkidle');
  });
  
  test('should complete full 10-question quiz session', async ({ page }) => {
    // Start quiz
    await page.click('[data-testid="start-quiz"]');
    
    // Wait for first question
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();
    
    // Answer all 10 questions
    for (let i = 1; i <= 10; i++) {
      // Wait for question to load
      await expect(page.locator('[data-testid="question-number"]'))
        .toContainText(`${i}/10`);
      
      // Select first option
      await page.click('[data-testid="answer-option-0"]');
      
      // Submit answer
      await page.click('[data-testid="submit-answer"]');
      
      // Wait for feedback
      await expect(page.locator('[data-testid="answer-feedback"]'))
        .toBeVisible({ timeout: 2000 });
      
      // Continue to next question (or finish)
      if (i < 10) {
        await page.click('[data-testid="next-question"]');
      } else {
        await page.click('[data-testid="finish-quiz"]');
      }
    }
    
    // Verify results page
    await expect(page.locator('[data-testid="quiz-results"]'))
      .toBeVisible({ timeout: 5000 });
    
    // Check score is displayed
    await expect(page.locator('[data-testid="final-score"]'))
      .toContainText(/\d+/);
    
    // Check all questions are listed in review
    const reviewQuestions = page.locator('[data-testid="review-question"]');
    await expect(reviewQuestions).toHaveCount(10);
  });
  
  test('should handle quiz timeout correctly', async ({ page }) => {
    // Set short timeout for testing
    await page.click('[data-testid="settings"]');
    await page.selectOption('[data-testid="timeout-select"]', '5'); // 5 seconds
    await page.click('[data-testid="start-quiz"]');
    
    // Wait for timeout
    await page.waitForTimeout(6000);
    
    // Verify timeout message
    await expect(page.locator('[data-testid="timeout-message"]'))
      .toContainText('Time is up!');
    
    // Verify results page shown
    await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible();
  });
});
```

---

## Resources

- [Backend Test Documentation](../../backend/tests/README.md)
- [Frontend Test Documentation](../../frontend/tests/README.md)
- [Testing Overview](./testing-overview.md)
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

**Questions?** Open an issue or contact the QA team.

**Last Updated**: February 5, 2026

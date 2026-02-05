# Rahal Testing Documentation - Overview

## 🌍 Locale-Agnostic Testing

All frontend tests use **locale-agnostic approaches** to prevent breaking when translations change. Tests use `data-testid`, semantic queries, and translation keys instead of hardcoded text.

**📖 Full Guide**: [Locale-Agnostic Testing](./LOCALE_AGNOSTIC_TESTING.md)

---

## Table of Contents
1. [Introduction](#introduction)
2. [Testing Philosophy](#testing-philosophy)
3. [Test Suite Architecture](#test-suite-architecture)
4. [Quick Start Guide](#quick-start-guide)
5. [Component Documentation](#component-documentation)
6. [CI/CD Integration](#cicd-integration)
7. [Contributing](#contributing)

---

## Introduction

This document provides a comprehensive overview of the testing strategy and implementation for the Rahal project. Rahal is a geography game and quiz platform inspired by Travle.earth, focusing on Arabic language support and cultural adaptation.

**Testing Statistics:**
- **Total Test Files**: 19
- **Total Test Cases**: 450+
- **Lines of Test Code**: ~11,000
- **Coverage Target**: Progressive (60% → 70% → 80%)
- **Testing Frameworks**: 
  - Backend: pytest 9.0.2
  - Frontend: Vitest 4.0.18, Playwright 1.58.1

---

## Testing Philosophy

### Core Principles

1. **Test-Driven Development (TDD)**
   - Write tests before implementation
   - Define component contracts upfront
   - Ensure specifications are met

2. **User-Centric Testing**
   - Test from user's perspective
   - Focus on user journeys
   - Verify actual user workflows

3. **Comprehensive Coverage**
   - Unit tests for isolated components
   - Integration tests for API contracts
   - E2E tests for complete workflows
   - Security and performance tests

4. **Quality Over Quantity**
   - Meaningful test cases
   - Avoid redundant tests
   - Focus on critical paths

5. **Maintainability**
   - Clear test names
   - DRY principles with fixtures
   - Comprehensive documentation

---

## Test Suite Architecture

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \           101+ scenarios
                 /--------\
                /          \
               / Integration \      95 tests
              /--------------\
             /                \
            /   Unit Tests     \   270+ tests
           /--------------------\
```

### Backend Testing Stack

**Framework**: pytest 9.0.2 with async support

**Key Libraries**:
- `pytest-asyncio`: Async test support
- `pytest-cov`: Coverage reporting
- `pytest-xdist`: Parallel execution
- `httpx`: Async HTTP client for testing
- `faker`: Test data generation

**Test Categories**:
1. **Data Validation** (27 tests)
   - Countries data integrity
   - Borders data validation
   - Questions validation

2. **Security** (22 tests)
   - Authentication
   - Authorization
   - Token validation
   - Password hashing

3. **Rate Limiting** (13 tests)
   - API rate limits
   - IP-based throttling
   - User-based limits

4. **Service Unit Tests** (138 tests)
   - PathFinder: 33 tests
   - ScoreCalculator: 55 tests
   - QuizEngine: 50 tests

5. **API Integration Tests** (95 tests)
   - Game endpoints: 40 tests
   - Quiz endpoints: 55 tests

**Location**: [backend/tests/](../../backend/tests/)  
**Documentation**: [backend/tests/README.md](../../backend/tests/README.md)

---

### Frontend Testing Stack

**Unit Testing**: Vitest 4.0.18 + React Testing Library 16.3.2

**E2E Testing**: Playwright 1.58.1

**Test Categories**:
1. **Unit Tests - TDD** (79 tests)
   - QuestionCard: 8 tests
   - AnswerOptions: 12 tests
   - AutocompleteAnswer: 20 tests
   - Timer: 23 tests
   - QuizProgress: 16 tests

2. **E2E Tests** (101+ tests)
   - Quiz Flow: 26 tests
   - Streak Tracking: 20 tests
   - Leaderboard: 30 tests
   - Guest vs Auth: 25 tests

**Location**: [frontend/](../../frontend/)  
**Documentation**: [frontend/tests/README.md](../../frontend/tests/README.md)

---

## Quick Start Guide

### Prerequisites

```bash
# Backend requirements
- Python 3.12+
- PostgreSQL 15+
- uv package manager

# Frontend requirements
- Node.js 20+
- npm 10+
```

### Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd Rahal

# 2. Setup backend
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e ".[test]"

# 3. Setup frontend
cd ../frontend
npm install

# 4. Start services (for E2E tests)
cd ..
docker-compose up -d
```

### Run All Tests

```bash
# Backend tests
cd backend
pytest

# Frontend unit tests
cd frontend
npm run test

# Frontend E2E tests
npm run test:e2e
```

### Run With Coverage

```bash
# Backend coverage
cd backend
pytest --cov=app --cov-report=html

# Frontend coverage
cd frontend
npm run test:coverage
```

---

## Component Documentation

### Backend Components

#### 1. PathFinderService
**Purpose**: Find shortest path between countries using BFS

**Test File**: [test_path_finder.py](../../backend/tests/test_services/test_path_finder.py)

**Key Test Scenarios**:
- Direct neighbors (1 hop)
- Multi-hop paths (2-5 hops)
- No valid path
- Same start/end country
- Invalid country codes
- Disconnected regions
- Performance with large graphs

**Run**: `pytest tests/test_services/test_path_finder.py`

---

#### 2. ScoreCalculator
**Purpose**: Calculate scores with emoji feedback

**Test File**: [test_score_calculator.py](../../backend/tests/test_services/test_score_calculator.py)

**Key Test Scenarios**:
- Perfect score (100 points)
- Good score (75-99 points)
- Average score (50-74 points)
- Poor score (25-49 points)
- Very poor score (<25 points)
- Zero score
- Negative modifiers
- Emoji assignment
- Multiple quiz rounds

**Run**: `pytest tests/test_services/test_score_calculator.py`

---

#### 3. QuizEngine
**Purpose**: Manage quiz sessions with Arabic support

**Test File**: [test_quiz_engine.py](../../backend/tests/test_services/test_quiz_engine.py)

**Key Test Scenarios**:
- Quiz generation with difficulty
- Question randomization
- Arabic text normalization
- Answer validation (85% fuzzy match)
- Autocomplete suggestions
- Time tracking
- Score calculation
- Hint system
- Multi-round quizzes

**Run**: `pytest tests/test_services/test_quiz_engine.py`

---

### Frontend Components

#### 1. QuestionCard Component
**Purpose**: Display quiz question with metadata

**Test File**: [QuestionCard.test.tsx](../../frontend/components/quiz/QuestionCard.test.tsx)

**Key Features**:
- Arabic text rendering
- Category badge
- Difficulty indicator
- Optional image
- Hint button
- Accessibility support

**Run**: `npm run test QuestionCard.test.tsx`

---

#### 2. Timer Component
**Purpose**: Countdown timer with visual feedback

**Test File**: [Timer.test.tsx](../../frontend/components/quiz/Timer.test.tsx)

**Key Features**:
- MM:SS format display
- Color changes (warning, critical)
- Progress bar animation
- Pause/resume functionality
- Audio/vibration alerts
- Tab visibility handling
- Accessibility announcements

**Run**: `npm run test Timer.test.tsx`

---

#### 3. AutocompleteAnswer Component
**Purpose**: Autocomplete input with API suggestions

**Test File**: [AutocompleteAnswer.test.tsx](../../frontend/components/quiz/AutocompleteAnswer.test.tsx)

**Key Features**:
- Real-time suggestions
- Debounced API calls (300ms)
- Arabic text normalization
- Keyboard navigation
- Loading states
- Error handling
- RTL support

**Run**: `npm run test AutocompleteAnswer.test.tsx`

---

### E2E Test Scenarios

#### 1. Complete Quiz Flow
**Test File**: [quiz-flow.spec.ts](../../frontend/e2e/specs/quiz-flow.spec.ts)

**User Journey**:
1. Start new quiz session
2. Answer 10 questions (multiple choice + autocomplete)
3. Use hints (score reduction)
4. Skip questions
5. Timer countdown
6. View score breakdown
7. Review answers with explanations

**Run**: `npx playwright test quiz-flow.spec.ts`

---

#### 2. Streak Tracking
**Test File**: [streak-tracking.spec.ts](../../frontend/e2e/specs/streak-tracking.spec.ts)

**User Journey**:
1. Complete daily challenge
2. View streak increment
3. Check calendar view
4. See streak milestones (🔥)
5. Receive streak notifications
6. View streak leaderboard

**Run**: `npx playwright test streak-tracking.spec.ts`

---

#### 3. Leaderboard System
**Test File**: [leaderboard.spec.ts](../../frontend/e2e/specs/leaderboard.spec.ts)

**User Journey**:
1. View ranked users
2. Filter by time period (daily/weekly/monthly/all-time)
3. Filter by category (score/streak/accuracy/speed)
4. Search for specific user
5. View personal rank
6. Track rank changes (↑↓)
7. Real-time updates

**Run**: `npx playwright test leaderboard.spec.ts`

---

#### 4. Guest vs Authenticated
**Test File**: [guest-vs-auth.spec.ts](../../frontend/e2e/specs/guest-vs-auth.spec.ts)

**Comparison**:
| Feature | Guest | Authenticated |
|---------|-------|---------------|
| Play daily challenge | ✅ | ✅ |
| Progress persistence | ❌ | ✅ |
| Statistics | Limited | Full |
| Leaderboard | View only | Compete |
| Quiz history | ❌ | ✅ |
| Streak tracking | ❌ | ✅ |
| Profile | ❌ | ✅ |

**Run**: `npx playwright test guest-vs-auth.spec.ts`

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: [.github/workflows/test.yml](../../.github/workflows/test.yml)

**Jobs**:
1. **Backend Tests** (Python 3.12)
   - Install dependencies with uv
   - Run pytest with coverage
   - Upload coverage to Codecov

2. **Frontend Unit Tests** (Node 20)
   - Install dependencies with npm
   - Run Vitest
   - Generate coverage report

3. **E2E Tests** (Playwright)
   - Start backend services
   - Install Playwright browsers
   - Run E2E test suite
   - Upload test artifacts

**Triggers**:
- Push to `main` or `develop`
- Pull requests
- Manual workflow dispatch

**Parallel Execution**: 3 jobs run concurrently

---

### Test Coverage Tracking

**Coverage Targets**:
- Phase 1: 60% (✅ Achieved)
- Phase 2: 70% (🔄 In Progress)
- Phase 3: 80% (📋 Planned)

**Coverage Reports**:
- Backend: HTML report in `backend/htmlcov/`
- Frontend: HTML report in `frontend/coverage/`
- CI: Uploaded to Codecov

---

## Contributing

### Adding New Tests

#### Backend Test

1. **Create test file**:
   ```bash
   cd backend/tests
   touch test_new_feature.py
   ```

2. **Write test**:
   ```python
   import pytest
   from app.services.new_feature import NewFeature
   
   @pytest.mark.asyncio
   async def test_new_feature():
       # Arrange
       feature = NewFeature()
       
       # Act
       result = await feature.do_something()
       
       # Assert
       assert result == expected_value
   ```

3. **Run test**:
   ```bash
   pytest tests/test_new_feature.py -v
   ```

---

#### Frontend Unit Test

1. **Create test file**:
   ```bash
   cd frontend/components
   touch NewComponent.test.tsx
   ```

2. **Write test**:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@testing-library/react';
   import { NewComponent } from './NewComponent';
   
   describe('NewComponent', () => {
     it('renders correctly', () => {
       render(<NewComponent />);
       expect(screen.getByText('Expected Text')).toBeInTheDocument();
     });
   });
   ```

3. **Run test**:
   ```bash
   npm run test NewComponent.test.tsx
   ```

---

#### E2E Test

1. **Create spec file**:
   ```bash
   cd frontend/e2e/specs
   touch new-feature.spec.ts
   ```

2. **Write test**:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test.describe('New Feature', () => {
     test('completes user journey', async ({ page }) => {
       await page.goto('/ar/new-feature');
       await page.click('[data-testid="start-button"]');
       await expect(page.locator('[data-testid="result"]')).toBeVisible();
     });
   });
   ```

3. **Run test**:
   ```bash
   npx playwright test new-feature.spec.ts
   ```

---

### Test Naming Conventions

**Backend (pytest)**:
- File: `test_<module_name>.py`
- Function: `test_<what_it_does>`
- Async: `async def test_<what_it_does>`

**Frontend (Vitest)**:
- File: `<ComponentName>.test.tsx`
- Describe: `describe('<ComponentName>', () => {})`
- Test: `it('<behavior>', () => {})`

**E2E (Playwright)**:
- File: `<feature-name>.spec.ts`
- Describe: `test.describe('<Feature Name>', () => {})`
- Test: `test('should <expected behavior>', async ({ page }) => {})`

---

### Code Review Checklist

#### For Test Authors
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Test names clearly describe what's being tested
- [ ] Tests are isolated (no dependencies on other tests)
- [ ] Async operations use proper await
- [ ] No hardcoded timeouts (use waitFor)
- [ ] Fixtures used appropriately
- [ ] Edge cases covered
- [ ] Documentation updated

#### For Reviewers
- [ ] Tests are meaningful (not testing implementation)
- [ ] Coverage increased or maintained
- [ ] No flaky tests
- [ ] Performance acceptable
- [ ] Follows project conventions
- [ ] Documentation clear

---

## Test Maintenance

### Regular Tasks

**Weekly**:
- Review flaky tests
- Update test data
- Check coverage trends

**Monthly**:
- Update dependencies
- Review test performance
- Refactor duplicate code

**Quarterly**:
- Audit test suite
- Remove obsolete tests
- Update documentation

---

### Troubleshooting

#### Flaky Tests
1. Identify flaky test
2. Run test 10+ times: `pytest tests/test_flaky.py --count=10`
3. Add appropriate waits
4. Fix race conditions
5. Verify fix with repeated runs

#### Slow Tests
1. Profile test: `pytest tests/test_slow.py --durations=10`
2. Optimize database queries
3. Use mocks for external calls
4. Parallelize with pytest-xdist

#### Coverage Gaps
1. Generate coverage: `pytest --cov=app --cov-report=html`
2. Review uncovered lines in `htmlcov/index.html`
3. Add targeted tests
4. Verify improvement

---

## Additional Resources

### Documentation Links
- [Backend Test Documentation](../../backend/tests/README.md)
- [Frontend Test Documentation](../../frontend/tests/README.md)
- [API Documentation](../backend-design.md)
- [Database Schema](../database-design.md)

### External Resources
- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Testing Philosophy
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [TDD by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Document Version**: 1.0  
**Last Updated**: February 5, 2026  
**Maintained By**: QA Team  
**Contact**: Open an issue for questions or suggestions

---

## Quick Reference

### Run All Tests
```bash
# Backend
cd backend && pytest

# Frontend Unit
cd frontend && npm run test

# Frontend E2E
cd frontend && npm run test:e2e
```

### Generate Coverage
```bash
# Backend
cd backend && pytest --cov=app --cov-report=html

# Frontend
cd frontend && npm run test:coverage
```

### Debug Tests
```bash
# Backend
cd backend && pytest -vv -s tests/test_name.py

# Frontend Unit
cd frontend && npm run test:ui

# Frontend E2E
cd frontend && npx playwright test --debug
```

---

**Happy Testing! 🧪**

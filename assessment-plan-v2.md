# Rahal — Technical Assessment & MVP Roadmap (v2)

**Date:** 2026-02-05
**Status:** Assessment Complete — Ready for Implementation
**Author:** Engineering Lead

---

## 1. Executive Summary

**Current state:** Docker Compose brings up Supabase (PostgreSQL), the FastAPI backend, and the Next.js frontend. The API serves endpoints and the frontend serves pages.

**The problem:** Zero tests pass. Every single backend test (210 across 8 files) fails at import/fixture time. Every frontend unit test (79 across 5 files) fails because the component implementations don't exist yet. All 190+ E2E tests fail because they depend on both.

**Root cause:** The test suite was written as a TDD specification — tests describe the *desired* system. The actual SQLAlchemy models were implemented with a different schema. The `conftest.py` fixtures reference 9 distinct model/field mismatches that cascade into every test file.

**In short:** This is a TDD codebase stuck in perpetual "red" phase. Tests describe one schema; code implements another.

**Estimated effort to working MVP:** ~2–3 weeks (2 developers, parallel backend + frontend tracks).

---

## 2. Test Audit (Per-File Breakdown)

### Backend Tests — 8 files, 210 test functions, ALL FAIL

| File | Tests | Root Cause | Fix Complexity |
|------|------:|------------|----------------|
| `tests/conftest.py` | N/A (fixtures) | 9 model/field mismatches (§3 below) | **HIGH** — blocks everything |
| `tests/test_services/test_path_finder.py` | 28 | Cascading from conftest + uses `CountryBorder` directly (L583) | LOW after conftest |
| `tests/test_services/test_quiz_engine.py` | 31 | Cascading from conftest; uses `question_en` in Question() constructors | LOW after conftest |
| `tests/test_services/test_score_calculator.py` | 31 | Cascading from conftest + uses `CountryBorder` (L174) | LOW after conftest |
| `tests/test_routers/test_game.py` | 26 | Cascading + **typo** `async_async_client` (L60) | **MEDIUM** after conftest |
| `tests/test_routers/test_quiz.py` | 35 | Cascading; uses `question_en` in inline Question() (L308, L509) | LOW after conftest |
| `tests/test_data_validation.py` | 17 | Uses `CountryBorder` (L11, L25, L39…), `iso_alpha_2/3` (L175–178), `country_crud` import (L13, L78), `options_ar/en` (L334), `correct_answer_ar/en` (L340, L360) | **MEDIUM** — model + data refs |
| `tests/test_security.py` | 22 | References `User` model (L13), features not implemented | **DEFER** |
| `tests/test_rate_limiting.py` | 16 | Feature not implemented | **DEFER** |

### Frontend Unit Tests — 5 files, 79 tests, ALL FAIL

| File | Tests | Component | Status |
|------|------:|-----------|--------|
| `components/quiz/QuestionCard.test.tsx` | 10 | QuestionCard | **No implementation file** |
| `components/quiz/AnswerOptions.test.tsx` | 12 | AnswerOptions | **No implementation file** |
| `components/quiz/AutocompleteAnswer.test.tsx` | 17 | AutocompleteAnswer | **No implementation file** |
| `components/quiz/Timer.test.tsx` | 22 | Timer | **No implementation file** |
| `components/quiz/QuizProgress.test.tsx` | 18 | QuizProgress | **No implementation file** |

All 5 test files import from `@/components/quiz/<ComponentName>` — none of these files exist.

### E2E Tests — 8 spec files, 190+ scenarios, ALL FAIL

| Spec File | Scenarios | Depends On |
|-----------|----------:|------------|
| `e2e/specs/accessibility.spec.ts` | 13 | Game page + components |
| `e2e/specs/autocomplete.spec.ts` | 13 | AutocompleteAnswer component + API |
| `e2e/specs/game-flow.spec.ts` | 8 | Game API endpoints |
| `e2e/specs/guest-vs-auth.spec.ts` | 43 | Auth system + game + quiz |
| `e2e/specs/leaderboard.spec.ts` | 42 | Leaderboard (not in MVP) |
| `e2e/specs/map-interaction.spec.ts` | 16 | Map component |
| `e2e/specs/quiz-flow.spec.ts` | 27 | Quiz components + API |
| `e2e/specs/streak-tracking.spec.ts` | 28 | Profile + streak logic |

**Verdict:** E2E tests are premature. They depend on components that don't exist and backend APIs that aren't tested yet. Defer entirely until Phase 3.

---

## 3. Root Cause Analysis: The 9 conftest.py Mismatches

### Mismatch 1: `CountryBorder` vs `Border`

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Import** | `from app.models.country import Country, CountryBorder` (L20) | Class is named `Border` (`country.py:74`) |
| **Usage** | `CountryBorder(country_a_id=..., country_b_id=...)` (L175–178) | `Border(country_a_id=..., country_b_id=...)` |
| **Also in** | `test_path_finder.py:583`, `test_score_calculator.py:174`, `test_data_validation.py:11,25,39,95,393` | — |

### Mismatch 2: `User` vs `Profile`

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Import** | `from app.models.user import User` (L21) | Class is named `Profile` (`user.py:19`) |
| **Fixture** | `sample_user()` returns `User(...)` (L193–209) | Should return `Profile(...)` |
| **Fields used** | `email`, `hashed_password`, `full_name`, `is_active`, `is_superuser` | **None of these exist on Profile** |
| **Profile fields** | — | `username`, `display_name`, `avatar_url`, `current_streak`, `max_streak`, `games_played`, `games_won`, `total_questions_answered`, `total_correct_answers`, `preferences` |
| **Also in** | `test_security.py:13` | — |

### Mismatch 3: `iso_alpha_2` / `iso_alpha_3` vs `code`

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Fixture** | `iso_alpha_2="EG"`, `iso_alpha_3="EGY"` (L115–116) | Single field: `code: String(3)` (`country.py:24`) |
| **Also in** | `test_data_validation.py:175–178,216–217`, `test_path_finder.py:175,293` | — |
| **Fix** | Replace both fields with `code="EGY"` (alpha-3 only) | — |

### Mismatch 4: `latitude` / `longitude` — don't exist

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Fixture** | `latitude=26.8206, longitude=30.8025` (L119–120) | **Not on Country model** |
| **Actual geo fields** | — | `continent`, `region`, `population`, `area_km2` |
| **Also in** | `test_data_validation.py:233–236` | — |
| **Fix** | Remove `latitude`/`longitude`, add `name_ar_normalized`, `region` | — |

### Mismatch 5: `correct_answer_ar` / `correct_answer_en` vs `correct_answer` / `correct_answer_normalized`

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Fixture** | `correct_answer_ar="القاهرة"`, `correct_answer_en="Cairo"` (L222–223) | `correct_answer: Text`, `correct_answer_normalized: Text` (`question.py:66–69`) |
| **Also in** | `test_data_validation.py:340,342,360–361`, `test_routers/test_quiz.py:309–310` | — |
| **Fix** | Use `correct_answer="القاهرة"`, `correct_answer_normalized="القاهره"` | — |

### Mismatch 6: `options_ar` / `options_en` vs `options` (JSONB)

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Fixture** | `options_ar=[...]`, `options_en=[...]` (L224–225) | Single field: `options: JSONB` (`question.py:72`) |
| **Also in** | `test_data_validation.py:334–337` | — |
| **Fix** | Use `options={"ar": [...], "en": [...]}` or `options=[...]` depending on API design | — |

### Mismatch 7: `question_en` — doesn't exist on model

| | conftest.py & tests | Actual Model |
|--|---------------------|--------------|
| **Used in** | `question_en="What is the capital of Egypt?"` (L221 conftest, throughout quiz_engine and quiz tests) | Only `question_ar: Text` exists (`question.py:63`) |
| **Fix** | Remove `question_en` from all Question() constructors. It is accepted as a kwarg silently but never persisted. | — |

### Mismatch 8: `date` vs `challenge_date` / `optimal_path_length` vs `shortest_path`

| | conftest.py | Actual Model |
|--|-------------|--------------|
| **Fixture** | `date=date.today()` (L281) | `challenge_date: Date` (`game.py:30`) |
| **Fixture** | `optimal_path_length=3` (L284) | `shortest_path: Integer` (`game.py:45`) |
| **Fix** | Rename fields in fixture | — |

### Mismatch 9: `create_access_token(subject=...)` vs `create_access_token(data={...})`

| | conftest.py | Actual Function |
|--|-------------|----------------|
| **Call** | `create_access_token(subject=str(sample_user.id))` (L299) | `create_access_token(data: dict[str, Any], ...)` (`security.py:31–32`) |
| **Fix** | Change to `create_access_token(data={"sub": str(sample_user.id)})` | — |

### Additional Issue: Border CHECK Constraint

The `borders` table has `CHECK (country_a_id < country_b_id)` (`country.py:110`). Fixtures create borders with `uuid4()` IDs without guaranteeing ordering. Any border where `country_a_id > country_b_id` will raise `IntegrityError`. Fixtures must sort UUIDs before creating borders.

---

## 4. MVP Scope Definition

### Keep for MVP

| Feature | Test Coverage | Priority |
|---------|--------------|----------|
| Core game loop (daily challenge → guess → score → complete) | 26 router tests, 31 score tests | **P0** |
| Path-finding service (BFS, hints, distance) | 28 service tests | **P0** |
| Quiz system (questions, answer checking, sessions) | 31 engine tests, 35 router tests | **P0** |
| 5 frontend quiz components | 79 unit tests | **P0** |
| Backend service + router tests passing | ~151 tests total | **P0** |
| ~100 countries, ~80 borders, ~100 questions (seed data) | 17 data validation tests | **P1** |

### Defer (with justification)

| Feature | Reason | Target |
|---------|--------|--------|
| E2E tests (190+ scenarios) | Components not built yet; waste of CI time | Post-Phase 3 |
| `test_security.py` (22 tests) | Aspirational; basic JWT auth works via Supabase | V1.1 |
| `test_rate_limiting.py` (16 tests) | Feature not implemented; post-MVP hardening | V1.1 |
| Leaderboard | Per PRD, V1.1 feature | V1.1 |
| Streak calendar UI | Nice-to-have | V1.1 |
| Full 195 countries / 5000 questions | Content expansion phase | V1.2 |

### Remove from Current Iteration

- Add `pytest.mark.skip` to `test_security.py` and `test_rate_limiting.py` with reason string
- Lower data thresholds in `test_data_validation.py` from 300 borders → 80, from 100 questions → 50, to match MVP seed data
- Remove `"culture"` from `REQUIRED_CATEGORIES` (L268) — not in the `QuestionCategory` enum
- Fix `test_data_validation.py` to use actual model field names

---

## 5. Sequenced Issue Roadmap

### Phase 0: Foundation (2–3 days)

> **Goal:** Make conftest fixtures compile and produce valid ORM objects.

| Issue | Description | Files | Blocks |
|-------|-------------|-------|--------|
| **0.1** | Fix conftest.py — all 9 mismatches | `tests/conftest.py` | Everything |
| **0.2** | Fix test_data_validation.py model refs | `tests/test_data_validation.py` | 1.3 |
| **0.3** | Fix test_path_finder.py refs (`CountryBorder` → `Border`, `iso_alpha_2/3` → `code`) | `tests/test_services/test_path_finder.py` | 1.1 |
| **0.4** | Fix test_score_calculator.py refs (`CountryBorder` → `Border`) | `tests/test_services/test_score_calculator.py` | 1.1 |
| **0.5** | Fix test_game.py typo (`async_async_client` → `async_client`) + confirm field names | `tests/test_routers/test_game.py` | 1.2 |
| **0.6** | Fix test_quiz.py inline Question() constructors (remove `question_en`, fix `correct_answer_ar/en`) | `tests/test_routers/test_quiz.py` | 1.2 |
| **0.7** | Skip security + rate-limiting tests with `@pytest.mark.skip(reason="Post-MVP")` | `tests/test_security.py`, `tests/test_rate_limiting.py` | Unblocks CI |

### Phase 1: Backend Tests Green (3–5 days)

> **Goal:** All non-deferred backend tests pass.

| Issue | Description | Depends On | Expected Tests |
|-------|-------------|------------|---------------:|
| **1.1** | Service tests pass: `test_path_finder` → `test_quiz_engine` → `test_score_calculator` | 0.1, 0.3, 0.4 | ~90 |
| **1.2** | Router tests pass: `test_quiz` → `test_game` | 0.1, 0.5, 0.6 | ~61 |
| **1.3** | Data validation structural tests pass (with lowered thresholds) | 0.1, 0.2 | ~17 |
| **1.4** | Run Alembic migration + seed database with MVP data | 1.1 | N/A |

### Phase 2: Frontend Components (3–5 days) — PARALLEL with Phase 1

> **Goal:** All 5 quiz components implemented, 79 unit tests green.

| Issue | Description | Test File | Tests |
|-------|-------------|-----------|------:|
| **2.1** | Implement `QuestionCard.tsx` | `QuestionCard.test.tsx` | 10 |
| **2.2** | Implement `AnswerOptions.tsx` | `AnswerOptions.test.tsx` | 12 |
| **2.3** | Implement `AutocompleteAnswer.tsx` | `AutocompleteAnswer.test.tsx` | 17 |
| **2.4** | Implement `Timer.tsx` | `Timer.test.tsx` | 22 |
| **2.5** | Implement `QuizProgress.tsx` | `QuizProgress.test.tsx` | 18 |

### Phase 3: Integration (2–3 days)

> **Goal:** Frontend wired to backend, selective E2E passing.

| Issue | Description | Depends On |
|-------|-------------|------------|
| **3.1** | Wire quiz components to backend API (`/api/quiz/*`) | 1.2, 2.1–2.5 |
| **3.2** | Wire game components to backend API (`/api/game/*`) | 1.2 |
| **3.3** | Seed database with expanded MVP data (~100 countries, ~80 borders, ~100 questions) | 1.4 |
| **3.4** | Run targeted E2E tests: `game-flow.spec.ts`, `quiz-flow.spec.ts` only | 3.1, 3.2, 3.3 |

### Phase 4: Deferred (Post-MVP)

- Rate limiting middleware + `test_rate_limiting.py` unskip
- CSRF protection + security hardening + `test_security.py` unskip
- Full data expansion (195 countries, 300+ borders, 5000 questions)
- Leaderboard, streak calendar UI
- Full E2E suite (accessibility, guest-vs-auth, leaderboard, streak-tracking)

---

## 6. Dependency Graph

```
Phase 0.1 (conftest) ──┬──> 0.3 (path_finder refs) ──> 1.1 (service tests green)
                        ├──> 0.4 (score_calc refs)  ──> 1.1
                        ├──> 0.5 (game.py typo)     ──> 1.2 (router tests green)
                        ├──> 0.6 (quiz.py refs)      ──> 1.2
                        ├──> 0.2 (data_val refs)     ──> 1.3 (data validation green)
                        └──> 1.4 (migrations + seed)

Phase 0.7 (skip tests) ──> immediate CI green on deferred suites

Phase 2.1–2.5 (frontend components) ──> 3.1 (wire to quiz API)   [PARALLEL track]
                                    ──> 3.2 (wire to game API)

Phase 1.2 + 2.5 ──> Phase 3 (integration)

Phase 3.3 (seed data) + 3.1 + 3.2 ──> 3.4 (selective E2E)

Phase 3 ──> Phase 4 (post-MVP)
```

---

## 7. Critical Files Reference

### Files to Modify — Backend

#### `backend/tests/conftest.py` — Fix All 9 Mismatches

| Line(s) | Current | Fix |
|---------|---------|-----|
| 20 | `from app.models.country import Country, CountryBorder` | `from app.models.country import Country, Border` |
| 21 | `from app.models.user import User` | `from app.models.user import Profile` |
| 115–116 | `iso_alpha_2="EG", iso_alpha_3="EGY"` | `code="EGY", name_ar_normalized="مصر"` |
| 119–120 | `latitude=26.8206, longitude=30.8025` | Remove entirely |
| 126–131 | Same pattern for Sudan | `code="SDN", name_ar_normalized="السودان"` + remove lat/lng |
| 136–142 | Same pattern for Ethiopia | `code="ETH", name_ar_normalized="اثيوبيا"` + remove lat/lng |
| 146–153 | Same pattern for Jordan | `code="JOR", name_ar_normalized="الاردن"` + remove lat/lng |
| 156–164 | Same pattern for Syria | `code="SYR", name_ar_normalized="سوريا"` + remove lat/lng |
| 175–178 | `CountryBorder(...)` | `Border(...)` + sort UUIDs so `country_a_id < country_b_id` |
| 193 | `async def sample_user(...) -> User:` | `async def sample_user(...) -> Profile:` |
| 197–204 | `User(id=..., email=..., hashed_password=..., full_name=..., is_active=..., is_superuser=...)` | `Profile(id=..., username="testuser", display_name="Test User")` |
| 221 | `question_en="What is the capital of Egypt?"` | Remove (field doesn't exist) |
| 222–223 | `correct_answer_ar="القاهرة", correct_answer_en="Cairo"` | `correct_answer="القاهرة", correct_answer_normalized="القاهره"` |
| 224–225 | `options_ar=[...], options_en=[...]` | `options={"ar": ["القاهرة", "الإسكندرية", "الجيزة", "الأقصر"], "en": ["Cairo", "Alexandria", "Giza", "Luxor"]}` |
| 229 | `points=10` | Remove (field doesn't exist on Question) |
| 234 | `question_en="What is the longest river..."` | Remove |
| 235–236 | `correct_answer_ar="النيل", correct_answer_en="Nile"` | `correct_answer="النيل", correct_answer_normalized="النيل"` |
| 237–238 | `options_ar=None, options_en=None` | `options=None` |
| 242 | `points=15` | Remove |
| 247 | `question_en="What is the largest continent..."` | Remove |
| 248–249 | `correct_answer_ar="آسيا", correct_answer_en="Asia"` | `correct_answer="آسيا", correct_answer_normalized="اسيا"` |
| 250–251 | `options_ar=[...], options_en=[...]` | `options={"ar": ["آسيا", "أفريقيا", "أمريكا الشمالية", "أوروبا"], "en": ["Asia", "Africa", "North America", "Europe"]}` |
| 255 | `points=10` | Remove |
| 281 | `date=date.today()` | `challenge_date=date.today()` |
| 284 | `optimal_path_length=3` | `shortest_path=3` |
| 293 | `def auth_headers(sample_user: User)` | `def auth_headers(sample_user: Profile)` |
| 299 | `create_access_token(subject=str(sample_user.id))` | `create_access_token(data={"sub": str(sample_user.id)})` |
| 310 | `country1.iso_alpha_2 == country2.iso_alpha_2` | `country1.code == country2.code` |
| 317 | `question1.correct_answer_ar == question2.correct_answer_ar` | `question1.correct_answer == question2.correct_answer` |

#### `backend/tests/test_services/test_path_finder.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 171–179 | `Country(..., iso_alpha_2="IS", iso_alpha_3="ISL", ...)` | `Country(..., code="ISL", name_ar_normalized="جزيرة", ...)` + remove lat/lng |
| 288–296 | Same pattern for island country | Same fix |
| 566–576 | `Country(..., iso_alpha_2=..., iso_alpha_3=..., ...)` | `Country(..., code=..., name_ar_normalized=..., ...)` |
| 583 | `from app.models.country import CountryBorder` | `from app.models.country import Border` |
| 585 | `CountryBorder(...)` | `Border(...)` + ensure UUID ordering |

#### `backend/tests/test_services/test_quiz_engine.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 28, 47, 63, 88, 102, 119, 137, 157, 175, 193, 215, 233, 251, 269, 289, 433, 489, 505, 521, 539, 559 | `question_en="..."` in Question() constructors | Remove `question_en` kwarg |

#### `backend/tests/test_services/test_score_calculator.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 162–169 | `Country(..., iso_alpha_2="MA", iso_alpha_3="MAR", ...)` | `Country(..., code="MAR", name_ar_normalized="المغرب", ...)` |
| 174 | `from app.models.country import CountryBorder` | `from app.models.country import Border` |
| 176 | `CountryBorder(...)` | `Border(...)` + ensure UUID ordering |
| 202–209 | `Country(..., iso_alpha_2="AU", iso_alpha_3="AUS", ...)` | `Country(..., code="AUS", name_ar_normalized="استراليا", ...)` |

#### `backend/tests/test_routers/test_game.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 60 | `async_async_client: AsyncClient` | `async_client: AsyncClient` |

#### `backend/tests/test_routers/test_quiz.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 308 | `question_en="What is the capital of Egypt?"` in inline Question() | Remove |
| 509 | `question_en=f"Question {difficulty} {i}"` in inline Question() | Remove |

#### `backend/tests/test_data_validation.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 11 | `from app.models.country import Country, CountryBorder` | `from app.models.country import Country, Border` |
| 13 | `from app.crud.country import country_crud` | Remove or create this CRUD module |
| 25 | `select(func.count()).select_from(CountryBorder)` | `select(func.count()).select_from(Border)` |
| 28 | `border_count >= 300` | `border_count >= 80` (MVP threshold) |
| 39 | `select(CountryBorder)` | `select(Border)` |
| 43 | `(b.country_a_id, b.country_b_id) for b in all_borders` | Same (field names correct on Border) |
| 78 | `country_crud.get_all_with_borders(db_session)` | Direct SQLAlchemy query or implement CRUD |
| 83 | `country.iso_alpha_3 not in ISLAND_NATIONS` | `country.code not in ISLAND_NATIONS` |
| 95 | `CountryBorder.country_a_id == CountryBorder.country_b_id` | `Border.country_a_id == Border.country_b_id` |
| 110 | `country_crud.get_all_with_borders(db_session)` | Same fix as L78 |
| 175 | `country.iso_alpha_2` | `country.code` (and remove iso_alpha_2 checks) |
| 178 | `country.iso_alpha_3` | `country.code` |
| 216–217 | ISO code uniqueness checks for `iso_alpha_2`, `iso_alpha_3` | Check `code` uniqueness only |
| 233–236 | `country.latitude`, `country.longitude` | Remove entire coordinate validation test (fields don't exist) |
| 255 | `question_count >= 100` | `question_count >= 50` (MVP) |
| 268 | `{"capitals", "geography", "flags", "landmarks", "culture"}` | `{"capitals", "geography", "flags", "landmarks"}` (remove "culture" — not in enum) |
| 334 | `question.options_ar` | `question.options` |
| 335–337 | `question.options_en`, length checks | Adjust to JSONB structure |
| 340 | `question.correct_answer_ar` | `question.correct_answer` |
| 342 | `question.correct_answer_en` | Remove |
| 358 | `question.question_en` | Remove (only `question_ar` exists) |
| 360–361 | `question.correct_answer_ar`, `question.correct_answer_en` | `question.correct_answer` only |
| 377 | `Country.iso_alpha_3` | `Country.code` |
| 393–397 | `CountryBorder.country_a_id, CountryBorder.country_b_id` | `Border.country_a_id, Border.country_b_id` |

#### `backend/tests/test_security.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 1 (module level) | No skip marker | Add `pytestmark = pytest.mark.skip(reason="Post-MVP: security features not implemented")` |
| 13 | `from app.models.user import User` | Change to `Profile` (if unskipped later) |

#### `backend/tests/test_rate_limiting.py`

| Line(s) | Current | Fix |
|---------|---------|-----|
| 1 (module level) | No skip marker | Add `pytestmark = pytest.mark.skip(reason="Post-MVP: rate limiting not implemented")` |

### Files to Create — Frontend

| File | Source of Truth (Test) | Props Interface |
|------|----------------------|-----------------|
| `frontend/components/quiz/QuestionCard.tsx` | `QuestionCard.test.tsx` (10 tests) | `questionNumber`, `totalQuestions`, `questionText`, `category`, `difficulty`, `points`, `direction` |
| `frontend/components/quiz/AnswerOptions.tsx` | `AnswerOptions.test.tsx` (12 tests) | `options[]`, `selectedOption`, `onSelect`, `submitted`, `correctAnswer`, `direction` |
| `frontend/components/quiz/AutocompleteAnswer.tsx` | `AutocompleteAnswer.test.tsx` (17 tests) | `suggestions[]`, `onChange`, `onSubmit`, `loading`, `error`, `submitted`, `isCorrect`, `correctAnswer`, `direction` |
| `frontend/components/quiz/Timer.tsx` | `Timer.test.tsx` (22 tests) | `initialTime`, `onExpire`, `onTick`, `paused`, `resetTrigger`, `useArabicNumerals`, `compact` |
| `frontend/components/quiz/QuizProgress.tsx` | `QuizProgress.test.tsx` (18 tests) | `currentQuestion`, `totalQuestions`, `score`, `hintsRemaining`, `correctAnswers`, `timeElapsed`, `streak`, `categoryBreakdown`, `compact` |

---

## 8. Verification Plan

### Phase 0 Verification (after conftest fix)

```bash
# Confirm fixtures compile without import errors
cd backend && python -c "from tests.conftest import *; print('OK')"
```

### Phase 1 Verification (backend tests green)

```bash
# Service tests (~90 tests)
cd backend && pytest tests/test_services/ -v --tb=short
# Expected: 90 passed

# Router tests (~61 tests)
cd backend && pytest tests/test_routers/ -v --tb=short
# Expected: 61 passed

# Data validation (~17 tests, some may skip if DB not seeded)
cd backend && pytest tests/test_data_validation.py -v --tb=short
# Expected: 10-17 passed, 0-7 skipped

# Deferred tests skipped
cd backend && pytest tests/test_security.py tests/test_rate_limiting.py -v
# Expected: 38 skipped

# Full backend suite
cd backend && pytest tests/ -v --tb=short
# Expected: ~168 passed, ~38 skipped, 0 failed
```

### Phase 2 Verification (frontend components)

```bash
cd frontend && npm run test -- --reporter=verbose
# Expected: 79 passed
```

### Phase 3 Verification (integration)

```bash
# Selective E2E
cd frontend && npx playwright test e2e/specs/game-flow.spec.ts --reporter=list
# Expected: 8 passed

cd frontend && npx playwright test e2e/specs/quiz-flow.spec.ts --reporter=list
# Expected: 27 passed
```

### Full MVP Verification

```bash
# Backend: ~168 passed, ~38 skipped
cd backend && pytest tests/ --tb=short -q

# Frontend unit: 79 passed
cd frontend && npm run test -- --reporter=verbose

# Selective E2E: ~35 passed
cd frontend && npx playwright test e2e/specs/game-flow.spec.ts e2e/specs/quiz-flow.spec.ts

# Total: ~282 passing tests across all layers
```

---

## Appendix A: Model Field Quick Reference

### Country (`backend/app/models/country.py:15`)
```
id (UUID PK), code (String 3, unique), name_ar (String 100),
name_en (String 100), name_ar_normalized (String 100),
continent (String 50), region (String 100), population (BigInteger),
area_km2 (Numeric 12,2), capital_ar (String 100), capital_en (String 100),
flag_emoji (String 10), created_at, updated_at
```

### Border (`backend/app/models/country.py:74`)
```
id (UUID PK), country_a_id (UUID FK), country_b_id (UUID FK),
border_type (String 50, default "land")
CHECK: country_a_id < country_b_id
UNIQUE: (country_a_id, country_b_id)
```

### Profile (`backend/app/models/user.py:19`)
```
id (UUID PK — links to Supabase auth.users), username (String 50, unique),
display_name (String 100), avatar_url (Text),
current_streak (Integer), max_streak (Integer),
games_played (Integer), games_won (Integer),
total_questions_answered (Integer), total_correct_answers (Integer),
preferences (JSONB), created_at, updated_at
```

### Question (`backend/app/models/question.py:43`)
```
id (UUID PK), category (String 50), difficulty (String 20),
question_type (String 30), question_ar (Text),
correct_answer (Text), correct_answer_normalized (Text),
options (JSONB), hint (Text), image_url (Text),
tags (ARRAY String), is_active (Boolean), created_at, updated_at
```

### DailyChallenge (`backend/app/models/game.py:21`)
```
id (UUID PK), challenge_date (Date, unique),
start_country_id (UUID FK), end_country_id (UUID FK),
shortest_path (Integer), solution_path (JSONB),
created_at, updated_at
```

### GameResult (`backend/app/models/game.py:63`)
```
id (UUID PK), user_id (UUID FK nullable), challenge_id (UUID FK),
guesses (JSONB), total_guesses (Integer), hints_used (Integer),
completed (Boolean), score (Integer nullable),
played_at (DateTime), created_at, updated_at
UNIQUE: (user_id, challenge_id)
```

### QuizResult (`backend/app/models/game.py:109`)
```
id (UUID PK), user_id (UUID FK nullable), question_id (UUID FK),
user_answer (Text), is_correct (Boolean), hints_used (Integer),
time_taken_ms (Integer nullable), answered_at (DateTime)
```

### create_access_token (`backend/app/core/security.py:31`)
```python
def create_access_token(
    data: dict[str, Any],           # ← NOT "subject"
    expires_delta: timedelta | None = None,
) -> str
```

---

## Appendix B: Test Count Summary

| Layer | Passing | Skipped | Deferred | Total |
|-------|--------:|--------:|---------:|------:|
| Backend service tests | 0 → 90 | 0 | 0 | 90 |
| Backend router tests | 0 → 61 | 0 | 0 | 61 |
| Backend data validation | 0 → 17 | 0 | 0 | 17 |
| Backend security | 0 | 22 | 22 | 22 |
| Backend rate limiting | 0 | 16 | 16 | 16 |
| Frontend unit tests | 0 → 79 | 0 | 0 | 79 |
| E2E tests | 0 | 0 | 190+ | 190+ |
| **Total** | **0 → 247** | **38** | **228+** | **475+** |

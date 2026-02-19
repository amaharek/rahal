# Data Schema Standards

**Last Updated:** February 6, 2026  
**Version:** 1.0

## Overview

This document defines the canonical schema structure and data format standards for the Rahal database seeding process.

---

## Countries Table

### Required Fields
- `code`: ISO 3166-1 alpha-3 code (e.g., "SAU", "EGY")
- `name_ar`: Arabic name
- `name_en`: English name
- `name_ar_normalized`: Arabic name without diacritics (auto-generated)
- `continent`: Continent name
- `region`: Geographic region
- `capital_ar`: Arabic capital name
- `capital_en`: English capital name
- `flag_emoji`: Unicode flag emoji

### Optional Fields
- `population`: Population count (BigInteger)
- `area_km2`: Area in square kilometers (Decimal)

### Example
```json
{
  "code": "EGY",
  "name_ar": "مصر",
  "name_en": "Egypt",
  "continent": "أفريقيا",
  "region": "شمال أفريقيا",
  "population": 104258327,
  "area_km2": 1002450,
  "capital_ar": "القاهرة",
  "capital_en": "Cairo",
  "flag_emoji": "🇪🇬"
}
```

---

## Borders Table

### Required Fields
- `country_a`: Country code (alpha-3)
- `country_b`: Country code (alpha-3)
- `border_type`: "land" or "maritime"

### Constraints
- `country_a_id < country_b_id` (enforced at database level)
- No self-referencing borders
- Must be bidirectional (both directions stored as single record)

### Example
```json
{
  "country_a": "EGY",
  "country_b": "PSE",
  "border_type": "land"
}
```

---

## Questions Table

### Required Fields
- `category`: One of: capitals, flags, landmarks, attractions, geography, borders, population, arab_world
- `difficulty`: One of: easy, medium, hard
- `question_type`: One of: multiple_choice, autocomplete
- `question_ar`: Question text in Arabic
- `correct_answer`: Correct answer in Arabic
- `correct_answer_normalized`: Normalized answer (auto-generated)
- `is_active`: Boolean (default: true)

### Optional Fields
- `options`: Answer options (JSONB)
- `hint`: Hint text in Arabic
- `image_url`: URL to question image
- `tags`: Array of tags for filtering

---

## ⚠️ CRITICAL: Questions.options Format

### Schema Definition
```python
options: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
```

### ✅ CORRECT Format (Direct Array)
Store options as a **direct JSON array**:

```json
{
  "question_ar": "ما هي عاصمة مصر؟",
  "options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"],
  "correct_answer": "القاهرة"
}
```

**Database Storage:**
```sql
options = '["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]'::jsonb
```

### ❌ INCORRECT Format (Wrapped Object)
**DO NOT** wrap in an `options` key:

```json
{
  "options": {
    "options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]  // ❌ WRONG
  }
}
```

### Why Direct Array?

1. **Simpler API responses**: Frontend receives `question.options` directly as array
2. **Type consistency**: Matches model definition expectations
3. **Less nesting**: Reduces complexity in queries and serialization
4. **Standard practice**: JSONB columns store the actual data structure, not a wrapper

### Code Examples

**✅ Correct - ORM (seed_unified.py):**
```python
question = Question(
    question_ar="ما هي عاصمة مصر؟",
    options=["القاهرة", "الإسكندرية", "الجيزة", "أسوان"],  # Direct list
    correct_answer="القاهرة"
)
```

**✅ Correct - Raw SQL:**
```python
await session.execute(
    text("""
        INSERT INTO questions (question_ar, options, correct_answer)
        VALUES (:question_ar, :options, :correct_answer)
    """),
    {
        "question_ar": "ما هي عاصمة مصر؟",
        "options": json.dumps(["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]),  # Direct array
        "correct_answer": "القاهرة"
    }
)
```

**❌ Incorrect - seed_database.py (OLD):**
```python
# BUG: Wraps array in object
options_json = json.dumps({"options": q.get("options", [])})  # ❌ WRONG
```

### Migration Note

If existing data has wrapped format `{"options": [...]}`, run migration:

```sql
UPDATE questions 
SET options = options->'options' 
WHERE jsonb_typeof(options) = 'object' 
  AND options ? 'options';
```

---

## Daily Challenges

### Required Fields
- `challenge_date`: Date (YYYY-MM-DD)
- `start_country_id`: UUID reference to countries.id
- `end_country_id`: UUID reference to countries.id
- `shortest_path`: Integer (optimal path length)

### Example
```json
{
  "challenge_date": "2026-02-06",
  "start_code": "SAU",
  "end_code": "EGY",
  "shortest_path": 3
}
```

---

## Data Volume Requirements (MVP)

| Entity | Minimum | Target | Purpose |
|--------|---------|--------|---------|
| Countries | 100 | 101 | Global coverage, all continents |
| Borders | 80 | 119 | Connected graph for pathfinding |
| Questions | 50 | 100 | Varied gameplay, 8 categories |
| Daily Challenges | 30 | 61 | 30 past + today + 30 future |
| Daily Quizzes | 150 | 305 | 5 questions per day × 61 days |
| Achievements | 5 | 5 | Basic achievement system |

---

## Question Category Distribution

Each category should have at least **10 questions** for varied gameplay:

- capitals: 15 questions
- flags: 12 questions
- landmarks: 15 questions
- attractions: 10 questions
- geography: 15 questions
- borders: 10 questions
- population: 13 questions
- arab_world: 10 questions

---

## Difficulty Distribution

Balanced distribution across difficulty levels:

- easy: 30-40% (30-40 questions)
- medium: 30-40% (30-40 questions)
- hard: 20-40% (20-40 questions)

---

## Data Validation Rules

### Countries
- ✅ No duplicate `code` values
- ✅ All required fields present
- ✅ `name_ar_normalized` matches normalized `name_ar`
- ✅ Valid `flag_emoji` (Unicode flag)

### Borders
- ✅ Both countries exist in countries table
- ✅ No self-referencing borders (`country_a != country_b`)
- ✅ Consistent ordering (`country_a_id < country_b_id`)
- ✅ Form connected graphs within continents

### Questions
- ✅ Valid category from `QuestionCategory` enum
- ✅ Valid difficulty from `QuestionDifficulty` enum
- ✅ Valid question_type from `QuestionType` enum
- ✅ `correct_answer_normalized` matches normalized `correct_answer`
- ✅ Multiple choice questions have exactly 4 options
- ✅ Correct answer exists in options array (for multiple choice)
- ✅ No empty strings in required fields
- ✅ Options stored as direct array, not wrapped object

---

## References

- Database Models: `backend/app/models/`
- Seeding Script: `scripts/seed_unified.py`
- Data Files: `data/countries.json`, `data/borders.json`, `data/questions/sample_questions.json`
- Test Validation: `backend/tests/test_data_validation.py`

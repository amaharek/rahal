# Database Design Document
# رحال (Rahal) - Database Architecture

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | January 30, 2026 |
| **Reference** | [PRD-Rahal.md](../PRD-Rahal.md) |

---

## 1. Overview

This document defines the complete database architecture for Rahal (رحال), an Arabic geography and travel game platform. The database is built on **PostgreSQL** via **Supabase**, with **SQLAlchemy 2.0** as the ORM and **Alembic** for migrations.

### Key Design Principles

1. **Arabic-First**: All text fields support Arabic with proper Unicode handling
2. **Performance**: Optimized indexes for autocomplete and date-based queries
3. **Security**: Row Level Security (RLS) for user data protection
4. **Scalability**: UUID primary keys, proper normalization, efficient relationships

### Database Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | PostgreSQL 15+ | Primary data store |
| Hosting | Supabase | Managed PostgreSQL + Auth |
| ORM | SQLAlchemy 2.0 | Python database abstraction |
| Migrations | Alembic | Schema version control |
| Local Dev | Supabase CLI | Local PostgreSQL instance |

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Game Entities
    COUNTRIES {
        uuid id PK
        varchar(3) code UK
        varchar(100) name_ar
        varchar(100) name_en
        varchar(50) continent
        varchar(100) region
        bigint population
        decimal area_km2
        varchar(100) capital_ar
        varchar(100) capital_en
        varchar(10) flag_emoji
        timestamptz created_at
        timestamptz updated_at
    }

    BORDERS {
        uuid id PK
        uuid country_a_id FK
        uuid country_b_id FK
        varchar(50) border_type
    }

    DAILY_CHALLENGES {
        uuid id PK
        date challenge_date UK
        uuid start_country_id FK
        uuid end_country_id FK
        integer shortest_path
        jsonb solution_path
        timestamptz created_at
        timestamptz updated_at
    }

    %% Quiz Entities
    QUESTIONS {
        uuid id PK
        varchar(50) category
        varchar(20) difficulty
        varchar(30) question_type
        text question_ar
        text correct_answer
        jsonb options
        text hint
        text image_url
        text[] tags
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    %% User Entities
    PROFILES {
        uuid id PK,FK
        varchar(50) username UK
        varchar(100) display_name
        text avatar_url
        integer current_streak
        integer max_streak
        integer games_played
        integer games_won
        integer total_questions_answered
        integer total_correct_answers
        jsonb preferences
        timestamptz created_at
        timestamptz updated_at
    }

    %% Game Results
    GAME_RESULTS {
        uuid id PK
        uuid user_id FK
        uuid challenge_id FK
        jsonb guesses
        integer total_guesses
        integer hints_used
        boolean completed
        integer score
        timestamptz played_at
        timestamptz created_at
    }

    QUIZ_RESULTS {
        uuid id PK
        uuid user_id FK
        uuid question_id FK
        text user_answer
        boolean is_correct
        integer hints_used
        integer time_taken_ms
        timestamptz answered_at
    }

    %% Achievement System
    ACHIEVEMENTS {
        uuid id PK
        varchar(50) code UK
        varchar(100) name_ar
        varchar(100) name_en
        text description_ar
        text description_en
        varchar(50) icon
        varchar(30) category
        jsonb requirement
        integer points
        timestamptz created_at
    }

    USER_ACHIEVEMENTS {
        uuid id PK
        uuid user_id FK
        uuid achievement_id FK
        jsonb progress
        timestamptz unlocked_at
    }

    %% Relationships
    COUNTRIES ||--o{ BORDERS : "country_a"
    COUNTRIES ||--o{ BORDERS : "country_b"
    COUNTRIES ||--o{ DAILY_CHALLENGES : "start_country"
    COUNTRIES ||--o{ DAILY_CHALLENGES : "end_country"

    PROFILES ||--o{ GAME_RESULTS : "plays"
    PROFILES ||--o{ QUIZ_RESULTS : "answers"
    PROFILES ||--o{ USER_ACHIEVEMENTS : "earns"

    DAILY_CHALLENGES ||--o{ GAME_RESULTS : "has_results"
    QUESTIONS ||--o{ QUIZ_RESULTS : "has_answers"
    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : "awarded_to"
```

---

## 3. Table Specifications

### 3.1 Countries Table

Stores all 197 UN-recognized countries with Arabic and English names.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `code` | VARCHAR(3) | UNIQUE, NOT NULL | ISO 3166-1 alpha-3 code |
| `name_ar` | VARCHAR(100) | NOT NULL | Arabic country name |
| `name_en` | VARCHAR(100) | NOT NULL | English country name |
| `name_ar_normalized` | VARCHAR(100) | NOT NULL | Arabic name without diacritics (for search) |
| `continent` | VARCHAR(50) | | Continent name (Arabic) |
| `region` | VARCHAR(100) | | Geographic region |
| `population` | BIGINT | | Population count |
| `area_km2` | DECIMAL(12,2) | | Area in square kilometers |
| `capital_ar` | VARCHAR(100) | | Capital city (Arabic) |
| `capital_en` | VARCHAR(100) | | Capital city (English) |
| `flag_emoji` | VARCHAR(10) | | Flag emoji character |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 3.2 Borders Table

Represents bidirectional connections between countries (graph edges).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `country_a_id` | UUID | FK → countries(id), NOT NULL | First country |
| `country_b_id` | UUID | FK → countries(id), NOT NULL | Second country |
| `border_type` | VARCHAR(50) | DEFAULT 'land' | Type: land, bridge, tunnel, ferry |
| | | UNIQUE(country_a_id, country_b_id) | Prevent duplicate edges |
| | | CHECK(country_a_id < country_b_id) | Enforce ordering to prevent reverse duplicates |

### 3.3 Daily Challenges Table

Stores pre-generated daily path puzzles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `challenge_date` | DATE | UNIQUE, NOT NULL | Challenge date |
| `start_country_id` | UUID | FK → countries(id), NOT NULL | Starting country |
| `end_country_id` | UUID | FK → countries(id), NOT NULL | Destination country |
| `shortest_path` | INTEGER | NOT NULL, CHECK(shortest_path > 0) | Minimum countries needed |
| `solution_path` | JSONB | | Array of country IDs in optimal path |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 3.4 Questions Table

Quiz questions with support for multiple choice and autocomplete types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `category` | VARCHAR(50) | NOT NULL | Question category (enum) |
| `difficulty` | VARCHAR(20) | NOT NULL | easy, medium, hard |
| `question_type` | VARCHAR(30) | NOT NULL | multiple_choice, autocomplete |
| `question_ar` | TEXT | NOT NULL | Question text in Arabic |
| `correct_answer` | TEXT | NOT NULL | Correct answer |
| `correct_answer_normalized` | TEXT | NOT NULL | Normalized answer (for matching) |
| `options` | JSONB | | Multiple choice options array |
| `hint` | TEXT | | Optional hint text |
| `image_url` | TEXT | | Optional image URL |
| `tags` | TEXT[] | | Array of tags for filtering |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether question is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Category Enum Values:**
- `capitals` - العواصم
- `flags` - الأعلام
- `landmarks` - المعالم
- `attractions` - معالم الجذب
- `geography` - الجغرافيا
- `borders` - الحدود
- `population` - السكان
- `arab_world` - العالم العربي

### 3.5 Profiles Table

User profiles extending Supabase auth.users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users(id) | Links to Supabase auth |
| `username` | VARCHAR(50) | UNIQUE | Unique username |
| `display_name` | VARCHAR(100) | | Display name |
| `avatar_url` | TEXT | | Profile picture URL |
| `current_streak` | INTEGER | DEFAULT 0 | Current winning streak |
| `max_streak` | INTEGER | DEFAULT 0 | Best streak achieved |
| `games_played` | INTEGER | DEFAULT 0 | Total games played |
| `games_won` | INTEGER | DEFAULT 0 | Total games won |
| `total_questions_answered` | INTEGER | DEFAULT 0 | Total quiz questions answered |
| `total_correct_answers` | INTEGER | DEFAULT 0 | Total correct answers |
| `preferences` | JSONB | DEFAULT '{}' | User preferences (theme, notifications) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 3.6 Game Results Table

Records of user attempts at daily challenges.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | FK → profiles(id) | Player |
| `challenge_id` | UUID | FK → daily_challenges(id) | Challenge played |
| `guesses` | JSONB | NOT NULL | Array of {country_id, score_emoji, order} |
| `total_guesses` | INTEGER | NOT NULL | Number of guesses made |
| `hints_used` | INTEGER | DEFAULT 0 | Number of hints used |
| `completed` | BOOLEAN | DEFAULT FALSE | Whether puzzle was solved |
| `score` | INTEGER | | Final score (if completed) |
| `played_at` | TIMESTAMPTZ | DEFAULT NOW() | When game was played |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| | | UNIQUE(user_id, challenge_id) | One result per user per challenge |

**Guesses JSONB Structure:**
```json
[
  {"country_id": "uuid", "name_ar": "فرنسا", "emoji": "🟢", "order": 1},
  {"country_id": "uuid", "name_ar": "ألمانيا", "emoji": "🟡", "order": 2}
]
```

### 3.7 Quiz Results Table

Individual quiz question answers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | FK → profiles(id) | Player |
| `question_id` | UUID | FK → questions(id) | Question answered |
| `user_answer` | TEXT | NOT NULL | User's answer |
| `is_correct` | BOOLEAN | NOT NULL | Whether answer was correct |
| `hints_used` | INTEGER | DEFAULT 0 | Hints used for this question |
| `time_taken_ms` | INTEGER | | Time to answer in milliseconds |
| `answered_at` | TIMESTAMPTZ | DEFAULT NOW() | When answer was submitted |

### 3.8 Achievements Table

Available achievements/badges.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Achievement code (e.g., 'first_win') |
| `name_ar` | VARCHAR(100) | NOT NULL | Arabic name |
| `name_en` | VARCHAR(100) | NOT NULL | English name |
| `description_ar` | TEXT | | Arabic description |
| `description_en` | TEXT | | English description |
| `icon` | VARCHAR(50) | | Icon identifier or emoji |
| `category` | VARCHAR(30) | | Category (games, quiz, streak, special) |
| `requirement` | JSONB | | Unlock criteria |
| `points` | INTEGER | DEFAULT 0 | Points awarded |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Requirement JSONB Examples:**
```json
// Win 10 games
{"type": "games_won", "count": 10}

// 7-day streak
{"type": "streak", "days": 7}

// Answer 100 questions correctly
{"type": "correct_answers", "count": 100}

// Complete without hints
{"type": "no_hints", "games": 5}
```

### 3.9 User Achievements Table

Junction table for user-earned achievements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | FK → profiles(id), NOT NULL | User who earned it |
| `achievement_id` | UUID | FK → achievements(id), NOT NULL | Achievement earned |
| `progress` | JSONB | DEFAULT '{}' | Progress towards achievement |
| `unlocked_at` | TIMESTAMPTZ | DEFAULT NOW() | When unlocked |
| | | UNIQUE(user_id, achievement_id) | One per user per achievement |

---

## 4. Indexes & Performance Considerations

### 4.1 Primary Indexes

```sql
-- Countries: Fast Arabic text search
CREATE INDEX idx_countries_name_ar_normalized ON countries USING gin (name_ar_normalized gin_trgm_ops);
CREATE INDEX idx_countries_name_ar ON countries USING gin (name_ar gin_trgm_ops);
CREATE INDEX idx_countries_continent ON countries(continent);
CREATE INDEX idx_countries_region ON countries(region);

-- Borders: Graph traversal
CREATE INDEX idx_borders_country_a ON borders(country_a_id);
CREATE INDEX idx_borders_country_b ON borders(country_b_id);

-- Daily Challenges: Date lookup
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_daily_challenges_date_desc ON daily_challenges(challenge_date DESC);

-- Questions: Category and difficulty filtering
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
CREATE INDEX idx_questions_category_difficulty ON questions(category, difficulty) WHERE is_active = true;
CREATE INDEX idx_questions_tags ON questions USING gin(tags);

-- Game Results: User history
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_challenge_id ON game_results(challenge_id);
CREATE INDEX idx_game_results_played_at ON game_results(played_at DESC);
CREATE INDEX idx_game_results_user_completed ON game_results(user_id, completed);

-- Quiz Results: User history and analytics
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_question_id ON quiz_results(question_id);
CREATE INDEX idx_quiz_results_answered_at ON quiz_results(answered_at DESC);
CREATE INDEX idx_quiz_results_user_correct ON quiz_results(user_id, is_correct);

-- Profiles: Leaderboard queries
CREATE INDEX idx_profiles_current_streak ON profiles(current_streak DESC);
CREATE INDEX idx_profiles_max_streak ON profiles(max_streak DESC);
CREATE INDEX idx_profiles_games_won ON profiles(games_won DESC);

-- User Achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
```

### 4.2 Performance Notes

1. **Arabic Text Search**: Uses PostgreSQL `pg_trgm` extension for trigram-based fuzzy search
2. **Normalized Fields**: `name_ar_normalized` and `correct_answer_normalized` store diacritic-stripped versions for matching
3. **Partial Indexes**: Active questions index only includes `is_active = true`
4. **JSONB Indexes**: Consider GIN indexes on `guesses` and `options` if querying inside them

---

## 5. Supabase Local Setup Guide

### 5.1 Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Or using Homebrew (Mac)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 5.2 Initialize Supabase Project

```bash
# Navigate to project root
cd /path/to/rahal

# Initialize Supabase (creates supabase/ directory)
npx supabase init

# Start local Supabase (PostgreSQL, Auth, Storage, etc.)
npx supabase start
```

### 5.3 Environment Variables

After `supabase start`, you'll see output like:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DATABASE_URL_ASYNC=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres

# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase JWT Secret (for token verification)
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

### 5.4 Supabase CLI Commands

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database (deletes all data)
npx supabase db reset

# View database status
npx supabase status

# Access local Studio (GUI)
# Open: http://127.0.0.1:54323

# Generate TypeScript types from schema
npx supabase gen types typescript --local > types/supabase.ts

# Push local migrations to remote (production)
npx supabase db push

# Pull remote schema to local
npx supabase db pull
```

### 5.5 Supabase Config (supabase/config.toml)

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000"]

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[storage]
enabled = true
file_size_limit = "50MiB"
```

---

## 6. Database Creation Script (SQL)

```sql
-- ============================================
-- Rahal Database Schema
-- Version: 1.0
-- Date: January 30, 2026
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For Arabic text fuzzy search

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE question_category AS ENUM (
    'capitals',
    'flags',
    'landmarks',
    'attractions',
    'geography',
    'borders',
    'population',
    'arab_world'
);

CREATE TYPE question_difficulty AS ENUM (
    'easy',
    'medium',
    'hard'
);

CREATE TYPE question_type AS ENUM (
    'multiple_choice',
    'autocomplete'
);

CREATE TYPE border_type AS ENUM (
    'land',
    'bridge',
    'tunnel',
    'ferry'
);

CREATE TYPE achievement_category AS ENUM (
    'games',
    'quiz',
    'streak',
    'special'
);

-- ============================================
-- TABLES
-- ============================================

-- Countries Table
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar_normalized VARCHAR(100) NOT NULL,
    continent VARCHAR(50),
    region VARCHAR(100),
    population BIGINT,
    area_km2 DECIMAL(12, 2),
    capital_ar VARCHAR(100),
    capital_en VARCHAR(100),
    flag_emoji VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Borders Table (Graph Edges)
CREATE TABLE borders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_a_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    country_b_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    border_type border_type DEFAULT 'land',
    CONSTRAINT unique_border UNIQUE (country_a_id, country_b_id),
    CONSTRAINT ordered_countries CHECK (country_a_id < country_b_id)
);

-- Daily Challenges Table
CREATE TABLE daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE UNIQUE NOT NULL,
    start_country_id UUID NOT NULL REFERENCES countries(id),
    end_country_id UUID NOT NULL REFERENCES countries(id),
    shortest_path INTEGER NOT NULL CHECK (shortest_path > 0),
    solution_path JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_countries CHECK (start_country_id != end_country_id)
);

-- Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category question_category NOT NULL,
    difficulty question_difficulty NOT NULL,
    question_type question_type NOT NULL,
    question_ar TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    correct_answer_normalized TEXT NOT NULL,
    options JSONB,
    hint TEXT,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Results Table
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    guesses JSONB NOT NULL DEFAULT '[]',
    total_guesses INTEGER NOT NULL DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_challenge UNIQUE (user_id, challenge_id)
);

-- Quiz Results Table
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    hints_used INTEGER DEFAULT 0,
    time_taken_ms INTEGER,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    category achievement_category,
    requirement JSONB,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements Table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress JSONB DEFAULT '{}',
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Countries indexes
CREATE INDEX idx_countries_name_ar_trgm ON countries USING gin (name_ar gin_trgm_ops);
CREATE INDEX idx_countries_name_ar_normalized_trgm ON countries USING gin (name_ar_normalized gin_trgm_ops);
CREATE INDEX idx_countries_continent ON countries(continent);
CREATE INDEX idx_countries_region ON countries(region);

-- Borders indexes
CREATE INDEX idx_borders_country_a ON borders(country_a_id);
CREATE INDEX idx_borders_country_b ON borders(country_b_id);

-- Daily Challenges indexes
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_daily_challenges_date_desc ON daily_challenges(challenge_date DESC);

-- Questions indexes
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
CREATE INDEX idx_questions_category_difficulty ON questions(category, difficulty) WHERE is_active = true;
CREATE INDEX idx_questions_tags ON questions USING gin(tags);
CREATE INDEX idx_questions_correct_answer_trgm ON questions USING gin (correct_answer_normalized gin_trgm_ops);

-- Game Results indexes
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_challenge_id ON game_results(challenge_id);
CREATE INDEX idx_game_results_played_at ON game_results(played_at DESC);
CREATE INDEX idx_game_results_user_completed ON game_results(user_id, completed);

-- Quiz Results indexes
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_question_id ON quiz_results(question_id);
CREATE INDEX idx_quiz_results_answered_at ON quiz_results(answered_at DESC);
CREATE INDEX idx_quiz_results_user_correct ON quiz_results(user_id, is_correct);

-- Profiles indexes
CREATE INDEX idx_profiles_current_streak ON profiles(current_streak DESC);
CREATE INDEX idx_profiles_max_streak ON profiles(max_streak DESC);
CREATE INDEX idx_profiles_games_won ON profiles(games_won DESC);

-- User Achievements indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER trigger_countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_daily_challenges_updated_at
    BEFORE UPDATE ON daily_challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get neighboring countries (for graph traversal)
CREATE OR REPLACE FUNCTION get_neighbors(country_id UUID)
RETURNS TABLE(neighbor_id UUID, neighbor_name_ar VARCHAR, border_type border_type) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN b.country_a_id = country_id THEN b.country_b_id
            ELSE b.country_a_id
        END as neighbor_id,
        c.name_ar as neighbor_name_ar,
        b.border_type
    FROM borders b
    JOIN countries c ON c.id = CASE
        WHEN b.country_a_id = country_id THEN b.country_b_id
        ELSE b.country_a_id
    END
    WHERE b.country_a_id = country_id OR b.country_b_id = country_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Row Level Security (RLS) Policies

```sql
-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can view other profiles (for leaderboards)
CREATE POLICY "Users can view public profile info"
    ON profiles FOR SELECT
    USING (true);

-- ============================================
-- GAME RESULTS POLICIES
-- ============================================

-- Users can view their own game results
CREATE POLICY "Users can view own game results"
    ON game_results FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own game results
CREATE POLICY "Users can insert own game results"
    ON game_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own game results
CREATE POLICY "Users can update own game results"
    ON game_results FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Anonymous users can insert game results (guest play)
CREATE POLICY "Anonymous users can insert game results"
    ON game_results FOR INSERT
    WITH CHECK (user_id IS NULL);

-- ============================================
-- QUIZ RESULTS POLICIES
-- ============================================

-- Users can view their own quiz results
CREATE POLICY "Users can view own quiz results"
    ON quiz_results FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own quiz results
CREATE POLICY "Users can insert own quiz results"
    ON quiz_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Anonymous users can insert quiz results
CREATE POLICY "Anonymous users can insert quiz results"
    ON quiz_results FOR INSERT
    WITH CHECK (user_id IS NULL);

-- ============================================
-- USER ACHIEVEMENTS POLICIES
-- ============================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- System inserts achievements (via service role)
-- Regular users cannot insert achievements directly

-- ============================================
-- PUBLIC TABLES (No RLS needed for read)
-- ============================================

-- Countries, Borders, Questions, Achievements, Daily Challenges
-- are public read - no RLS policies needed for SELECT
-- INSERT/UPDATE/DELETE restricted to service role

-- Grant read access to authenticated and anonymous users
GRANT SELECT ON countries TO anon, authenticated;
GRANT SELECT ON borders TO anon, authenticated;
GRANT SELECT ON questions TO anon, authenticated;
GRANT SELECT ON achievements TO anon, authenticated;
GRANT SELECT ON daily_challenges TO anon, authenticated;

-- Grant insert/update on user tables to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON game_results TO authenticated;
GRANT SELECT, INSERT ON quiz_results TO authenticated;
GRANT SELECT ON user_achievements TO authenticated;

-- Anonymous users can read and play
GRANT SELECT ON countries TO anon;
GRANT SELECT ON borders TO anon;
GRANT SELECT ON questions TO anon;
GRANT SELECT ON daily_challenges TO anon;
GRANT INSERT ON game_results TO anon;
GRANT INSERT ON quiz_results TO anon;
```

---

## 8. Seeding Script (Python)

### 8.1 Seeding Script: `scripts/seed_database.py`

```python
#!/usr/bin/env python3
"""
Rahal Database Seeding Script
Seeds countries, borders, questions, and achievements.

Usage:
    cd backend
    source .venv/bin/activate
    python ../scripts/seed_database.py
"""

import asyncio
import json
import os
import re
import unicodedata
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.models.country import Country, Border
from app.models.question import Question, QuestionCategory, QuestionDifficulty, QuestionType
from app.models.game import DailyChallenge
from app.models.user import Achievement

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL_ASYNC", "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for search:
    - Remove diacritics (tashkeel)
    - Normalize alef variations
    - Remove tatweel
    """
    if not text:
        return ""

    # Unicode normalization
    text = unicodedata.normalize("NFKC", text)

    # Remove Arabic diacritics (tashkeel)
    arabic_diacritics = re.compile(r'[\u064B-\u065F\u0670]')
    text = arabic_diacritics.sub('', text)

    # Normalize alef variations to bare alef
    text = re.sub(r'[إأآا]', 'ا', text)

    # Remove tatweel
    text = text.replace('\u0640', '')

    return text.strip()


# ============================================
# COUNTRY DATA (Sample - Full list would be 197 countries)
# ============================================

COUNTRIES_DATA = [
    # Arab World
    {"code": "SAU", "name_ar": "السعودية", "name_en": "Saudi Arabia", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "الرياض", "capital_en": "Riyadh", "flag_emoji": "🇸🇦", "population": 34813871, "area_km2": 2149690},
    {"code": "EGY", "name_ar": "مصر", "name_en": "Egypt", "continent": "أفريقيا", "region": "شمال أفريقيا", "capital_ar": "القاهرة", "capital_en": "Cairo", "flag_emoji": "🇪🇬", "population": 102334404, "area_km2": 1002450},
    {"code": "ARE", "name_ar": "الإمارات", "name_en": "United Arab Emirates", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "أبوظبي", "capital_en": "Abu Dhabi", "flag_emoji": "🇦🇪", "population": 9890402, "area_km2": 83600},
    {"code": "JOR", "name_ar": "الأردن", "name_en": "Jordan", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "عمّان", "capital_en": "Amman", "flag_emoji": "🇯🇴", "population": 10203134, "area_km2": 89342},
    {"code": "LBN", "name_ar": "لبنان", "name_en": "Lebanon", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "بيروت", "capital_en": "Beirut", "flag_emoji": "🇱🇧", "population": 6825445, "area_km2": 10452},
    {"code": "SYR", "name_ar": "سوريا", "name_en": "Syria", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "دمشق", "capital_en": "Damascus", "flag_emoji": "🇸🇾", "population": 17500658, "area_km2": 185180},
    {"code": "IRQ", "name_ar": "العراق", "name_en": "Iraq", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "بغداد", "capital_en": "Baghdad", "flag_emoji": "🇮🇶", "population": 40222493, "area_km2": 438317},
    {"code": "KWT", "name_ar": "الكويت", "name_en": "Kuwait", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "الكويت", "capital_en": "Kuwait City", "flag_emoji": "🇰🇼", "population": 4270571, "area_km2": 17818},
    {"code": "QAT", "name_ar": "قطر", "name_en": "Qatar", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "الدوحة", "capital_en": "Doha", "flag_emoji": "🇶🇦", "population": 2881053, "area_km2": 11586},
    {"code": "BHR", "name_ar": "البحرين", "name_en": "Bahrain", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "المنامة", "capital_en": "Manama", "flag_emoji": "🇧🇭", "population": 1701575, "area_km2": 765},
    {"code": "OMN", "name_ar": "عُمان", "name_en": "Oman", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "مسقط", "capital_en": "Muscat", "flag_emoji": "🇴🇲", "population": 5106626, "area_km2": 309500},
    {"code": "YEM", "name_ar": "اليمن", "name_en": "Yemen", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "صنعاء", "capital_en": "Sanaa", "flag_emoji": "🇾🇪", "population": 29825964, "area_km2": 527968},
    {"code": "PSE", "name_ar": "فلسطين", "name_en": "Palestine", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "القدس", "capital_en": "Jerusalem", "flag_emoji": "🇵🇸", "population": 5101414, "area_km2": 6220},
    {"code": "LBY", "name_ar": "ليبيا", "name_en": "Libya", "continent": "أفريقيا", "region": "شمال أفريقيا", "capital_ar": "طرابلس", "capital_en": "Tripoli", "flag_emoji": "🇱🇾", "population": 6871292, "area_km2": 1759540},
    {"code": "TUN", "name_ar": "تونس", "name_en": "Tunisia", "continent": "أفريقيا", "region": "شمال أفريقيا", "capital_ar": "تونس", "capital_en": "Tunis", "flag_emoji": "🇹🇳", "population": 11818619, "area_km2": 163610},
    {"code": "DZA", "name_ar": "الجزائر", "name_en": "Algeria", "continent": "أفريقيا", "region": "شمال أفريقيا", "capital_ar": "الجزائر", "capital_en": "Algiers", "flag_emoji": "🇩🇿", "population": 43851044, "area_km2": 2381741},
    {"code": "MAR", "name_ar": "المغرب", "name_en": "Morocco", "continent": "أفريقيا", "region": "شمال أفريقيا", "capital_ar": "الرباط", "capital_en": "Rabat", "flag_emoji": "🇲🇦", "population": 36910560, "area_km2": 446550},
    {"code": "MRT", "name_ar": "موريتانيا", "name_en": "Mauritania", "continent": "أفريقيا", "region": "غرب أفريقيا", "capital_ar": "نواكشوط", "capital_en": "Nouakchott", "flag_emoji": "🇲🇷", "population": 4649658, "area_km2": 1030700},
    {"code": "SDN", "name_ar": "السودان", "name_en": "Sudan", "continent": "أفريقيا", "region": "شمال أفريقيا", "capital_ar": "الخرطوم", "capital_en": "Khartoum", "flag_emoji": "🇸🇩", "population": 43849260, "area_km2": 1861484},
    {"code": "SOM", "name_ar": "الصومال", "name_en": "Somalia", "continent": "أفريقيا", "region": "شرق أفريقيا", "capital_ar": "مقديشو", "capital_en": "Mogadishu", "flag_emoji": "🇸🇴", "population": 15893222, "area_km2": 637657},
    {"code": "DJI", "name_ar": "جيبوتي", "name_en": "Djibouti", "continent": "أفريقيا", "region": "شرق أفريقيا", "capital_ar": "جيبوتي", "capital_en": "Djibouti", "flag_emoji": "🇩🇯", "population": 988000, "area_km2": 23200},
    {"code": "COM", "name_ar": "جزر القمر", "name_en": "Comoros", "continent": "أفريقيا", "region": "شرق أفريقيا", "capital_ar": "موروني", "capital_en": "Moroni", "flag_emoji": "🇰🇲", "population": 869601, "area_km2": 2235},

    # Europe
    {"code": "FRA", "name_ar": "فرنسا", "name_en": "France", "continent": "أوروبا", "region": "غرب أوروبا", "capital_ar": "باريس", "capital_en": "Paris", "flag_emoji": "🇫🇷", "population": 67390000, "area_km2": 643801},
    {"code": "DEU", "name_ar": "ألمانيا", "name_en": "Germany", "continent": "أوروبا", "region": "غرب أوروبا", "capital_ar": "برلين", "capital_en": "Berlin", "flag_emoji": "🇩🇪", "population": 83783942, "area_km2": 357114},
    {"code": "GBR", "name_ar": "المملكة المتحدة", "name_en": "United Kingdom", "continent": "أوروبا", "region": "شمال أوروبا", "capital_ar": "لندن", "capital_en": "London", "flag_emoji": "🇬🇧", "population": 67886011, "area_km2": 242495},
    {"code": "ITA", "name_ar": "إيطاليا", "name_en": "Italy", "continent": "أوروبا", "region": "جنوب أوروبا", "capital_ar": "روما", "capital_en": "Rome", "flag_emoji": "🇮🇹", "population": 60461826, "area_km2": 301340},
    {"code": "ESP", "name_ar": "إسبانيا", "name_en": "Spain", "continent": "أوروبا", "region": "جنوب أوروبا", "capital_ar": "مدريد", "capital_en": "Madrid", "flag_emoji": "🇪🇸", "population": 46754778, "area_km2": 505992},
    {"code": "PRT", "name_ar": "البرتغال", "name_en": "Portugal", "continent": "أوروبا", "region": "جنوب أوروبا", "capital_ar": "لشبونة", "capital_en": "Lisbon", "flag_emoji": "🇵🇹", "population": 10196709, "area_km2": 92090},
    {"code": "NLD", "name_ar": "هولندا", "name_en": "Netherlands", "continent": "أوروبا", "region": "غرب أوروبا", "capital_ar": "أمستردام", "capital_en": "Amsterdam", "flag_emoji": "🇳🇱", "population": 17134872, "area_km2": 41850},
    {"code": "BEL", "name_ar": "بلجيكا", "name_en": "Belgium", "continent": "أوروبا", "region": "غرب أوروبا", "capital_ar": "بروكسل", "capital_en": "Brussels", "flag_emoji": "🇧🇪", "population": 11589623, "area_km2": 30528},
    {"code": "CHE", "name_ar": "سويسرا", "name_en": "Switzerland", "continent": "أوروبا", "region": "غرب أوروبا", "capital_ar": "برن", "capital_en": "Bern", "flag_emoji": "🇨🇭", "population": 8654622, "area_km2": 41284},
    {"code": "AUT", "name_ar": "النمسا", "name_en": "Austria", "continent": "أوروبا", "region": "غرب أوروبا", "capital_ar": "فيينا", "capital_en": "Vienna", "flag_emoji": "🇦🇹", "population": 9006398, "area_km2": 83879},
    {"code": "POL", "name_ar": "بولندا", "name_en": "Poland", "continent": "أوروبا", "region": "شرق أوروبا", "capital_ar": "وارسو", "capital_en": "Warsaw", "flag_emoji": "🇵🇱", "population": 37846611, "area_km2": 312696},
    {"code": "CZE", "name_ar": "التشيك", "name_en": "Czech Republic", "continent": "أوروبا", "region": "شرق أوروبا", "capital_ar": "براغ", "capital_en": "Prague", "flag_emoji": "🇨🇿", "population": 10708981, "area_km2": 78865},
    {"code": "GRC", "name_ar": "اليونان", "name_en": "Greece", "continent": "أوروبا", "region": "جنوب أوروبا", "capital_ar": "أثينا", "capital_en": "Athens", "flag_emoji": "🇬🇷", "population": 10423054, "area_km2": 131957},
    {"code": "TUR", "name_ar": "تركيا", "name_en": "Turkey", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "أنقرة", "capital_en": "Ankara", "flag_emoji": "🇹🇷", "population": 84339067, "area_km2": 783562},
    {"code": "RUS", "name_ar": "روسيا", "name_en": "Russia", "continent": "أوروبا", "region": "شرق أوروبا", "capital_ar": "موسكو", "capital_en": "Moscow", "flag_emoji": "🇷🇺", "population": 145934462, "area_km2": 17098242},

    # Asia
    {"code": "CHN", "name_ar": "الصين", "name_en": "China", "continent": "آسيا", "region": "شرق آسيا", "capital_ar": "بكين", "capital_en": "Beijing", "flag_emoji": "🇨🇳", "population": 1439323776, "area_km2": 9596961},
    {"code": "JPN", "name_ar": "اليابان", "name_en": "Japan", "continent": "آسيا", "region": "شرق آسيا", "capital_ar": "طوكيو", "capital_en": "Tokyo", "flag_emoji": "🇯🇵", "population": 126476461, "area_km2": 377975},
    {"code": "KOR", "name_ar": "كوريا الجنوبية", "name_en": "South Korea", "continent": "آسيا", "region": "شرق آسيا", "capital_ar": "سيول", "capital_en": "Seoul", "flag_emoji": "🇰🇷", "population": 51269185, "area_km2": 100210},
    {"code": "IND", "name_ar": "الهند", "name_en": "India", "continent": "آسيا", "region": "جنوب آسيا", "capital_ar": "نيودلهي", "capital_en": "New Delhi", "flag_emoji": "🇮🇳", "population": 1380004385, "area_km2": 3287263},
    {"code": "PAK", "name_ar": "باكستان", "name_en": "Pakistan", "continent": "آسيا", "region": "جنوب آسيا", "capital_ar": "إسلام آباد", "capital_en": "Islamabad", "flag_emoji": "🇵🇰", "population": 220892340, "area_km2": 881913},
    {"code": "IRN", "name_ar": "إيران", "name_en": "Iran", "continent": "آسيا", "region": "الشرق الأوسط", "capital_ar": "طهران", "capital_en": "Tehran", "flag_emoji": "🇮🇷", "population": 83992949, "area_km2": 1648195},
    {"code": "AFG", "name_ar": "أفغانستان", "name_en": "Afghanistan", "continent": "آسيا", "region": "جنوب آسيا", "capital_ar": "كابل", "capital_en": "Kabul", "flag_emoji": "🇦🇫", "population": 38928346, "area_km2": 652230},
    {"code": "IDN", "name_ar": "إندونيسيا", "name_en": "Indonesia", "continent": "آسيا", "region": "جنوب شرق آسيا", "capital_ar": "جاكرتا", "capital_en": "Jakarta", "flag_emoji": "🇮🇩", "population": 273523615, "area_km2": 1904569},
    {"code": "MYS", "name_ar": "ماليزيا", "name_en": "Malaysia", "continent": "آسيا", "region": "جنوب شرق آسيا", "capital_ar": "كوالالمبور", "capital_en": "Kuala Lumpur", "flag_emoji": "🇲🇾", "population": 32365999, "area_km2": 330803},
    {"code": "THA", "name_ar": "تايلاند", "name_en": "Thailand", "continent": "آسيا", "region": "جنوب شرق آسيا", "capital_ar": "بانكوك", "capital_en": "Bangkok", "flag_emoji": "🇹🇭", "population": 69799978, "area_km2": 513120},
    {"code": "VNM", "name_ar": "فيتنام", "name_en": "Vietnam", "continent": "آسيا", "region": "جنوب شرق آسيا", "capital_ar": "هانوي", "capital_en": "Hanoi", "flag_emoji": "🇻🇳", "population": 97338579, "area_km2": 331212},
    {"code": "PHL", "name_ar": "الفلبين", "name_en": "Philippines", "continent": "آسيا", "region": "جنوب شرق آسيا", "capital_ar": "مانيلا", "capital_en": "Manila", "flag_emoji": "🇵🇭", "population": 109581078, "area_km2": 300000},

    # Americas
    {"code": "USA", "name_ar": "الولايات المتحدة", "name_en": "United States", "continent": "أمريكا الشمالية", "region": "أمريكا الشمالية", "capital_ar": "واشنطن", "capital_en": "Washington D.C.", "flag_emoji": "🇺🇸", "population": 331002651, "area_km2": 9833520},
    {"code": "CAN", "name_ar": "كندا", "name_en": "Canada", "continent": "أمريكا الشمالية", "region": "أمريكا الشمالية", "capital_ar": "أوتاوا", "capital_en": "Ottawa", "flag_emoji": "🇨🇦", "population": 37742154, "area_km2": 9984670},
    {"code": "MEX", "name_ar": "المكسيك", "name_en": "Mexico", "continent": "أمريكا الشمالية", "region": "أمريكا الوسطى", "capital_ar": "مكسيكو سيتي", "capital_en": "Mexico City", "flag_emoji": "🇲🇽", "population": 128932753, "area_km2": 1964375},
    {"code": "BRA", "name_ar": "البرازيل", "name_en": "Brazil", "continent": "أمريكا الجنوبية", "region": "أمريكا الجنوبية", "capital_ar": "برازيليا", "capital_en": "Brasília", "flag_emoji": "🇧🇷", "population": 212559417, "area_km2": 8515767},
    {"code": "ARG", "name_ar": "الأرجنتين", "name_en": "Argentina", "continent": "أمريكا الجنوبية", "region": "أمريكا الجنوبية", "capital_ar": "بوينس آيرس", "capital_en": "Buenos Aires", "flag_emoji": "🇦🇷", "population": 45195774, "area_km2": 2780400},
    {"code": "CHL", "name_ar": "تشيلي", "name_en": "Chile", "continent": "أمريكا الجنوبية", "region": "أمريكا الجنوبية", "capital_ar": "سانتياغو", "capital_en": "Santiago", "flag_emoji": "🇨🇱", "population": 19116201, "area_km2": 756102},
    {"code": "COL", "name_ar": "كولومبيا", "name_en": "Colombia", "continent": "أمريكا الجنوبية", "region": "أمريكا الجنوبية", "capital_ar": "بوغوتا", "capital_en": "Bogotá", "flag_emoji": "🇨🇴", "population": 50882891, "area_km2": 1141748},
    {"code": "PER", "name_ar": "بيرو", "name_en": "Peru", "continent": "أمريكا الجنوبية", "region": "أمريكا الجنوبية", "capital_ar": "ليما", "capital_en": "Lima", "flag_emoji": "🇵🇪", "population": 32971854, "area_km2": 1285216},

    # Africa
    {"code": "NGA", "name_ar": "نيجيريا", "name_en": "Nigeria", "continent": "أفريقيا", "region": "غرب أفريقيا", "capital_ar": "أبوجا", "capital_en": "Abuja", "flag_emoji": "🇳🇬", "population": 206139589, "area_km2": 923768},
    {"code": "ZAF", "name_ar": "جنوب أفريقيا", "name_en": "South Africa", "continent": "أفريقيا", "region": "جنوب أفريقيا", "capital_ar": "بريتوريا", "capital_en": "Pretoria", "flag_emoji": "🇿🇦", "population": 59308690, "area_km2": 1221037},
    {"code": "KEN", "name_ar": "كينيا", "name_en": "Kenya", "continent": "أفريقيا", "region": "شرق أفريقيا", "capital_ar": "نيروبي", "capital_en": "Nairobi", "flag_emoji": "🇰🇪", "population": 53771296, "area_km2": 580367},
    {"code": "ETH", "name_ar": "إثيوبيا", "name_en": "Ethiopia", "continent": "أفريقيا", "region": "شرق أفريقيا", "capital_ar": "أديس أبابا", "capital_en": "Addis Ababa", "flag_emoji": "🇪🇹", "population": 114963588, "area_km2": 1104300},
    {"code": "GHA", "name_ar": "غانا", "name_en": "Ghana", "continent": "أفريقيا", "region": "غرب أفريقيا", "capital_ar": "أكرا", "capital_en": "Accra", "flag_emoji": "🇬🇭", "population": 31072940, "area_km2": 238533},

    # Oceania
    {"code": "AUS", "name_ar": "أستراليا", "name_en": "Australia", "continent": "أوقيانوسيا", "region": "أوقيانوسيا", "capital_ar": "كانبيرا", "capital_en": "Canberra", "flag_emoji": "🇦🇺", "population": 25499884, "area_km2": 7692024},
    {"code": "NZL", "name_ar": "نيوزيلندا", "name_en": "New Zealand", "continent": "أوقيانوسيا", "region": "أوقيانوسيا", "capital_ar": "ويلينغتون", "capital_en": "Wellington", "flag_emoji": "🇳🇿", "population": 4822233, "area_km2": 268021},
]

# ============================================
# BORDER DATA (Country adjacency)
# ============================================

BORDERS_DATA = [
    # Middle East
    ("SAU", "JOR"), ("SAU", "IRQ"), ("SAU", "KWT"), ("SAU", "QAT"), ("SAU", "ARE"), ("SAU", "OMN"), ("SAU", "YEM"),
    ("JOR", "SYR"), ("JOR", "IRQ"), ("JOR", "PSE"),
    ("SYR", "LBN"), ("SYR", "TUR"), ("SYR", "IRQ"),
    ("LBN", "PSE"),
    ("IRQ", "TUR"), ("IRQ", "IRN"), ("IRQ", "KWT"),
    ("IRN", "TUR"), ("IRN", "PAK"), ("IRN", "AFG"),
    ("ARE", "OMN"),
    ("YEM", "OMN"),

    # North Africa
    ("EGY", "LBY"), ("EGY", "SDN"), ("EGY", "PSE"),
    ("LBY", "TUN"), ("LBY", "DZA"), ("LBY", "SDN"), ("LBY", "TCD"), ("LBY", "NER"),
    ("TUN", "DZA"),
    ("DZA", "MAR"), ("DZA", "MRT"), ("DZA", "MLI"), ("DZA", "NER"),
    ("MAR", "MRT"),
    ("SDN", "ETH"), ("SDN", "ERI"), ("SDN", "TCD"), ("SDN", "CAF"), ("SDN", "SSD"),

    # Europe
    ("FRA", "DEU"), ("FRA", "ITA"), ("FRA", "ESP"), ("FRA", "BEL"), ("FRA", "CHE"),
    ("DEU", "NLD"), ("DEU", "BEL"), ("DEU", "CHE"), ("DEU", "AUT"), ("DEU", "POL"), ("DEU", "CZE"),
    ("ITA", "CHE"), ("ITA", "AUT"),
    ("ESP", "PRT"),
    ("NLD", "BEL"),
    ("CHE", "AUT"),
    ("AUT", "CZE"),
    ("POL", "CZE"), ("POL", "RUS"),
    ("GRC", "TUR"),
    ("TUR", "GRC"),

    # Asia
    ("CHN", "RUS"), ("CHN", "IND"), ("CHN", "PAK"), ("CHN", "AFG"), ("CHN", "KOR"), ("CHN", "VNM"), ("CHN", "MYS"),
    ("IND", "PAK"), ("IND", "AFG"),
    ("PAK", "AFG"),
    ("THA", "MYS"), ("THA", "VNM"),
    ("VNM", "THA"),

    # Americas
    ("USA", "CAN"), ("USA", "MEX"),
    ("MEX", "USA"),
    ("BRA", "ARG"), ("BRA", "COL"), ("BRA", "PER"),
    ("ARG", "CHL"), ("ARG", "PER"),
    ("CHL", "PER"),
    ("COL", "PER"),

    # Africa
    ("NGA", "GHA"),
    ("KEN", "ETH"), ("KEN", "SOM"),
    ("ETH", "SOM"), ("ETH", "DJI"), ("ETH", "ERI"),
    ("SOM", "DJI"),
]

# ============================================
# QUESTIONS DATA (Sample - 100+ questions)
# ============================================

QUESTIONS_DATA = [
    # Capitals - Easy
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة مصر؟", "correct_answer": "القاهرة", "options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"], "tags": ["arab_world", "africa"]},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة السعودية؟", "correct_answer": "الرياض", "options": ["الرياض", "جدة", "مكة", "المدينة"], "tags": ["arab_world", "asia"]},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة فرنسا؟", "correct_answer": "باريس", "options": ["باريس", "مارسيليا", "ليون", "نيس"], "tags": ["europe"]},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة اليابان؟", "correct_answer": "طوكيو", "options": ["طوكيو", "أوساكا", "كيوتو", "يوكوهاما"], "tags": ["asia"]},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة الإمارات؟", "correct_answer": "أبوظبي", "options": ["أبوظبي", "دبي", "الشارقة", "العين"], "tags": ["arab_world", "asia"]},

    # Capitals - Medium
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة أستراليا؟", "correct_answer": "كانبيرا", "options": ["كانبيرا", "سيدني", "ملبورن", "بريزبن"], "tags": ["oceania"]},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة كندا؟", "correct_answer": "أوتاوا", "options": ["أوتاوا", "تورونتو", "مونتريال", "فانكوفر"], "tags": ["north_america"]},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة البرازيل؟", "correct_answer": "برازيليا", "options": ["برازيليا", "ريو دي جانيرو", "ساو باولو", "سلفادور"], "tags": ["south_america"]},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة تركيا؟", "correct_answer": "أنقرة", "options": ["أنقرة", "إسطنبول", "إزمير", "أنطاليا"], "tags": ["asia", "europe"]},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة جنوب أفريقيا التنفيذية؟", "correct_answer": "بريتوريا", "options": ["بريتوريا", "كيب تاون", "جوهانسبرغ", "ديربان"], "tags": ["africa"]},

    # Capitals - Hard
    {"category": "capitals", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة ميانمار؟", "correct_answer": "نايبيداو", "options": ["نايبيداو", "يانغون", "ماندالاي", "باغان"], "tags": ["asia"]},
    {"category": "capitals", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "ما هي عاصمة سريلانكا؟", "correct_answer": "سري جاياواردنابورا كوتي", "options": ["سري جاياواردنابورا كوتي", "كولومبو", "كاندي", "جالي"], "tags": ["asia"]},

    # Capitals - Autocomplete
    {"category": "capitals", "difficulty": "easy", "question_type": "autocomplete", "question_ar": "ما هي عاصمة لبنان؟", "correct_answer": "بيروت", "hint": "تبدأ بحرف الباء", "tags": ["arab_world", "asia"]},
    {"category": "capitals", "difficulty": "easy", "question_type": "autocomplete", "question_ar": "ما هي عاصمة الأردن؟", "correct_answer": "عمّان", "hint": "تبدأ بحرف العين", "tags": ["arab_world", "asia"]},
    {"category": "capitals", "difficulty": "medium", "question_type": "autocomplete", "question_ar": "ما هي عاصمة المغرب؟", "correct_answer": "الرباط", "hint": "ليست الدار البيضاء", "tags": ["arab_world", "africa"]},

    # Flags
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "لأي دولة ينتمي هذا العلم؟ 🇪🇬", "correct_answer": "مصر", "options": ["مصر", "العراق", "سوريا", "اليمن"], "tags": ["arab_world"]},
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "لأي دولة ينتمي هذا العلم؟ 🇸🇦", "correct_answer": "السعودية", "options": ["السعودية", "الإمارات", "الكويت", "قطر"], "tags": ["arab_world"]},
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "لأي دولة ينتمي هذا العلم؟ 🇯🇵", "correct_answer": "اليابان", "options": ["اليابان", "الصين", "كوريا الجنوبية", "تايوان"], "tags": ["asia"]},
    {"category": "flags", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "لأي دولة ينتمي هذا العلم؟ 🇮🇩", "correct_answer": "إندونيسيا", "options": ["إندونيسيا", "بولندا", "موناكو", "سنغافورة"], "tags": ["asia"]},
    {"category": "flags", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "لأي دولة ينتمي هذا العلم؟ 🇷🇴", "correct_answer": "رومانيا", "options": ["رومانيا", "تشاد", "مولدوفا", "أندورا"], "tags": ["europe"]},

    # Landmarks
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "أين يقع برج إيفل؟", "correct_answer": "فرنسا", "options": ["فرنسا", "إيطاليا", "إسبانيا", "ألمانيا"], "tags": ["europe", "famous"]},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "أين تقع الأهرامات الثلاثة؟", "correct_answer": "مصر", "options": ["مصر", "السودان", "المكسيك", "بيرو"], "tags": ["arab_world", "africa", "famous"]},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "أين يقع تاج محل؟", "correct_answer": "الهند", "options": ["الهند", "باكستان", "بنغلاديش", "إيران"], "tags": ["asia", "famous"]},
    {"category": "landmarks", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أين يقع برج خليفة؟", "correct_answer": "الإمارات", "options": ["الإمارات", "السعودية", "قطر", "الكويت"], "tags": ["arab_world", "asia"]},
    {"category": "landmarks", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أين يقع الكولوسيوم؟", "correct_answer": "إيطاليا", "options": ["إيطاليا", "اليونان", "إسبانيا", "تركيا"], "tags": ["europe", "famous"]},
    {"category": "landmarks", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "أين تقع مدينة البتراء؟", "correct_answer": "الأردن", "options": ["الأردن", "سوريا", "لبنان", "فلسطين"], "tags": ["arab_world", "famous"]},

    # Geography
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هو أطول نهر في العالم؟", "correct_answer": "النيل", "options": ["النيل", "الأمازون", "المسيسيبي", "اليانغتسي"], "tags": ["rivers", "famous"]},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي أكبر قارة في العالم؟", "correct_answer": "آسيا", "options": ["آسيا", "أفريقيا", "أمريكا الشمالية", "أوروبا"], "tags": ["continents"]},
    {"category": "geography", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي أكبر دولة في العالم من حيث المساحة؟", "correct_answer": "روسيا", "options": ["روسيا", "كندا", "الصين", "الولايات المتحدة"], "tags": ["countries", "facts"]},
    {"category": "geography", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هو أعلى جبل في العالم؟", "correct_answer": "إيفرست", "options": ["إيفرست", "كي 2", "كانشينجونغا", "لوتسي"], "tags": ["mountains", "famous"]},
    {"category": "geography", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "ما هي أعمق نقطة في المحيطات؟", "correct_answer": "خندق ماريانا", "options": ["خندق ماريانا", "خندق بورتوريكو", "خندق جاوة", "خندق الفلبين"], "tags": ["oceans"]},

    # Borders
    {"category": "borders", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "كم دولة تحد السعودية؟", "correct_answer": "7", "options": ["7", "5", "6", "8"], "tags": ["arab_world"]},
    {"category": "borders", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أي من هذه الدول لا تحد مصر؟", "correct_answer": "الأردن", "options": ["الأردن", "ليبيا", "السودان", "فلسطين"], "tags": ["arab_world"]},
    {"category": "borders", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أي دولة تحد فرنسا وألمانيا وإيطاليا؟", "correct_answer": "سويسرا", "options": ["سويسرا", "النمسا", "بلجيكا", "لوكسمبورغ"], "tags": ["europe"]},
    {"category": "borders", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "كم دولة تحد الصين؟", "correct_answer": "14", "options": ["14", "12", "16", "10"], "tags": ["asia"]},

    # Population
    {"category": "population", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي أكبر دولة عربية من حيث السكان؟", "correct_answer": "مصر", "options": ["مصر", "السعودية", "العراق", "الجزائر"], "tags": ["arab_world"]},
    {"category": "population", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أي دولة لديها أكبر عدد سكان في العالم؟", "correct_answer": "الصين", "options": ["الصين", "الهند", "الولايات المتحدة", "إندونيسيا"], "tags": ["asia", "facts"]},
    {"category": "population", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "ما ترتيب اليابان من حيث عدد السكان عالمياً؟", "correct_answer": "11", "options": ["11", "8", "10", "13"], "tags": ["asia"]},

    # Arab World Special
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "كم عدد الدول العربية؟", "correct_answer": "22", "options": ["22", "20", "24", "18"], "tags": ["arab_world", "facts"]},
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "ما هي أكبر دولة عربية مساحة؟", "correct_answer": "الجزائر", "options": ["الجزائر", "السعودية", "السودان", "ليبيا"], "tags": ["arab_world"]},
    {"category": "arab_world", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أي دولة عربية ليس لها منفذ بحري؟", "correct_answer": "لا يوجد", "options": ["لا يوجد", "الأردن", "العراق", "السودان"], "hint": "جميع الدول العربية لها منافذ بحرية", "tags": ["arab_world"]},
    {"category": "arab_world", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "ما هي أصغر دولة عربية مساحة؟", "correct_answer": "البحرين", "options": ["البحرين", "قطر", "لبنان", "الكويت"], "tags": ["arab_world"]},
    {"category": "arab_world", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "ما هي الدولة العربية التي تقع في قارتين؟", "correct_answer": "مصر", "options": ["مصر", "المغرب", "السودان", "لا يوجد"], "hint": "سيناء في آسيا", "tags": ["arab_world"]},

    # Attractions
    {"category": "attractions", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "في أي مدينة توجد ساعة بيج بن؟", "correct_answer": "لندن", "options": ["لندن", "باريس", "نيويورك", "طوكيو"], "tags": ["europe", "famous"]},
    {"category": "attractions", "difficulty": "easy", "question_type": "multiple_choice", "question_ar": "أين يقع تمثال الحرية؟", "correct_answer": "نيويورك", "options": ["نيويورك", "واشنطن", "لوس أنجلوس", "شيكاغو"], "tags": ["north_america", "famous"]},
    {"category": "attractions", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أين تقع أوبرا سيدني؟", "correct_answer": "أستراليا", "options": ["أستراليا", "نيوزيلندا", "بريطانيا", "كندا"], "tags": ["oceania", "famous"]},
    {"category": "attractions", "difficulty": "medium", "question_type": "multiple_choice", "question_ar": "أين يقع المسجد الأقصى؟", "correct_answer": "فلسطين", "options": ["فلسطين", "الأردن", "السعودية", "سوريا"], "tags": ["arab_world", "religious"]},
    {"category": "attractions", "difficulty": "hard", "question_type": "multiple_choice", "question_ar": "أين تقع مدينة ماتشو بيتشو؟", "correct_answer": "بيرو", "options": ["بيرو", "تشيلي", "بوليفيا", "الإكوادور"], "tags": ["south_america", "famous"]},
]

# ============================================
# ACHIEVEMENTS DATA
# ============================================

ACHIEVEMENTS_DATA = [
    # Games achievements
    {"code": "first_win", "name_ar": "الفوز الأول", "name_en": "First Win", "description_ar": "أكمل أول تحدٍ يومي بنجاح", "description_en": "Complete your first daily challenge", "icon": "🏆", "category": "games", "requirement": {"type": "games_won", "count": 1}, "points": 10},
    {"code": "win_10", "name_ar": "عشرة انتصارات", "name_en": "Ten Victories", "description_ar": "أكمل 10 تحديات يومية بنجاح", "description_en": "Complete 10 daily challenges", "icon": "🎯", "category": "games", "requirement": {"type": "games_won", "count": 10}, "points": 50},
    {"code": "win_50", "name_ar": "خمسون فوزاً", "name_en": "Fifty Wins", "description_ar": "أكمل 50 تحدٍ يومي بنجاح", "description_en": "Complete 50 daily challenges", "icon": "⭐", "category": "games", "requirement": {"type": "games_won", "count": 50}, "points": 200},
    {"code": "win_100", "name_ar": "مئة انتصار", "name_en": "Century", "description_ar": "أكمل 100 تحدٍ يومي بنجاح", "description_en": "Complete 100 daily challenges", "icon": "💯", "category": "games", "requirement": {"type": "games_won", "count": 100}, "points": 500},
    {"code": "perfect_game", "name_ar": "لعبة مثالية", "name_en": "Perfect Game", "description_ar": "أكمل تحدٍ بأقل عدد من المحاولات", "description_en": "Complete a challenge with minimum guesses", "icon": "💎", "category": "games", "requirement": {"type": "perfect_game", "count": 1}, "points": 100},
    {"code": "no_hints", "name_ar": "بدون تلميحات", "name_en": "No Hints", "description_ar": "أكمل 5 تحديات بدون استخدام تلميحات", "description_en": "Complete 5 challenges without using hints", "icon": "🧠", "category": "games", "requirement": {"type": "no_hints", "games": 5}, "points": 150},

    # Streak achievements
    {"code": "streak_3", "name_ar": "ثلاثة أيام متتالية", "name_en": "Three Day Streak", "description_ar": "حافظ على سلسلة فوز لمدة 3 أيام", "description_en": "Maintain a 3-day winning streak", "icon": "🔥", "category": "streak", "requirement": {"type": "streak", "days": 3}, "points": 30},
    {"code": "streak_7", "name_ar": "أسبوع كامل", "name_en": "Week Warrior", "description_ar": "حافظ على سلسلة فوز لمدة 7 أيام", "description_en": "Maintain a 7-day winning streak", "icon": "📅", "category": "streak", "requirement": {"type": "streak", "days": 7}, "points": 100},
    {"code": "streak_30", "name_ar": "شهر كامل", "name_en": "Month Master", "description_ar": "حافظ على سلسلة فوز لمدة 30 يوماً", "description_en": "Maintain a 30-day winning streak", "icon": "🌟", "category": "streak", "requirement": {"type": "streak", "days": 30}, "points": 500},
    {"code": "streak_100", "name_ar": "مئة يوم", "name_en": "Centurion", "description_ar": "حافظ على سلسلة فوز لمدة 100 يوم", "description_en": "Maintain a 100-day winning streak", "icon": "👑", "category": "streak", "requirement": {"type": "streak", "days": 100}, "points": 2000},

    # Quiz achievements
    {"code": "quiz_10", "name_ar": "عشرة أسئلة", "name_en": "Ten Questions", "description_ar": "أجب على 10 أسئلة بشكل صحيح", "description_en": "Answer 10 questions correctly", "icon": "❓", "category": "quiz", "requirement": {"type": "correct_answers", "count": 10}, "points": 20},
    {"code": "quiz_100", "name_ar": "مئة سؤال", "name_en": "Quiz Master", "description_ar": "أجب على 100 سؤال بشكل صحيح", "description_en": "Answer 100 questions correctly", "icon": "📚", "category": "quiz", "requirement": {"type": "correct_answers", "count": 100}, "points": 200},
    {"code": "quiz_1000", "name_ar": "ألف سؤال", "name_en": "Knowledge King", "description_ar": "أجب على 1000 سؤال بشكل صحيح", "description_en": "Answer 1000 questions correctly", "icon": "🎓", "category": "quiz", "requirement": {"type": "correct_answers", "count": 1000}, "points": 1000},
    {"code": "quiz_perfect_10", "name_ar": "عشرة متتالية", "name_en": "Perfect Ten", "description_ar": "أجب على 10 أسئلة متتالية بشكل صحيح", "description_en": "Answer 10 consecutive questions correctly", "icon": "🎯", "category": "quiz", "requirement": {"type": "consecutive_correct", "count": 10}, "points": 100},

    # Special achievements
    {"code": "early_adopter", "name_ar": "من الأوائل", "name_en": "Early Adopter", "description_ar": "انضممت إلى رحال في أول 1000 مستخدم", "description_en": "Joined Rahal in the first 1000 users", "icon": "🚀", "category": "special", "requirement": {"type": "user_number", "max": 1000}, "points": 100},
    {"code": "arab_expert", "name_ar": "خبير العالم العربي", "name_en": "Arab World Expert", "description_ar": "أجب على 50 سؤالاً عن العالم العربي بشكل صحيح", "description_en": "Answer 50 Arab World questions correctly", "icon": "🌙", "category": "special", "requirement": {"type": "category_correct", "category": "arab_world", "count": 50}, "points": 200},
    {"code": "geography_master", "name_ar": "سيد الجغرافيا", "name_en": "Geography Master", "description_ar": "أجب على أسئلة من جميع الفئات", "description_en": "Answer questions from all categories", "icon": "🌍", "category": "special", "requirement": {"type": "all_categories"}, "points": 300},
    {"code": "world_traveler", "name_ar": "رحّال العالم", "name_en": "World Traveler", "description_ar": "استخدم جميع القارات في التحديات", "description_en": "Use all continents in challenges", "icon": "✈️", "category": "special", "requirement": {"type": "all_continents"}, "points": 250},
]


async def seed_countries(session: AsyncSession) -> dict[str, UUID]:
    """Seed countries and return a mapping of code to ID."""
    print("Seeding countries...")
    country_map = {}

    for country_data in COUNTRIES_DATA:
        # Check if country already exists
        result = await session.execute(
            select(Country).where(Country.code == country_data["code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            country_map[country_data["code"]] = existing.id
            continue

        country = Country(
            code=country_data["code"],
            name_ar=country_data["name_ar"],
            name_en=country_data["name_en"],
            name_ar_normalized=normalize_arabic(country_data["name_ar"]),
            continent=country_data.get("continent"),
            region=country_data.get("region"),
            population=country_data.get("population"),
            area_km2=country_data.get("area_km2"),
            capital_ar=country_data.get("capital_ar"),
            capital_en=country_data.get("capital_en"),
            flag_emoji=country_data.get("flag_emoji"),
        )
        session.add(country)
        await session.flush()
        country_map[country_data["code"]] = country.id

    await session.commit()
    print(f"Seeded {len(country_map)} countries")
    return country_map


async def seed_borders(session: AsyncSession, country_map: dict[str, UUID]) -> None:
    """Seed border connections between countries."""
    print("Seeding borders...")
    count = 0

    for code_a, code_b in BORDERS_DATA:
        if code_a not in country_map or code_b not in country_map:
            print(f"Skipping border {code_a}-{code_b}: country not found")
            continue

        id_a, id_b = country_map[code_a], country_map[code_b]

        # Ensure consistent ordering (smaller UUID first)
        if str(id_a) > str(id_b):
            id_a, id_b = id_b, id_a

        # Check if border already exists
        result = await session.execute(
            select(Border).where(
                Border.country_a_id == id_a,
                Border.country_b_id == id_b
            )
        )
        if result.scalar_one_or_none():
            continue

        border = Border(
            country_a_id=id_a,
            country_b_id=id_b,
            border_type="land"
        )
        session.add(border)
        count += 1

    await session.commit()
    print(f"Seeded {count} borders")


async def seed_questions(session: AsyncSession) -> None:
    """Seed quiz questions."""
    print("Seeding questions...")
    count = 0

    for q_data in QUESTIONS_DATA:
        # Check if question already exists (by question text)
        result = await session.execute(
            select(Question).where(Question.question_ar == q_data["question_ar"])
        )
        if result.scalar_one_or_none():
            continue

        question = Question(
            category=q_data["category"],
            difficulty=q_data["difficulty"],
            question_type=q_data["question_type"],
            question_ar=q_data["question_ar"],
            correct_answer=q_data["correct_answer"],
            correct_answer_normalized=normalize_arabic(q_data["correct_answer"]),
            options=q_data.get("options"),
            hint=q_data.get("hint"),
            image_url=q_data.get("image_url"),
            tags=q_data.get("tags", []),
            is_active=True
        )
        session.add(question)
        count += 1

    await session.commit()
    print(f"Seeded {count} questions")


async def seed_achievements(session: AsyncSession) -> None:
    """Seed achievements."""
    print("Seeding achievements...")
    count = 0

    for ach_data in ACHIEVEMENTS_DATA:
        # Check if achievement already exists
        result = await session.execute(
            select(Achievement).where(Achievement.code == ach_data["code"])
        )
        if result.scalar_one_or_none():
            continue

        achievement = Achievement(
            code=ach_data["code"],
            name_ar=ach_data["name_ar"],
            name_en=ach_data["name_en"],
            description_ar=ach_data.get("description_ar"),
            description_en=ach_data.get("description_en"),
            icon=ach_data.get("icon"),
            category=ach_data.get("category"),
            requirement=ach_data.get("requirement"),
            points=ach_data.get("points", 0)
        )
        session.add(achievement)
        count += 1

    await session.commit()
    print(f"Seeded {count} achievements")


async def seed_sample_challenges(session: AsyncSession, country_map: dict[str, UUID]) -> None:
    """Seed sample daily challenges for testing."""
    print("Seeding sample daily challenges...")

    # Sample challenges (start_code, end_code, shortest_path)
    challenges = [
        ("SAU", "EGY", 2),  # Saudi Arabia → Jordan → Egypt (or via Israel/Palestine)
        ("FRA", "ITA", 1),  # France → Italy (direct border)
        ("DEU", "ESP", 2),  # Germany → France → Spain
        ("JPN", "KOR", 2),  # Japan → China → South Korea (sea route conceptual)
        ("BRA", "ARG", 1),  # Brazil → Argentina
        ("EGY", "MAR", 3),  # Egypt → Libya → Tunisia → Algeria → Morocco
        ("USA", "MEX", 1),  # USA → Mexico
        ("TUR", "IRN", 1),  # Turkey → Iran
    ]

    today = date.today()
    count = 0

    for i, (start_code, end_code, shortest) in enumerate(challenges):
        challenge_date = today + timedelta(days=i)

        if start_code not in country_map or end_code not in country_map:
            continue

        # Check if challenge already exists for this date
        result = await session.execute(
            select(DailyChallenge).where(DailyChallenge.challenge_date == challenge_date)
        )
        if result.scalar_one_or_none():
            continue

        challenge = DailyChallenge(
            challenge_date=challenge_date,
            start_country_id=country_map[start_code],
            end_country_id=country_map[end_code],
            shortest_path=shortest,
            solution_path=None  # To be computed by path finder
        )
        session.add(challenge)
        count += 1

    await session.commit()
    print(f"Seeded {count} daily challenges")


async def main():
    """Main seeding function."""
    print("=" * 50)
    print("Rahal Database Seeding Script")
    print("=" * 50)

    async with async_session() as session:
        # Seed in order of dependencies
        country_map = await seed_countries(session)
        await seed_borders(session, country_map)
        await seed_questions(session)
        await seed_achievements(session)
        await seed_sample_challenges(session, country_map)

    print("=" * 50)
    print("Seeding complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
```

### 8.2 Running the Seeding Script

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies (if not already done)
uv sync

# Run migrations first
alembic upgrade head

# Run seeding script
python ../scripts/seed_database.py

# Or run specific seeders
python -c "from scripts.seed_database import *; asyncio.run(seed_countries_only())"
```

---

## 9. Migration Strategy with Alembic

### 9.1 Alembic Setup

```bash
# Initialize Alembic (already done in project structure)
cd backend
alembic init alembic
```

### 9.2 Alembic Configuration (`alembic.ini`)

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

# Use async driver
sqlalchemy.url = driver://user:pass@localhost/dbname

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

### 9.3 Alembic Environment (`alembic/env.py`)

```python
import asyncio
from logging.config import fileConfig
import os
import sys

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.base import Base
from app.models.country import Country, Border
from app.models.question import Question
from app.models.user import Profile, Achievement, UserAchievement
from app.models.game import DailyChallenge, GameResult, QuizResult
from app.core.config import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Override sqlalchemy.url from environment
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_ASYNC)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 9.4 Common Alembic Commands

```bash
cd backend

# Create a new migration (after changing models)
alembic revision --autogenerate -m "Description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# View migration history
alembic history

# View current revision
alembic current

# Show SQL for migration without applying
alembic upgrade head --sql

# Stamp database with current revision (skip migrations)
alembic stamp head
```

### 9.5 Sample Initial Migration

```python
"""Initial schema creation

Revision ID: 001_initial
Revises:
Create Date: 2026-01-30 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # Create enum types
    op.execute("""
        CREATE TYPE question_category AS ENUM (
            'capitals', 'flags', 'landmarks', 'attractions',
            'geography', 'borders', 'population', 'arab_world'
        )
    """)
    op.execute("CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard')")
    op.execute("CREATE TYPE question_type AS ENUM ('multiple_choice', 'autocomplete')")
    op.execute("CREATE TYPE border_type AS ENUM ('land', 'bridge', 'tunnel', 'ferry')")
    op.execute("CREATE TYPE achievement_category AS ENUM ('games', 'quiz', 'streak', 'special')")

    # Create countries table
    op.create_table(
        'countries',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('code', sa.String(3), unique=True, nullable=False),
        sa.Column('name_ar', sa.String(100), nullable=False),
        sa.Column('name_en', sa.String(100), nullable=False),
        sa.Column('name_ar_normalized', sa.String(100), nullable=False),
        sa.Column('continent', sa.String(50)),
        sa.Column('region', sa.String(100)),
        sa.Column('population', sa.BigInteger),
        sa.Column('area_km2', sa.Numeric(12, 2)),
        sa.Column('capital_ar', sa.String(100)),
        sa.Column('capital_en', sa.String(100)),
        sa.Column('flag_emoji', sa.String(10)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )

    # Continue with other tables...
    # (Full migration would include all tables from the SQL script)


def downgrade() -> None:
    op.drop_table('user_achievements')
    op.drop_table('achievements')
    op.drop_table('quiz_results')
    op.drop_table('game_results')
    op.drop_table('profiles')
    op.drop_table('questions')
    op.drop_table('daily_challenges')
    op.drop_table('borders')
    op.drop_table('countries')

    op.execute('DROP TYPE achievement_category')
    op.execute('DROP TYPE border_type')
    op.execute('DROP TYPE question_type')
    op.execute('DROP TYPE question_difficulty')
    op.execute('DROP TYPE question_category')
```

---

## 10. Database Utilities

### 10.1 Backup Script

```bash
#!/bin/bash
# scripts/backup_database.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rahal_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# For local Supabase
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"
```

### 10.2 Reset Script

```bash
#!/bin/bash
# scripts/reset_database.sh

echo "Resetting Supabase database..."
npx supabase db reset

echo "Running migrations..."
cd backend && alembic upgrade head

echo "Seeding data..."
python ../scripts/seed_database.py

echo "Database reset complete!"
```

---

## Appendix A: Full Countries List

The full list of 197 countries should be maintained in `data/countries.json`. The seeding script includes a representative sample. For production, import the complete dataset from:
- ISO 3166-1 official list
- UN member states list
- Arabic translations from authoritative sources

## Appendix B: Border Data Sources

Border connections should be verified against:
- OpenStreetMap border relations
- CIA World Factbook
- Natural Earth dataset

Special connections to consider:
- Egypt-Saudi Arabia (King Salman Bridge - planned)
- UK-France (Channel Tunnel)
- Denmark-Sweden (Øresund Bridge)
- Malaysia-Singapore (causeways)

---

**Document Status:** Complete
**Next Steps:** Implement backend-design.md

-- Rahal (رحال) Initial Database Schema
-- This migration creates the complete database schema for the Rahal geography game

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- COUNTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ar_normalized VARCHAR(100) NOT NULL,
    continent VARCHAR(50),
    region VARCHAR(50),
    population BIGINT,
    area_km2 INTEGER,
    capital_ar VARCHAR(100),
    capital_en VARCHAR(100),
    flag_emoji VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for countries
CREATE INDEX IF NOT EXISTS idx_countries_name_ar_trgm ON countries USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_countries_name_ar_normalized_trgm ON countries USING gin (name_ar_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries (code);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries (continent);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries (region);

-- ============================================
-- BORDERS TABLE (Graph edges)
-- ============================================
CREATE TABLE IF NOT EXISTS borders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_a_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    country_b_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    border_type VARCHAR(20) DEFAULT 'land' CHECK (border_type IN ('land', 'maritime', 'both')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT borders_unique UNIQUE (country_a_id, country_b_id),
    CONSTRAINT borders_order CHECK (country_a_id < country_b_id)
);

-- Indexes for borders (for graph traversal)
CREATE INDEX IF NOT EXISTS idx_borders_country_a ON borders (country_a_id);
CREATE INDEX IF NOT EXISTS idx_borders_country_b ON borders (country_b_id);

-- ============================================
-- QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('multiple_choice', 'autocomplete', 'true_false')),
    question_ar TEXT NOT NULL,
    question_en TEXT,
    correct_answer VARCHAR(200) NOT NULL,
    correct_answer_normalized VARCHAR(200) NOT NULL,
    options JSONB,
    hint TEXT,
    image_url VARCHAR(500),
    country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    times_shown INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions (category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (question_type);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_questions_country ON questions (country_id);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING gin (tags);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(10),
    category VARCHAR(50),
    points INTEGER DEFAULT 0,
    requirement JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements (code);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements (category);

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,  -- References Supabase auth.users
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_played_date DATE,
    quiz_correct INTEGER DEFAULT 0,
    quiz_total INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{"theme": "light", "language": "ar", "notifications": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON profiles (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles (current_streak DESC);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_achievements_unique UNIQUE (profile_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_profile ON user_achievements (profile_id);

-- ============================================
-- DAILY CHALLENGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE UNIQUE NOT NULL,
    start_country_id UUID NOT NULL REFERENCES countries(id),
    end_country_id UUID NOT NULL REFERENCES countries(id),
    shortest_path INTEGER NOT NULL,
    hint_countries UUID[] DEFAULT '{}',
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges (challenge_date DESC);

-- ============================================
-- GAME RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    guesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_guesses INTEGER NOT NULL,
    hints_used INTEGER DEFAULT 0,
    score INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_results_profile ON game_results (profile_id);
CREATE INDEX IF NOT EXISTS idx_game_results_challenge ON game_results (challenge_id);
CREATE INDEX IF NOT EXISTS idx_game_results_score ON game_results (score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_results_profile_challenge ON game_results (profile_id, challenge_id) WHERE profile_id IS NOT NULL;

-- ============================================
-- QUIZ RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    category VARCHAR(50),
    difficulty VARCHAR(20),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score INTEGER NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_profile ON quiz_results (profile_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_session ON quiz_results (session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_category ON quiz_results (category);

-- ============================================
-- DAILY QUIZ TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_date DATE UNIQUE NOT NULL,
    questions UUID[] NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_quizzes_date ON daily_quizzes (quiz_date DESC);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_results_updated_at
    BEFORE UPDATE ON game_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables with user data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "User achievements are viewable by everyone"
    ON user_achievements FOR SELECT
    USING (true);

CREATE POLICY "System can insert user achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Game results policies
CREATE POLICY "Users can view all game results"
    ON game_results FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own game results"
    ON game_results FOR INSERT
    WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own game results"
    ON game_results FOR UPDATE
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Quiz results policies
CREATE POLICY "Users can view all quiz results"
    ON quiz_results FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own quiz results"
    ON quiz_results FOR INSERT
    WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get neighbors of a country
CREATE OR REPLACE FUNCTION get_country_neighbors(country_uuid UUID)
RETURNS TABLE (neighbor_id UUID, neighbor_code VARCHAR, neighbor_name_ar VARCHAR, flag_emoji VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.code, c.name_ar, c.flag_emoji
    FROM countries c
    INNER JOIN borders b ON
        (b.country_a_id = country_uuid AND b.country_b_id = c.id) OR
        (b.country_b_id = country_uuid AND b.country_a_id = c.id);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate streak
CREATE OR REPLACE FUNCTION calculate_streak(p_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    last_date DATE;
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT DATE(completed_at) as play_date
        FROM game_results
        WHERE profile_id = p_profile_id AND completed = true
        ORDER BY play_date DESC
    LOOP
        IF last_date IS NULL THEN
            last_date := rec.play_date;
            current_streak := 1;
        ELSIF last_date - rec.play_date = 1 THEN
            current_streak := current_streak + 1;
            last_date := rec.play_date;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for anonymous users on public tables
GRANT SELECT ON countries TO anon;
GRANT SELECT ON borders TO anon;
GRANT SELECT ON questions TO anon;
GRANT SELECT ON achievements TO anon;
GRANT SELECT ON daily_challenges TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON user_achievements TO anon;
GRANT SELECT ON game_results TO anon;
GRANT SELECT ON quiz_results TO anon;
GRANT SELECT ON daily_quizzes TO anon;

-- Grant permissions for authenticated users
GRANT ALL ON countries TO authenticated;
GRANT ALL ON borders TO authenticated;
GRANT ALL ON questions TO authenticated;
GRANT ALL ON achievements TO authenticated;
GRANT ALL ON daily_challenges TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON game_results TO authenticated;
GRANT ALL ON quiz_results TO authenticated;
GRANT ALL ON daily_quizzes TO authenticated;

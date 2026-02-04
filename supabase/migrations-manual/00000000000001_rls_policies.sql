-- ============================================
-- Rahal (رحال) - Row Level Security Policies
-- ============================================
-- This migration sets up Row Level Security (RLS) policies
-- for application tables created by Alembic.
--
-- IMPORTANT: This migration runs AFTER Alembic creates the
-- application schema (countries, profiles, game_results, etc.)
--
-- Execution order:
-- 1. 00000000000000_supabase_setup.sql (Supabase infrastructure)
-- 2. Alembic migrations (application tables)
-- 3. THIS FILE (RLS policies)
-- ============================================

-- ============================================
-- ENABLE RLS ON USER-SPECIFIC TABLES
-- ============================================

-- Enable RLS on tables containing user-specific data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Allow everyone to view public profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to create their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- USER ACHIEVEMENTS POLICIES
-- ============================================

-- Allow everyone to view achievements
DROP POLICY IF EXISTS "User achievements are viewable by everyone" ON user_achievements;
CREATE POLICY "User achievements are viewable by everyone"
    ON user_achievements FOR SELECT
    USING (true);

-- Allow system to award achievements to authenticated users
DROP POLICY IF EXISTS "System can insert user achievements" ON user_achievements;
CREATE POLICY "System can insert user achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- GAME RESULTS POLICIES
-- ============================================

-- Allow everyone to view game results (for leaderboards)
DROP POLICY IF EXISTS "Users can view all game results" ON game_results;
CREATE POLICY "Users can view all game results"
    ON game_results FOR SELECT
    USING (true);

-- Allow users to create their own game results
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
CREATE POLICY "Users can insert own game results"
    ON game_results FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Allow users to update their own game results
DROP POLICY IF EXISTS "Users can update own game results" ON game_results;
CREATE POLICY "Users can update own game results"
    ON game_results FOR UPDATE
    USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- QUIZ RESULTS POLICIES
-- ============================================

-- Allow everyone to view quiz results (for statistics)
DROP POLICY IF EXISTS "Users can view all quiz results" ON quiz_results;
CREATE POLICY "Users can view all quiz results"
    ON quiz_results FOR SELECT
    USING (true);

-- Allow users to create their own quiz results
DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
CREATE POLICY "Users can insert own quiz results"
    ON quiz_results FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================
-- GRANT TABLE PERMISSIONS TO ROLES
-- ============================================

-- Grant SELECT permissions to anonymous users on public data
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

-- Grant full permissions to authenticated users
-- (Note: RLS policies will still restrict what users can actually access)
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

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Public profiles are viewable by everyone" ON profiles IS 
    'Allow all users to view profile information for leaderboards and social features';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
    'Users can only update their own profile data';

COMMENT ON POLICY "Users can insert own profile" ON profiles IS 
    'Users can only create their own profile on first login';

COMMENT ON POLICY "Users can view all game results" ON game_results IS 
    'Allow viewing all game results for global leaderboards and statistics';

COMMENT ON POLICY "Users can insert own game results" ON game_results IS 
    'Users can only record game results for their own profile';

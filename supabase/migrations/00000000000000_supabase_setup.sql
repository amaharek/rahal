-- ============================================
-- Rahal (رحال) - Supabase Infrastructure Setup
-- ============================================
-- This migration creates ONLY Supabase-specific infrastructure:
-- - Roles for authentication and authorization
-- - Auth schema for Supabase Auth (GoTrue)
-- - Required PostgreSQL extensions
--
-- NOTE: Application tables are created by Alembic migrations
-- in backend/alembic/versions/ and should NOT be created here.
-- ============================================

-- ============================================
-- CREATE REQUIRED ROLES
-- ============================================

-- Create supabase_admin role (required by supabase/postgres image)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
        CREATE ROLE supabase_admin WITH SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
    END IF;
END
$$;

-- Create Supabase auth admin role
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin WITH LOGIN PASSWORD 'postgres';
    END IF;
END
$$;

-- Create anonymous role (for unauthenticated access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END
$$;

-- Create authenticated role (for logged-in users)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END
$$;

-- ============================================
-- CREATE AUTH SCHEMA
-- ============================================

-- Create auth schema for Supabase Auth (GoTrue)
CREATE SCHEMA IF NOT EXISTS auth;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- ============================================
-- AUTH HELPER FUNCTIONS
-- ============================================

-- NOTE: The auth.uid() function is created by GoTrue during its migrations.
-- We do NOT create it here to avoid ownership conflicts.
-- GoTrue will create it as supabase_auth_admin, which is the correct owner.

-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================

-- UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigram matching for fuzzy text search (Arabic names)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- GRANT SCHEMA PERMISSIONS
-- ============================================

-- Grant permissions on public schema to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO supabase_auth_admin;

-- Allow roles to access sequences for auto-incrementing IDs
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO anon, authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON SCHEMA auth IS 'Supabase Auth schema for GoTrue authentication service';
COMMENT ON ROLE anon IS 'Anonymous role for unauthenticated access (read-only)';
COMMENT ON ROLE authenticated IS 'Authenticated role for logged-in users';
COMMENT ON ROLE supabase_auth_admin IS 'Supabase Auth admin role for GoTrue service';

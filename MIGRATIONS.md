# Database Migrations Guide

## Architecture Overview

Rahal uses a **hybrid database architecture**:

- **Supabase**: Authentication infrastructure (GoTrue service)
- **Alembic**: Application schema management
- **PostgreSQL**: Direct database access from FastAPI

This approach gives us:
- ✅ Managed authentication with JWT tokens (Supabase Auth)
- ✅ Full control over database schema (Alembic)
- ✅ Direct SQL access for complex queries (SQLAlchemy)
- ✅ Row Level Security for data protection (PostgreSQL RLS)

## Migration Files Structure

```
supabase/
├── migrations/                        # Auto-executed on DB initialization
│   └── 00000000000000_supabase_setup.sql
│       - Creates Supabase roles (supabase_admin, anon, authenticated)
│       - Creates auth schema for GoTrue
│       - Enables required extensions (uuid-ossp, pg_trgm)
│       - Grants basic permissions
│
└── migrations-manual/                 # Run AFTER Alembic creates tables
    └── 00000000000001_rls_policies.sql
        - Enables RLS on user-specific tables
        - Creates RLS policies (who can read/write what)
        - Grants table permissions to roles

backend/alembic/versions/              # Application schema
└── 0001_initial_schema.py
    - Creates all application tables
    - Creates triggers and functions
    - Sets up indexes
```

## Execution Order

**Critical**: Migrations MUST run in this exact order:

1. **Supabase Setup** (automatic on `docker-compose up`)
   - File: `supabase/migrations/00000000000000_supabase_setup.sql`
   - Creates: Roles, auth schema, extensions
   - Status: ✅ Auto-runs when database initializes

2. **Alembic Migrations** (manual step)
   - File: `backend/alembic/versions/0001_initial_schema.py`
   - Creates: All application tables (countries, profiles, game_results, etc.)
   - Command: `alembic upgrade head` or `docker exec rahal-backend alembic upgrade head`

3. **RLS Policies** (manual step)
   - File: `supabase/migrations-manual/00000000000001_rls_policies.sql`
   - Creates: Row Level Security policies
   - Command: `psql ... < supabase/migrations-manual/00000000000001_rls_policies.sql`
   - **Why manual?**: Tables must exist first (created by Alembic)

## Quick Setup Commands

### Docker Environment

```bash
# 1. Start services (Supabase migration runs automatically)
docker-compose up -d

# 2. Wait for database to be healthy
docker-compose ps

# 3. Run Alembic migrations
docker exec rahal-backend alembic upgrade head

# 4. Apply RLS policies
docker exec -i rahal-db psql -U postgres -d postgres < supabase/migrations-manual/00000000000001_rls_policies.sql

# 5. Seed database (optional)
docker exec rahal-backend python /app/../scripts/seed_database.py
```

### Local Development

```bash
# 1. Start only database services
docker-compose up db redis -d

# 2. Supabase migration runs automatically

# 3. Run Alembic from local backend
cd backend
alembic upgrade head

# 4. Apply RLS policies
psql -U postgres -h localhost -p 54322 -d postgres < ../supabase/migrations-manual/00000000000001_rls_policies.sql

# 5. Seed database
python ../scripts/seed_database.py
```

## Why This Architecture?

### Why Not Full Supabase?

**Full Supabase** would mean:
- ✅ Auto-managed migrations
- ❌ Limited to PostgREST API (less flexible queries)
- ❌ Less control over complex business logic
- ❌ Harder to implement graph algorithms (BFS for country paths)

### Why Not Pure Alembic?

**Pure Alembic** would mean:
- ✅ Full schema control
- ❌ Need to build auth from scratch
- ❌ Manual JWT token management
- ❌ More security vulnerabilities

### Our Hybrid Approach

**Hybrid (current)** gives us:
- ✅ Supabase Auth (battle-tested, secure)
- ✅ Direct DB access (complex queries, algorithms)
- ✅ Full SQLAlchemy ORM power
- ✅ RLS policies for data security
- ⚠️ Slightly more complex setup (but well worth it!)

## Common Issues

### Issue: "relation 'profiles' does not exist"

**Cause**: RLS migration ran before Alembic created tables

**Solution**: 
```bash
# Run Alembic first
docker exec rahal-backend alembic upgrade head

# Then apply RLS
docker exec -i rahal-db psql -U postgres -d postgres < supabase/migrations-manual/00000000000001_rls_policies.sql
```

### Issue: "role 'supabase_admin' does not exist"

**Cause**: Supabase setup migration didn't run

**Solution**:
```bash
# Reset database and restart
docker-compose down -v
docker-compose up -d
```

### Issue: "permission denied for table countries"

**Cause**: RLS policies not applied

**Solution**:
```bash
# Apply RLS manually
docker exec -i rahal-db psql -U postgres -d postgres < supabase/migrations-manual/00000000000001_rls_policies.sql
```

## Creating New Migrations

### Application Schema Changes (Alembic)

```bash
cd backend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "add new table"

# Review the generated file in alembic/versions/

# Apply migration
alembic upgrade head
```

### RLS Policy Changes

Edit `supabase/migrations-manual/00000000000001_rls_policies.sql` directly:

```sql
-- Example: Add policy for new table
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all records"
    ON new_table FOR SELECT
    USING (true);

GRANT SELECT ON new_table TO anon, authenticated;
```

Then reapply:
```bash
docker exec -i rahal-db psql -U postgres -d postgres < supabase/migrations-manual/00000000000001_rls_policies.sql
```

## Verification

After running all migrations, verify:

```bash
# Connect to database
docker exec -it rahal-db psql -U postgres

# Check roles exist
\du

# Check auth schema exists
\dn

# Check application tables exist
\dt

# Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

# Check policies exist
\d profiles
```

Expected output:
- Roles: `postgres`, `supabase_admin`, `anon`, `authenticated`, `supabase_auth_admin`
- Schemas: `public`, `auth`
- Tables: `countries`, `borders`, `questions`, `profiles`, etc.
- RLS: Enabled on `profiles`, `user_achievements`, `game_results`, `quiz_results`

## Resources

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Rahal Backend Design](docs/backend-design.md)
- [Rahal Database Design](docs/database-design.md)

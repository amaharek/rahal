# رحال (Rahal) 🌍

An Arabic-first geography game platform where players discover the world through interactive challenges.

## Features

- **Daily Challenge**: Find the path between two countries using shared borders
- **Quiz Mode**: Test your knowledge of capitals, flags, landmarks, and more
- **Leaderboard**: Compete with other players
- **Achievements**: Unlock badges as you play
- **RTL Support**: Full Arabic interface with right-to-left layout

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy 2.0 (async), PostgreSQL
- **Frontend**: Next.js 15, React 19, TailwindCSS (RTL)
- **Database**: Supabase (PostgreSQL + Auth)
- **Cache**: Redis
- **Language**: Arabic-first with English support

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Database Architecture

**Hybrid Approach**: This project uses a hybrid database setup:
- **Supabase**: Authentication (GoTrue) + JWT verification + RLS policies
- **Alembic**: Application schema management (tables, functions, triggers)
- **FastAPI**: Direct PostgreSQL connection via SQLAlchemy (not PostgREST)

**Migration Execution Order**:
1. **Supabase migrations** (`supabase/migrations/`) - Creates auth infrastructure, roles, extensions
2. **Alembic migrations** (`backend/alembic/versions/`) - Creates application tables
3. **Manual RLS setup** (`supabase/migrations-manual/`) - Applied after tables exist

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd Rahal-workspace

# Copy environment file
cp .env.example .env

# Start all services (Supabase migration runs automatically)
docker-compose up

# In another terminal, run Alembic migrations
docker exec rahal-backend alembic upgrade head

# Apply RLS policies (after Alembic creates tables)
docker exec -i rahal-db psql -U postgres -d postgres < supabase/migrations-manual/00000000000001_rls_policies.sql

# Seed the database
make seed
```

**Seeded Data:**
- ✅ 98 countries (all continents)
- ✅ 154 borders (connected graph for pathfinding)
- ✅ 85 questions (8 categories × 3 difficulties)
- ✅ 5 achievements
- ✅ 61 daily challenges (30 past + today + 30 future)

Access the application:
- **Frontend**: http://localhost:3000 (Next.js 15.5)
- **Backend API**: http://localhost:8000/docs
- **Supabase Studio**: http://localhost:54323
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres

### Option 2: Manual Setup

#### 1. Start Database Services

```bash
docker-compose up db redis -d
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run Alembic migrations (creates application tables)
alembic upgrade head

# Apply RLS policies from manual migrations
psql -U postgres -h localhost -p 54322 -d postgres < ../supabase/migrations-manual/00000000000001_rls_policies.sql

# Seed database
python ../scripts/seed_database.py

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
Rahal-workspace/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── crud/           # Database operations
│   │   ├── services/       # Business logic
│   │   ├── routers/        # API endpoints
│   │   └── utils/          # Utilities (Arabic normalization)
│   └── alembic/            # Database migrations
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── e2e/               # E2E tests (Playwright)
│   │   ├── fixtures/      # Mock data for tests
│   │   ├── pages/         # Page Object Models
│   │   ├── specs/         # Test specifications
│   │   └── utils/         # Test helpers & API mocks
│   ├── lib/               # Utilities, stores, API clients
│   ├── messages/          # i18n translations
│   └── playwright.config.ts # Playwright configuration
├── data/                   # Seed data (countries, borders, questions)
├── scripts/                # Utility scripts
├── supabase/              # Supabase configuration
│   ├── migrations/        # Auto-run: Auth setup only
│   └── migrations-manual/ # Manual: RLS policies (run after Alembic)
└── docker-compose.yml     # Docker services
```

## Available Commands

```bash
# Development
make dev              # Start all services
make start            # Start services (detached)
make stop             # Stop all services
make logs             # View logs

# Database
make migrate          # Run migrations
make seed             # Seed database
make db-reset         # Reset database

# Testing
make test             # Run all tests
make test-backend     # Run backend tests
make test-frontend    # Run frontend tests

# Frontend E2E Tests (Playwright)
cd frontend
npm run test:e2e      # Run all E2E tests
npm run test:e2e:ui   # Run with interactive UI
npm run test:e2e:debug # Run in debug mode

# Code Quality
make lint             # Run linters
make format           # Format code
make typecheck        # Type checking
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/game/daily` | Get today's challenge |
| `POST /api/game/guess` | Submit a guess |
| `GET /api/quiz/question` | Get a quiz question |
| `POST /api/quiz/answer` | Submit quiz answer |
| `GET /api/autocomplete/countries` | Search countries |
| `GET /api/users/leaderboard` | Get leaderboard |

## Testing

### Overview

The project uses a comprehensive testing strategy:
- **Backend**: pytest with async support for API and integration tests
- **Frontend**: Playwright for end-to-end browser testing

### Frontend E2E Tests (Playwright)

#### Setup

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install
```

#### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI mode
npm run test:e2e:ui

# Run in debug mode (step through tests)
npm run test:e2e:debug

# Run a specific test file
npx playwright test e2e/specs/game-flow.spec.ts
```

#### View Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

#### Test Suites

| Test File | Description |
|-----------|-------------|
| `game-flow.spec.ts` | Game flow, challenge navigation, and win/lose scenarios |
| `map-interaction.spec.ts` | Map rendering, zoom, pan, and country selection |
| `autocomplete.spec.ts` | Country search autocomplete functionality |
| `scoring.spec.ts` | Emoji scoring system and guess tracking |
| `accessibility.spec.ts` | WCAG compliance and accessibility standards |

### Backend Tests (pytest)

```bash
cd backend

# Run all backend tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_api.py
```

### Running All Tests

```bash
# Using make (from project root)
make test

# Or run individually
make test-backend
make test-frontend
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
```bash
DATABASE_URL_ASYNC=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
REDIS_URL=redis://localhost:6379/0
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Built with ❤️ for the Arabic-speaking world

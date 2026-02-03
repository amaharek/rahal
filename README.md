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

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd Rahal-workspace

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up

# In another terminal, seed the database
make seed
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Supabase Studio**: http://localhost:54323

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

# Run migrations
alembic upgrade head

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
│   ├── lib/               # Utilities, stores, API clients
│   └── messages/          # i18n translations
├── data/                   # Seed data (countries, borders, questions)
├── scripts/                # Utility scripts
├── supabase/              # Supabase configuration
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

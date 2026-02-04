# Rahal (رحال) Makefile
# Common development commands

.PHONY: help install dev start stop logs clean test lint format migrate seed

# Default target
help:
	@echo "Rahal (رحال) Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install      - Install all dependencies"
	@echo "  make setup        - Full setup (install + init db)"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start all services in development mode"
	@echo "  make start        - Start services (detached)"
	@echo "  make stop         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View service logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed the database"
	@echo "  make db-reset     - Reset database (drop + migrate + seed)"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-backend - Run backend tests"
	@echo "  make test-frontend- Run frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         - Run linters"
	@echo "  make format       - Format code"
	@echo "  make typecheck    - Run type checking"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make clean-all    - Remove everything including volumes"

# ===========================================
# Setup
# ===========================================

install:
	@echo "Installing backend dependencies..."
	cd backend && uv pip install -e .
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Done!"

setup: install
	@echo "Setting up environment..."
	cp -n .env.example .env || true
	make start
	sleep 10
	make migrate
	make seed
	@echo "Setup complete! Run 'make dev' to start development."

# ===========================================
# Development
# ===========================================

dev:
	docker-compose up

start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# ===========================================
# Database
# ===========================================

migrate:
	cd backend && alembic upgrade head

migrate-new:
	@read -p "Migration name: " name; \
	cd backend && alembic revision --autogenerate -m "$$name"

seed:
	cd backend && uv run python ../scripts/seed_database.py

db-reset:
	docker-compose down -v
	docker-compose up -d db redis
	sleep 5
	make migrate
	make seed

# ===========================================
# Testing
# ===========================================

test: test-backend test-frontend

test-backend:
	cd backend && pytest -v --cov=app --cov-report=term-missing

test-frontend:
	cd frontend && npm test

test-e2e:
	cd frontend && npx playwright test

# ===========================================
# Code Quality
# ===========================================

lint: lint-backend lint-frontend

lint-backend:
	cd backend && ruff check app tests

lint-frontend:
	cd frontend && npm run lint

format: format-backend format-frontend

format-backend:
	cd backend && ruff format app tests

format-frontend:
	cd frontend && npm run format

typecheck: typecheck-backend typecheck-frontend

typecheck-backend:
	cd backend && mypy app

typecheck-frontend:
	cd frontend && npm run typecheck

# ===========================================
# Cleanup
# ===========================================

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +
	find . -type d -name .ruff_cache -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	cd frontend && rm -rf .next out

clean-all: clean
	docker-compose down -v
	rm -rf backend/.venv
	rm -rf frontend/node_modules

# ===========================================
# Production
# ===========================================

build:
	docker-compose -f docker-compose.yml build

build-prod:
	docker-compose -f docker-compose.prod.yml build

deploy:
	@echo "Deploy to production..."
	# Add deployment commands here

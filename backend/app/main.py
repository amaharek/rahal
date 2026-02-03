"""
Rahal API - Arabic Geography Game Backend

FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs on startup and shutdown.
    """
    # Startup
    print(f"🌍 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Debug mode: {settings.DEBUG}")

    yield

    # Shutdown
    print("👋 Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    رحال (Rahal) - Arabic Geography Game API

    An Arabic-first geography and travel game platform.

    ## Features
    - 🗺️ Daily path challenges between countries
    - ❓ Quiz mode with multiple categories
    - 🏆 Achievements and leaderboards
    - 🔤 Arabic autocomplete with fuzzy matching

    ## Authentication
    Uses Supabase JWT tokens. Include the token in the Authorization header:
    `Authorization: Bearer <token>`
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": settings.APP_NAME,
        "name_ar": "رحال",
        "version": settings.APP_VERSION,
        "description": "Arabic Geography Game API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


# Arabic welcome message
@app.get("/مرحبا")
async def arabic_welcome():
    """Arabic welcome endpoint."""
    return {
        "message": "مرحباً بك في رحال!",
        "message_en": "Welcome to Rahal!",
        "tagline": "اكتشف العالم من خلال اللعب",
        "tagline_en": "Discover the World Through Play",
    }

"""
API routers module.
"""

from fastapi import APIRouter

from app.routers import admin, autocomplete, game, quiz, users

api_router = APIRouter()

api_router.include_router(game.router, prefix="/game", tags=["game"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(autocomplete.router, prefix="/autocomplete", tags=["autocomplete"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

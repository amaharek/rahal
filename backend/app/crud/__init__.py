"""
CRUD operations module.
"""

from app.crud.base import CRUDBase
from app.crud.country import country_crud, border_crud
from app.crud.question import question_crud
from app.crud.user import profile_crud, achievement_crud, user_achievement_crud
from app.crud.game import daily_challenge_crud, game_result_crud, quiz_result_crud

__all__ = [
    "CRUDBase",
    "country_crud",
    "border_crud",
    "question_crud",
    "profile_crud",
    "achievement_crud",
    "user_achievement_crud",
    "daily_challenge_crud",
    "game_result_crud",
    "quiz_result_crud",
]

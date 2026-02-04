"""
User-related API endpoints.
"""

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DBSession, CurrentUser, OptionalUser
from app.crud.user import profile_crud, user_achievement_crud
from app.schemas.user import (
    AchievementResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    ProfileResponse,
    ProfileUpdate,
    UserAchievementResponse,
)

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get the current user's profile.

    Requires authentication.
    """
    return ProfileResponse(
        id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
        current_streak=current_user.current_streak,
        max_streak=current_user.max_streak,
        games_played=current_user.games_played,
        games_won=current_user.games_won,
        total_questions_answered=current_user.total_questions_answered,
        total_correct_answers=current_user.total_correct_answers,
        win_rate=current_user.win_rate,
        quiz_accuracy=current_user.quiz_accuracy,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=ProfileResponse)
async def update_current_user_profile(
    update_data: ProfileUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Update the current user's profile.

    Requires authentication.
    """
    # Check username uniqueness if being changed
    if update_data.username and update_data.username != current_user.username:
        existing = await profile_crud.get_by_username(db, update_data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم موجود بالفعل",  # Username already exists
            )

    # Update profile
    updated_user = await profile_crud.update(
        db,
        db_obj=current_user,
        obj_in=update_data,
    )

    return ProfileResponse(
        id=updated_user.id,
        username=updated_user.username,
        display_name=updated_user.display_name,
        avatar_url=updated_user.avatar_url,
        current_streak=updated_user.current_streak,
        max_streak=updated_user.max_streak,
        games_played=updated_user.games_played,
        games_won=updated_user.games_won,
        total_questions_answered=updated_user.total_questions_answered,
        total_correct_answers=updated_user.total_correct_answers,
        win_rate=updated_user.win_rate,
        quiz_accuracy=updated_user.quiz_accuracy,
        created_at=updated_user.created_at,
    )


@router.get("/achievements", response_model=list[UserAchievementResponse])
async def get_user_achievements(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get the current user's achievements.

    Requires authentication.
    """
    user_achievements = await user_achievement_crud.get_user_achievements(
        db, current_user.id
    )

    return [
        UserAchievementResponse(
            id=ua.id,
            achievement=AchievementResponse(
                id=ua.achievement.id,
                code=ua.achievement.code,
                name_ar=ua.achievement.name_ar,
                name_en=ua.achievement.name_en,
                description_ar=ua.achievement.description_ar,
                description_en=ua.achievement.description_en,
                icon=ua.achievement.icon,
                category=ua.achievement.category,
                points=ua.achievement.points,
            ),
            progress=ua.progress,
            unlocked_at=ua.unlocked_at,
            is_unlocked=ua.is_unlocked,
        )
        for ua in user_achievements
    ]


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: DBSession,
    current_user: OptionalUser = None,
    type: str = "max_streak",
    limit: int = 100,
):
    """
    Get the leaderboard.

    Available types:
    - max_streak: Highest streak
    - games_won: Most games won
    - current_streak: Current active streak
    """
    valid_types = ["max_streak", "games_won", "current_streak"]
    if type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"نوع غير صالح. الأنواع المتاحة: {', '.join(valid_types)}",
        )

    # Get leaderboard entries
    profiles = await profile_crud.get_leaderboard(db, order_by=type, limit=limit)

    # Count total users
    total_users = await profile_crud.count(db)

    # Get current user's rank
    user_rank = None
    if current_user:
        user_rank = await profile_crud.get_user_rank(db, current_user.id, order_by=type)

    # Build response
    entries = []
    for rank, profile in enumerate(profiles, start=1):
        score = getattr(profile, type, 0)
        entries.append(
            LeaderboardEntry(
                rank=rank,
                user_id=profile.id,
                username=profile.username,
                display_name=profile.display_name,
                avatar_url=profile.avatar_url,
                score=score,
                games_played=profile.games_played,
            )
        )

    return LeaderboardResponse(
        type=type,
        entries=entries,
        total_users=total_users,
        user_rank=user_rank,
    )

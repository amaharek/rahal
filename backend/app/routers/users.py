"""
User-related API endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core.deps import DBSession, CurrentUser, OptionalUser, security
from app.core.security import verify_supabase_token
from app.crud.country import country_crud
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


def _to_profile_response(user) -> ProfileResponse:
    return ProfileResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        home_country_code=user.home_country_code,
        current_streak=user.current_streak,
        max_streak=user.max_streak,
        games_played=user.games_played,
        games_won=user.games_won,
        total_questions_answered=user.total_questions_answered,
        total_correct_answers=user.total_correct_answers,
        win_rate=user.win_rate,
        quiz_accuracy=user.quiz_accuracy,
        created_at=user.created_at,
    )


@router.post("/bootstrap", response_model=ProfileResponse)
async def bootstrap_current_user(
    db: DBSession,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    """
    Bootstrap the authenticated user's profile.

    Creates a profile row if missing, otherwise returns existing profile.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="غير مصرح - يرجى تسجيل الدخول",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_supabase_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز المصادقة غير صالح",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز المصادقة غير صالح",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="معرف المستخدم غير صالح",
        )

    existing = await profile_crud.get(db, user_uuid)
    if existing:
        return _to_profile_response(existing)

    user_metadata = payload.get("user_metadata") or {}
    display_name = user_metadata.get("full_name") or user_metadata.get("name")
    avatar_url = user_metadata.get("avatar_url")

    created = await profile_crud.create_from_dict(
        db,
        data={
            "id": user_uuid,
            "display_name": display_name,
            "avatar_url": avatar_url,
            "username": None,
            "home_country_code": None,
        },
    )
    return _to_profile_response(created)


@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get the current user's profile.

    Requires authentication.
    """
    return _to_profile_response(current_user)


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

    if update_data.home_country_code:
        normalized_code = update_data.home_country_code.upper()
        country = await country_crud.get_by_code(db, normalized_code)
        if not country:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="رمز الدولة غير صالح",
            )
        update_data.home_country_code = normalized_code

    # Update profile
    updated_user = await profile_crud.update(
        db,
        db_obj=current_user,
        obj_in=update_data,
    )

    return _to_profile_response(updated_user)


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
                home_country_code=profile.home_country_code,
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

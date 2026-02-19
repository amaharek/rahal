"""
Game-related API endpoints for daily challenges.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from datetime import date
from types import SimpleNamespace
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DBSession, OptionalUser, CurrentUser
from app.crud.country import country_crud
from app.crud.game import daily_challenge_crud, game_result_crud
from app.schemas.game import (
    DailyChallengeResponse,
    GameCompleteResponse,
    GameStatsResponse,
    GuessRequest,
    GuessResponse,
    HintRequest,
    HintResponse,
    PracticeGuessRequest,
    PracticeHintRequest,
    PracticeSessionCreateRequest,
    PracticeSessionResponse,
    RouteMode,
    UserProgress,
)
from app.schemas.country import CountryBrief
from app.services.path_finder import PathFinderService
from app.services.score_calculator import ScoreCalculator

router = APIRouter()

# Service instances
path_finder_service = PathFinderService()
score_calculator = ScoreCalculator()

PRACTICE_SESSION_TTL_MINUTES = 60


@dataclass
class PracticeSessionState:
    """Ephemeral in-memory practice session."""

    id: UUID
    start_country_id: UUID
    end_country_id: UUID
    shortest_path: int
    path_country_codes: list[str]
    route_mode: RouteMode = "shortest"
    guesses: list[dict] = field(default_factory=list)
    hints_used: int = 0
    completed: bool = False
    score: int | None = None
    expires_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
        + timedelta(minutes=PRACTICE_SESSION_TTL_MINUTES)
    )


practice_sessions: dict[UUID, PracticeSessionState] = {}


def _cleanup_expired_sessions() -> None:
    now = datetime.now(timezone.utc)
    expired_ids = [
        session_id
        for session_id, session in practice_sessions.items()
        if session.expires_at <= now
    ]
    for session_id in expired_ids:
        practice_sessions.pop(session_id, None)


def _get_practice_session_or_404(session_id: UUID) -> PracticeSessionState:
    _cleanup_expired_sessions()
    session = practice_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="جلسة التدريب غير موجودة أو منتهية الصلاحية",
        )

    session.expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=PRACTICE_SESSION_TTL_MINUTES
    )
    return session


def _build_challenge_like(state: PracticeSessionState) -> SimpleNamespace:
    return SimpleNamespace(
        start_country_id=state.start_country_id,
        end_country_id=state.end_country_id,
        shortest_path=state.shortest_path,
    )


@router.get("/daily", response_model=DailyChallengeResponse)
async def get_daily_challenge(
    db: DBSession,
    current_user: OptionalUser,
    challenge_date: date | None = None,
    mode: RouteMode = "shortest",
):
    """
    Get today's daily challenge.

    Returns the start and end countries, shortest path length,
    and user's existing progress if logged in.
    """
    target_date = challenge_date or date.today()
    challenge = await daily_challenge_crud.get_by_date(db, target_date)

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا يوجد تحدٍ لهذا اليوم",  # No challenge for this day
        )

    # Get user's existing progress if logged in
    user_progress = None
    if current_user:
        result = await game_result_crud.get_by_user_and_challenge(
            db, current_user.id, challenge.id, mode
        )
        if result:
            user_progress = UserProgress(
                guesses=result.guesses,
                hints_used=result.hints_used,
                completed=result.completed,
                score=result.score,
            )

    # Calculate shortest path for visualization
    path = await path_finder_service.find_shortest_path(
        db, challenge.start_country.id, challenge.end_country.id
    )
    
    # Extract country codes from path (excluding start and end)
    path_country_codes = []
    if path and len(path) > 2:
        # Get countries excluding first (start) and last (end)
        middle_country_ids = path[1:-1]
        # Query countries to get their codes
        for country_id in middle_country_ids:
            country = await country_crud.get(db, country_id)
            if country:
                path_country_codes.append(country.code)

    return DailyChallengeResponse(
        id=challenge.id,
        challenge_date=challenge.challenge_date,
        start_country=CountryBrief(
            id=challenge.start_country.id,
            code=challenge.start_country.code,
            name_ar=challenge.start_country.name_ar,
            name_en=challenge.start_country.name_en,
            flag_emoji=challenge.start_country.flag_emoji,
        ),
        end_country=CountryBrief(
            id=challenge.end_country.id,
            code=challenge.end_country.code,
            name_ar=challenge.end_country.name_ar,
            name_en=challenge.end_country.name_en,
            flag_emoji=challenge.end_country.flag_emoji,
        ),
        shortest_path=challenge.shortest_path,
        mode=mode,
        path_country_codes=path_country_codes,
        user_progress=user_progress,
    )


@router.post("/guess", response_model=GuessResponse)
async def submit_guess(
    request: GuessRequest,
    db: DBSession,
    current_user: OptionalUser,
):
    """
    Submit a country guess for the daily challenge.

    Returns emoji feedback and whether the game is complete.
    """
    # Validate challenge exists
    challenge = await daily_challenge_crud.get(db, request.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="التحدي غير موجود",  # Challenge not found
        )

    # Get or create game result
    game_result = await game_result_crud.get_or_create_for_user(
        db, current_user.id if current_user else None, challenge.id, request.mode
    )

    # Check if already completed
    if game_result.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد أكملت هذا التحدي بالفعل",  # Already completed
        )

    # Check for duplicate guess
    guessed_ids = {g["country_id"] for g in game_result.guesses}
    if str(request.country_id) in guessed_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد خمنت هذه الدولة من قبل",  # Already guessed this country
        )

    # Calculate score for this guess
    score_result = await score_calculator.calculate_guess_score(
        db=db,
        challenge=challenge,
        guessed_country_id=request.country_id,
        previous_guesses=game_result.guesses,
    )

    # Update game result
    new_guess = score_result.to_guess_entry()
    new_guess["order"] = len(game_result.guesses) + 1
    game_result.guesses = game_result.guesses + [new_guess]  # Create new list
    game_result.total_guesses += 1

    if score_result.is_destination:
        game_result.completed = True
        game_result.score = score_calculator.calculate_final_score(
            game_result.total_guesses,
            game_result.hints_used,
            challenge.shortest_path,
            request.mode,
        )

    await db.flush()

    return GuessResponse(
        country=CountryBrief(
            id=score_result.country.id,
            code=score_result.country.code,
            name_ar=score_result.country.name_ar,
            name_en=score_result.country.name_en,
            flag_emoji=score_result.country.flag_emoji,
        ),
        score_emoji=score_result.emoji,
        score_description=score_result.description_ar,
        is_on_shortest_path=score_result.is_on_shortest_path,
        is_destination=score_result.is_destination,
        game_complete=game_result.completed,
        total_guesses=game_result.total_guesses,
        score=game_result.score,
        route_mode=request.mode,
        gap_from_optimal=(
            max(0, game_result.total_guesses - challenge.shortest_path)
            if game_result.completed
            else None
        ),
        quality_tier=(
            score_calculator.get_quality_tier(game_result.total_guesses, challenge.shortest_path)
            if game_result.completed
            else None
        ),
        quality_explanation_ar=(
            score_calculator.get_quality_explanation_ar(
                mode=request.mode,
                total_guesses=game_result.total_guesses,
                shortest_path=challenge.shortest_path,
            )
            if game_result.completed
            else None
        ),
    )


@router.post("/hint", response_model=HintResponse)
async def use_hint(
    request: HintRequest,
    db: DBSession,
    current_user: OptionalUser,
):
    """
    Use a hint for the daily challenge.

    Hint types:
    - border_hint: Show neighbors of a country on the path
    - all_borders_hint: Show all countries on shortest path
    - first_letter_hint: Show first letters of remaining countries
    """
    challenge = await daily_challenge_crud.get(db, request.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="التحدي غير موجود",
        )

    game_result = await game_result_crud.get_or_create_for_user(
        db, current_user.id if current_user else None, challenge.id, request.mode
    )

    if game_result.hints_used >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="استخدمت جميع التلميحات المتاحة",  # All hints used
        )

    if game_result.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد أكملت هذا التحدي بالفعل",
        )

    # Generate hint
    hint_step = game_result.hints_used + 1
    hint_data = await path_finder_service.generate_hint(
        db=db,
        challenge=challenge,
        hint_step=hint_step,
        previous_guesses=game_result.guesses,
    )

    game_result.hints_used += 1
    await db.flush()

    return HintResponse(
        hint_type=f"progressive_{hint_step}",
        hint_data=hint_data,
        hints_remaining=3 - game_result.hints_used,
    )


@router.get("/stats", response_model=GameStatsResponse)
async def get_game_stats(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get user's game statistics.

    Requires authentication.
    """
    stats = await game_result_crud.get_user_stats(db, current_user.id)

    return GameStatsResponse(
        games_played=stats["games_played"],
        games_won=stats["games_won"],
        win_rate=stats["win_rate"],
        current_streak=current_user.current_streak,
        max_streak=current_user.max_streak,
        average_guesses=stats["average_guesses"],
        hints_used_total=stats["hints_used_total"],
        last_played=stats["last_played"],
    )


@router.post("/practice/session", response_model=PracticeSessionResponse)
async def create_practice_session(
    request: PracticeSessionCreateRequest,
    db: DBSession,
):
    """
    Create a new ephemeral practice session.

    Practice sessions do not persist and do not affect daily stats/streaks.
    """
    if request.start_country_id == request.end_country_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب أن تكون دولتا البداية والنهاية مختلفتين",
        )

    start_country = await country_crud.get(db, request.start_country_id)
    end_country = await country_crud.get(db, request.end_country_id)
    if not start_country or not end_country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الدولة غير موجودة",
        )

    path = await path_finder_service.find_shortest_path(
        db, request.start_country_id, request.end_country_id
    )
    if not path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يوجد مسار بري صالح بين الدولتين",
        )

    path_country_codes: list[str] = []
    if len(path) > 2:
        for country_id in path[1:-1]:
            country = await country_crud.get(db, country_id)
            if country:
                path_country_codes.append(country.code)

    session_id = uuid4()
    practice_sessions[session_id] = PracticeSessionState(
        id=session_id,
        start_country_id=request.start_country_id,
        end_country_id=request.end_country_id,
        shortest_path=max(len(path) - 1, 1),
        route_mode=request.mode,
        path_country_codes=path_country_codes,
    )

    return PracticeSessionResponse(
        session_id=session_id,
        route_mode=request.mode,
        start_country=CountryBrief(
            id=start_country.id,
            code=start_country.code,
            name_ar=start_country.name_ar,
            name_en=start_country.name_en,
            flag_emoji=start_country.flag_emoji,
        ),
        end_country=CountryBrief(
            id=end_country.id,
            code=end_country.code,
            name_ar=end_country.name_ar,
            name_en=end_country.name_en,
            flag_emoji=end_country.flag_emoji,
        ),
        shortest_path=max(len(path) - 1, 1),
        path_country_codes=path_country_codes,
    )


@router.post("/practice/guess", response_model=GuessResponse)
async def submit_practice_guess(
    request: PracticeGuessRequest,
    db: DBSession,
):
    """
    Submit a guess inside a practice session.

    Practice sessions are isolated and do not mutate persisted game progress.
    """
    session = _get_practice_session_or_404(request.session_id)

    if session.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد أنهيت جولة التدريب بالفعل",
        )

    guessed_ids = {g["country_id"] for g in session.guesses}
    if str(request.country_id) in guessed_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد خمنت هذه الدولة من قبل",
        )

    score_result = await score_calculator.calculate_guess_score(
        db=db,
        challenge=_build_challenge_like(session),
        guessed_country_id=request.country_id,
        previous_guesses=session.guesses,
    )

    new_guess = score_result.to_guess_entry()
    new_guess["order"] = len(session.guesses) + 1
    session.guesses = session.guesses + [new_guess]

    if score_result.is_destination:
        session.completed = True
        session.score = score_calculator.calculate_final_score(
            len(session.guesses),
            session.hints_used,
            session.shortest_path,
            session.route_mode,
        )

    return GuessResponse(
        country=CountryBrief(
            id=score_result.country.id,
            code=score_result.country.code,
            name_ar=score_result.country.name_ar,
            name_en=score_result.country.name_en,
            flag_emoji=score_result.country.flag_emoji,
        ),
        score_emoji=score_result.emoji,
        score_description=score_result.description_ar,
        is_on_shortest_path=score_result.is_on_shortest_path,
        is_destination=score_result.is_destination,
        game_complete=session.completed,
        total_guesses=len(session.guesses),
        score=session.score,
        route_mode=session.route_mode,
        gap_from_optimal=(
            max(0, len(session.guesses) - session.shortest_path) if session.completed else None
        ),
        quality_tier=(
            score_calculator.get_quality_tier(len(session.guesses), session.shortest_path)
            if session.completed
            else None
        ),
        quality_explanation_ar=(
            score_calculator.get_quality_explanation_ar(
                mode=session.route_mode,
                total_guesses=len(session.guesses),
                shortest_path=session.shortest_path,
            )
            if session.completed
            else None
        ),
    )


@router.post("/practice/hint", response_model=HintResponse)
async def use_practice_hint(
    request: PracticeHintRequest,
    db: DBSession,
):
    """
    Use a hint in practice mode.
    """
    session = _get_practice_session_or_404(request.session_id)

    if session.hints_used >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="استخدمت جميع التلميحات المتاحة",
        )

    if session.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد أنهيت جولة التدريب بالفعل",
        )

    hint_step = session.hints_used + 1
    hint_data = await path_finder_service.generate_hint(
        db=db,
        challenge=_build_challenge_like(session),
        hint_step=hint_step,
        previous_guesses=session.guesses,
    )

    session.hints_used += 1

    return HintResponse(
        hint_type=f"progressive_{hint_step}",
        hint_data=hint_data,
        hints_remaining=3 - session.hints_used,
    )
    if request.mode != session.route_mode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="وضع اللعب لا يطابق إعداد الجلسة",
        )

    if request.mode != session.route_mode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="وضع اللعب لا يطابق إعداد الجلسة",
        )

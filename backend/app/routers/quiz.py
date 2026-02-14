"""
Quiz-related API endpoints.
"""

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import DBSession, OptionalUser, CurrentUser
from app.crud.question import question_crud
from app.crud.game import quiz_result_crud
from app.crud.user import profile_crud
from app.models.question import QuestionCategory, QuestionDifficulty, QuestionType
from app.schemas.question import (
    AnswerRequest,
    AnswerResponse,
    QuestionResponse,
    QuizSessionRequest,
    QuizSessionResponse,
    QuizStatsResponse,
    CategoryStats,
)
from app.services.quiz_engine import QuizEngine

router = APIRouter()

# Service instance
quiz_engine = QuizEngine()


@router.get("/question", response_model=QuestionResponse)
async def get_random_question(
    db: DBSession,
    category: QuestionCategory | None = None,
    difficulty: QuestionDifficulty | None = None,
    question_type: QuestionType | None = None,
    exclude_ids: list[UUID] | None = Query(None),
):
    """
    Get a random question with optional filters.

    Query parameters:
    - category: Filter by category (capitals, flags, landmarks, etc.)
    - difficulty: Filter by difficulty (easy, medium, hard)
    - question_type: Filter by type (multiple_choice, autocomplete)
    - exclude_ids: List of question IDs to exclude
    """
    question = await question_crud.get_random(
        db,
        category=category,
        difficulty=difficulty,
        question_type=question_type,
        exclude_ids=exclude_ids or [],
    )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا توجد أسئلة متاحة بهذه المعايير",  # No questions available
        )

    # Get options for multiple choice
    options = None
    if question.question_type == QuestionType.MULTIPLE_CHOICE.value and question.options:
        # Handle both list format ["opt1", "opt2"] and dict format {"options": [...]}
        options = question.options if isinstance(question.options, list) else question.options.get("options", [])

    return QuestionResponse(
        id=question.id,
        category=question.category,
        difficulty=question.difficulty,
        question_type=question.question_type,
        question_ar=question.question_ar,
        options=options,
        hint=question.hint,
        image_url=question.image_url,
    )


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(
    request: AnswerRequest,
    db: DBSession,
    current_user: OptionalUser,
):
    """
    Submit an answer to a question.

    Returns whether the answer is correct and the score earned.
    """
    question = await question_crud.get(db, request.question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="السؤال غير موجود",  # Question not found
        )

    # Check answer
    result = quiz_engine.check_answer(
        question=question,
        user_answer=request.answer,
        hints_used=request.hints_used,
    )

    # Save result and update stats if user is logged in
    if current_user:
        await quiz_result_crud.create_result(
            db,
            user_id=current_user.id,
            question_id=question.id,
            user_answer=request.answer,
            is_correct=result.is_correct,
            hints_used=request.hints_used,
            time_taken_ms=request.time_taken_ms,
        )

        # Update user stats
        await profile_crud.increment_stats(
            db,
            current_user,
            questions_answered=1,
            correct_answers=1 if result.is_correct else 0,
        )

    return AnswerResponse(
        is_correct=result.is_correct,
        correct_answer=question.correct_answer,
        score=result.score,
        explanation=result.explanation,
    )


@router.post("/session", response_model=QuizSessionResponse)
async def start_quiz_session(
    request: QuizSessionRequest,
    db: DBSession,
):
    """
    Start a quiz session with multiple questions.

    Returns a session ID and list of questions.
    """
    questions = await quiz_engine.generate_session(
        db=db,
        category=request.category,
        difficulty=request.difficulty,
        question_type=request.question_type,
        num_questions=request.num_questions,
    )

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا توجد أسئلة كافية",  # Not enough questions
        )

    return QuizSessionResponse(
        session_id=uuid4(),
        questions=questions,
        total_questions=len(questions),
        time_limit_seconds=len(questions) * 30,  # 30 seconds per question
    )


@router.get("/daily", response_model=QuizSessionResponse)
async def get_daily_quiz(db: DBSession):
    """
    Get the daily quiz challenge.

    Returns a balanced mix of questions from different categories and difficulties.
    """
    questions = await quiz_engine.generate_daily_quiz(db, num_questions=10)

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="لا توجد أسئلة متاحة اليوم",  # No questions available today
        )

    return QuizSessionResponse(
        session_id=uuid4(),
        questions=questions,
        total_questions=len(questions),
        time_limit_seconds=300,  # 5 minutes total
    )


@router.get("/stats", response_model=QuizStatsResponse)
async def get_quiz_stats(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get user's quiz statistics.

    Requires authentication.
    """
    stats = await quiz_result_crud.get_user_stats(db, current_user.id)

    # Convert to response model
    by_category = {
        cat: CategoryStats(**data)
        for cat, data in stats["by_category"].items()
    }
    by_difficulty = {
        diff: CategoryStats(**data)
        for diff, data in stats["by_difficulty"].items()
    }

    return QuizStatsResponse(
        total_answered=stats["total_answered"],
        total_correct=stats["total_correct"],
        accuracy=stats["accuracy"],
        by_category=by_category,
        by_difficulty=by_difficulty,
    )


@router.get("/categories")
async def get_categories():
    """
    Get all available question categories with Arabic labels.
    """
    return {
        "categories": [
            {"value": "capitals", "label_ar": "العواصم", "label_en": "Capitals"},
            {"value": "flags", "label_ar": "الأعلام", "label_en": "Flags"},
            {"value": "landmarks", "label_ar": "المعالم", "label_en": "Landmarks"},
            {"value": "attractions", "label_ar": "معالم الجذب", "label_en": "Attractions"},
            {"value": "geography", "label_ar": "الجغرافيا", "label_en": "Geography"},
            {"value": "borders", "label_ar": "الحدود", "label_en": "Borders"},
            {"value": "population", "label_ar": "السكان", "label_en": "Population"},
            {"value": "arab_world", "label_ar": "العالم العربي", "label_en": "Arab World"},
        ]
    }

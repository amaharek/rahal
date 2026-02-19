"""
Admin-only API endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentAdminUser, DBSession
from app.crud.question import question_crud
from app.models.question import QuestionCategory, QuestionDifficulty, QuestionType
from app.schemas.question import (
    AdminQuestionActivationRequest,
    AdminQuestionCreateRequest,
    AdminQuestionListItem,
    AdminQuestionListResponse,
    AdminQuestionUpdateRequest,
)
from app.utils.arabic import normalize_arabic

router = APIRouter()


def _validate_options(question_type: QuestionType, options: list[str] | None) -> None:
    if question_type == QuestionType.MULTIPLE_CHOICE:
        if not options or len(options) != 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="أسئلة الاختيار المتعدد تتطلب 4 خيارات",
            )
    elif options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الخيارات مسموحة فقط لأسئلة الاختيار المتعدد",
        )


def _serialize_question(question) -> AdminQuestionListItem:
    options = None
    if question.options:
        options = question.options if isinstance(question.options, list) else question.options.get("options")

    return AdminQuestionListItem(
        id=question.id,
        category=question.category,
        difficulty=question.difficulty,
        question_type=question.question_type,
        question_ar=question.question_ar,
        correct_answer=question.correct_answer,
        options=options,
        hint=question.hint,
        image_url=question.image_url,
        tags=question.tags,
        is_active=question.is_active,
        created_at=question.created_at,
        updated_at=question.updated_at,
    )


@router.get("/session")
async def get_admin_session(_admin_user: CurrentAdminUser):
    """Validate current user has admin access."""
    return {"is_admin": True}


@router.get("/questions", response_model=AdminQuestionListResponse)
async def list_questions(
    db: DBSession,
    _admin_user: CurrentAdminUser,
    category: QuestionCategory | None = None,
    difficulty: QuestionDifficulty | None = None,
    question_type: QuestionType | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    questions, total = await question_crud.list_for_admin(
        db,
        category=category,
        difficulty=difficulty,
        question_type=question_type,
        is_active=is_active,
        search=search,
        skip=skip,
        limit=limit,
    )

    return AdminQuestionListResponse(
        items=[_serialize_question(question) for question in questions],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("/questions", response_model=AdminQuestionListItem)
async def create_question(
    payload: AdminQuestionCreateRequest,
    db: DBSession,
    _admin_user: CurrentAdminUser,
):
    _validate_options(payload.question_type, payload.options)

    db_obj = await question_crud.create_from_dict(
        db,
        data={
            "category": payload.category.value,
            "difficulty": payload.difficulty.value,
            "question_type": payload.question_type.value,
            "question_ar": payload.question_ar,
            "correct_answer": payload.correct_answer,
            "correct_answer_normalized": normalize_arabic(payload.correct_answer),
            "options": payload.options if payload.options else None,
            "hint": payload.hint,
            "image_url": payload.image_url,
            "tags": payload.tags,
            "is_active": payload.is_active,
        },
    )
    return _serialize_question(db_obj)


@router.patch("/questions/{question_id}", response_model=AdminQuestionListItem)
async def update_question(
    question_id: UUID,
    payload: AdminQuestionUpdateRequest,
    db: DBSession,
    _admin_user: CurrentAdminUser,
):
    question = await question_crud.get(db, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="السؤال غير موجود",
        )

    next_type = payload.question_type or QuestionType(question.question_type)
    _validate_options(next_type, payload.options if payload.options is not None else (
        question.options if isinstance(question.options, list) else question.options.get("options") if question.options else None
    ))

    update_data = payload.model_dump(exclude_unset=True)
    if "category" in update_data:
        update_data["category"] = payload.category.value
    if "difficulty" in update_data:
        update_data["difficulty"] = payload.difficulty.value
    if "question_type" in update_data:
        update_data["question_type"] = payload.question_type.value
    if "correct_answer" in update_data:
        update_data["correct_answer_normalized"] = normalize_arabic(payload.correct_answer or "")

    updated = await question_crud.update(db, db_obj=question, obj_in=update_data)
    return _serialize_question(updated)


@router.post("/questions/{question_id}/activation", response_model=AdminQuestionListItem)
async def set_question_activation(
    question_id: UUID,
    payload: AdminQuestionActivationRequest,
    db: DBSession,
    _admin_user: CurrentAdminUser,
):
    question = await question_crud.get(db, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="السؤال غير موجود",
        )

    updated = await question_crud.update(
        db,
        db_obj=question,
        obj_in={"is_active": payload.is_active},
    )
    return _serialize_question(updated)

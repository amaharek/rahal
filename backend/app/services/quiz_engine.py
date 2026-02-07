"""
Quiz engine service for managing quiz sessions and checking answers.
"""

from dataclasses import dataclass
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.question import question_crud
from app.models.question import Question, QuestionCategory, QuestionDifficulty, QuestionType
from app.schemas.question import QuestionResponse
from app.utils.arabic import normalize_arabic, calculate_similarity


@dataclass
class AnswerResult:
    """Result of checking an answer."""

    is_correct: bool
    score: int
    explanation: str | None = None


class QuizEngine:
    """Service for managing quiz sessions and checking answers."""

    # Scoring constants
    BASE_SCORE_MULTIPLE_CHOICE = 10
    BASE_SCORE_AUTOCOMPLETE = 15
    HINT_PENALTY = 3

    # Similarity threshold for fuzzy matching
    SIMILARITY_THRESHOLD = 0.85

    def check_answer(
        self,
        question: Question,
        user_answer: str,
        hints_used: int = 0,
    ) -> AnswerResult:
        """
        Check if user's answer is correct.

        Args:
            question: The question being answered
            user_answer: User's answer
            hints_used: Number of hints used

        Returns:
            AnswerResult with correctness and score
        """
        # Normalize both answers
        correct_normalized = normalize_arabic(question.correct_answer)
        user_normalized = normalize_arabic(user_answer)

        # Check for exact match
        is_correct = correct_normalized == user_normalized

        # For autocomplete, also check normalized version from DB
        if not is_correct and question.question_type == QuestionType.AUTOCOMPLETE.value:
            is_correct = question.correct_answer_normalized == user_normalized

            # Fuzzy match as fallback
            if not is_correct:
                similarity = calculate_similarity(user_normalized, correct_normalized)
                is_correct = similarity >= self.SIMILARITY_THRESHOLD

        # For multiple choice, also check if it matches exactly one of the options
        if not is_correct and question.question_type == QuestionType.MULTIPLE_CHOICE.value:
            if question.options and "options" in question.options:
                options = question.options["options"]
                for option in options:
                    if normalize_arabic(option) == user_normalized:
                        is_correct = normalize_arabic(option) == correct_normalized
                        break

        # Calculate score
        if is_correct:
            base_score = (
                self.BASE_SCORE_MULTIPLE_CHOICE
                if question.question_type == QuestionType.MULTIPLE_CHOICE.value
                else self.BASE_SCORE_AUTOCOMPLETE
            )
            score = max(0, base_score - (hints_used * self.HINT_PENALTY))
        else:
            score = 0

        # Generate explanation
        explanation = None
        if not is_correct:
            explanation = f"الإجابة الصحيحة هي: {question.correct_answer}"

        return AnswerResult(
            is_correct=is_correct,
            score=score,
            explanation=explanation,
        )

    async def generate_session(
        self,
        db: AsyncSession,
        *,
        category: QuestionCategory | None = None,
        difficulty: QuestionDifficulty | None = None,
        question_type: QuestionType | None = None,
        num_questions: int = 10,
    ) -> list[QuestionResponse]:
        """
        Generate a quiz session with random questions.

        Args:
            db: Database session
            category: Optional category filter
            difficulty: Optional difficulty filter
            question_type: Optional type filter
            num_questions: Number of questions

        Returns:
            List of question responses
        """
        questions = await question_crud.get_random_batch(
            db,
            count=num_questions,
            category=category,
            difficulty=difficulty,
            question_type=question_type,
        )

        # Convert to response schema (without correct answer)
        responses = []
        for q in questions:
            options = None
            if q.question_type == QuestionType.MULTIPLE_CHOICE.value and q.options:
                # Options are stored as JSONB array directly
                options = q.options if isinstance(q.options, list) else q.options.get("options", [])

            responses.append(
                QuestionResponse(
                    id=q.id,
                    category=q.category,
                    difficulty=q.difficulty,
                    question_type=q.question_type,
                    question_ar=q.question_ar,
                    options=options,
                    hint=q.hint,
                    image_url=q.image_url,
                )
            )

        return responses

    async def generate_daily_quiz(
        self,
        db: AsyncSession,
        *,
        num_questions: int = 10,
    ) -> list[QuestionResponse]:
        """
        Generate a balanced daily quiz with mixed categories and difficulties.

        Args:
            db: Database session
            num_questions: Number of questions

        Returns:
            List of question responses
        """
        # Try to get a mix of difficulties
        easy_count = num_questions // 3
        medium_count = num_questions // 3
        hard_count = num_questions - easy_count - medium_count

        questions = []

        # Get easy questions
        easy = await question_crud.get_random_batch(
            db,
            count=easy_count,
            difficulty=QuestionDifficulty.EASY,
        )
        questions.extend(easy)

        # Get medium questions
        exclude_ids = [q.id for q in questions]
        medium = await question_crud.get_random_batch(
            db,
            count=medium_count,
            difficulty=QuestionDifficulty.MEDIUM,
            exclude_ids=exclude_ids,
        )
        questions.extend(medium)

        # Get hard questions
        exclude_ids = [q.id for q in questions]
        hard = await question_crud.get_random_batch(
            db,
            count=hard_count,
            difficulty=QuestionDifficulty.HARD,
            exclude_ids=exclude_ids,
        )
        questions.extend(hard)

        # Convert to responses
        responses = []
        for q in questions:
            options = None
            if q.question_type == QuestionType.MULTIPLE_CHOICE.value and q.options:
                # Options are stored as JSONB array directly
                options = q.options if isinstance(q.options, list) else q.options.get("options", [])

            responses.append(
                QuestionResponse(
                    id=q.id,
                    category=q.category,
                    difficulty=q.difficulty,
                    question_type=q.question_type,
                    question_ar=q.question_ar,
                    options=options,
                    hint=q.hint,
                    image_url=q.image_url,
                )
            )

        return responses

"""Smoke tests for core services."""
import pytest
from app.services.path_finder import PathFinderService
from app.services.quiz_engine import QuizEngine
from app.services.score_calculator import ScoreCalculator
from app.models.country import Country, Border
from app.models.question import Question, QuestionType


@pytest.mark.asyncio
async def test_path_finder_finds_path(db_session):
    """PathFinder finds path between connected countries."""
    c1 = Country(code="EGY", name_ar="مصر", name_en="Egypt", continent="Asia", region="Western Asia")
    c2 = Country(code="SDN", name_ar="السودان", name_en="Sudan", continent="Africa", region="Northern Africa")
    db_session.add_all([c1, c2])
    await db_session.commit()

    # Create border
    a_id, b_id = sorted([c1.id, c2.id])
    border = Border(country_a_id=a_id, country_b_id=b_id)
    db_session.add(border)
    await db_session.commit()

    path_finder = PathFinderService()
    path = await path_finder.find_shortest_path(db_session, c1.id, c2.id)
    assert path is not None
    assert len(path) == 2  # Direct neighbors


@pytest.mark.asyncio
async def test_path_finder_returns_none_for_disconnected(db_session):
    """PathFinder returns None for disconnected countries."""
    c1 = Country(code="EGY", name_ar="مصر", name_en="Egypt", continent="Asia", region="Western Asia")
    c2 = Country(code="JPN", name_ar="اليابان", name_en="Japan", continent="Asia", region="Eastern Asia")
    db_session.add_all([c1, c2])
    await db_session.commit()

    path_finder = PathFinderService()
    path = await path_finder.find_shortest_path(db_session, c1.id, c2.id)
    assert path is None  # No connection between Egypt and Japan


def test_score_calculator_base_score():
    """ScoreCalculator returns base score for optimal path."""
    calculator = ScoreCalculator()
    score = calculator.calculate_final_score(
        total_guesses=3,
        hints_used=0,
        shortest_path=3
    )
    assert score == 1200  # 1000 base + 200 optimal bonus


def test_score_calculator_with_extra_guesses():
    """ScoreCalculator penalizes extra guesses."""
    calculator = ScoreCalculator()
    score = calculator.calculate_final_score(
        total_guesses=5,
        hints_used=0,
        shortest_path=3
    )
    # 1000 base - (5-3)*50 = 1000 - 100 = 900
    assert score == 900


def test_score_calculator_with_hints():
    """ScoreCalculator penalizes hint usage."""
    calculator = ScoreCalculator()
    score = calculator.calculate_final_score(
        total_guesses=3,
        hints_used=2,
        shortest_path=3
    )
    # 1000 base - 2*100 + 200 optimal = 1000
    assert score == 1000


def test_quiz_engine_check_correct_answer():
    """QuizEngine correctly validates answers."""
    question = Question(
        category="capitals",
        difficulty="easy",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        question_ar="ما هي عاصمة مصر؟",
        correct_answer="القاهرة",
        correct_answer_normalized="القاهرة",
        options=["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]
    )

    quiz_engine = QuizEngine()
    result = quiz_engine.check_answer(question, "القاهرة", hints_used=0)
    assert result.is_correct is True
    assert result.score > 0


def test_quiz_engine_check_wrong_answer():
    """QuizEngine correctly rejects wrong answers."""
    question = Question(
        category="capitals",
        difficulty="easy",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        question_ar="ما هي عاصمة مصر؟",
        correct_answer="القاهرة",
        correct_answer_normalized="القاهرة",
        options=["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]
    )

    quiz_engine = QuizEngine()
    result = quiz_engine.check_answer(question, "الإسكندرية", hints_used=0)
    assert result.is_correct is False
    assert result.score == 0

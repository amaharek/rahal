"""Smoke tests for API routers."""
import pytest
from datetime import date
from app.models.country import Country, Border
from app.models.question import Question, QuestionType
from app.models.game import DailyChallenge


@pytest.mark.asyncio
async def test_get_daily_challenge(client, db_session):
    """GET /api/game/daily returns daily challenge."""
    # Setup: Create countries and daily challenge
    c1 = Country(code="DEU", name_ar="ألمانيا", name_en="Germany", continent="Europe", region="Western Europe")
    c2 = Country(code="FRA", name_ar="فرنسا", name_en="France", continent="Europe", region="Western Europe")
    db_session.add_all([c1, c2])
    await db_session.commit()

    challenge = DailyChallenge(
        challenge_date=date.today(),
        start_country_id=c1.id,
        end_country_id=c2.id,
        shortest_path=2
    )
    db_session.add(challenge)
    await db_session.commit()

    # Test
    response = await client.get("/api/game/daily")
    assert response.status_code == 200
    data = response.json()
    assert "start_country" in data
    assert "end_country" in data
    assert data["start_country"]["code"] == "DEU"
    assert data["end_country"]["code"] == "FRA"


@pytest.mark.asyncio
async def test_autocomplete_country(client, db_session):
    """GET /api/autocomplete/countries returns matching countries."""
    # Setup: Create a country
    egypt = Country(code="EGY", name_ar="مصر", name_en="Egypt", continent="Asia", region="Western Asia")
    db_session.add(egypt)
    await db_session.commit()

    # Test
    response = await client.get("/api/autocomplete/countries?q=Egypt")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0
    assert data["suggestions"][0]["name_en"] == "Egypt"


@pytest.mark.asyncio
async def test_quiz_categories(client):
    """GET /api/quiz/categories returns categories."""
    response = await client.get("/api/quiz/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert isinstance(data["categories"], list)
    assert len(data["categories"]) > 0


@pytest.mark.asyncio
async def test_get_random_question(client, db_session):
    """GET /api/quiz/question returns a random question."""
    # Setup: Create a question
    question = Question(
        category="capitals",
        difficulty="easy",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        question_ar="ما هي عاصمة مصر؟",
        correct_answer="القاهرة",
        correct_answer_normalized="القاهرة",
        options=["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]
    )
    db_session.add(question)
    await db_session.commit()

    # Test
    response = await client.get("/api/quiz/question?category=capitals&difficulty=easy")
    assert response.status_code == 200
    data = response.json()
    assert "question_ar" in data
    assert "options" in data
    assert isinstance(data["options"], list)


@pytest.mark.asyncio
async def test_submit_quiz_answer(client, db_session):
    """POST /api/quiz/answer validates answer correctly."""
    # Setup: Create a question
    question = Question(
        category="capitals",
        difficulty="easy",
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        question_ar="ما هي عاصمة مصر؟",
        correct_answer="القاهرة",
        correct_answer_normalized="القاهرة",
        options=["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]
    )
    db_session.add(question)
    await db_session.commit()

    # Test correct answer
    response = await client.post(
        "/api/quiz/answer",
        json={
            "question_id": str(question.id),
            "answer": "القاهرة",
            "hints_used": 0,
            "time_taken_ms": 5000
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is True
    assert data["score"] > 0


@pytest.mark.asyncio
async def test_submit_game_guess(client, db_session):
    """POST /api/game/guess processes guess correctly."""
    # Setup: Create countries, border, and challenge
    c1 = Country(code="DEU", name_ar="ألمانيا", name_en="Germany", continent="Europe", region="Western Europe")
    c2 = Country(code="FRA", name_ar="فرنسا", name_en="France", continent="Europe", region="Western Europe")
    db_session.add_all([c1, c2])
    await db_session.commit()

    a_id, b_id = sorted([c1.id, c2.id])
    border = Border(country_a_id=a_id, country_b_id=b_id)
    db_session.add(border)
    await db_session.commit()

    challenge = DailyChallenge(
        challenge_date=date.today(),
        start_country_id=c1.id,
        end_country_id=c2.id,
        shortest_path=2
    )
    db_session.add(challenge)
    await db_session.commit()

    # Test
    response = await client.post(
        "/api/game/guess",
        json={
            "challenge_id": str(challenge.id),
            "country_id": str(c2.id)
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "score_emoji" in data
    assert "country" in data
    assert data["is_destination"] is True


@pytest.mark.asyncio
async def test_create_practice_session(client, db_session):
    """POST /api/game/practice/session creates ephemeral practice session."""
    c1 = Country(code="ESP", name_ar="إسبانيا", name_en="Spain", continent="Europe", region="Southern Europe")
    c2 = Country(code="FRA", name_ar="فرنسا", name_en="France", continent="Europe", region="Western Europe")
    db_session.add_all([c1, c2])
    await db_session.commit()

    a_id, b_id = sorted([c1.id, c2.id])
    border = Border(country_a_id=a_id, country_b_id=b_id)
    db_session.add(border)
    await db_session.commit()

    response = await client.post(
        "/api/game/practice/session",
        json={
            "start_country_id": str(c1.id),
            "end_country_id": str(c2.id),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "practice"
    assert data["start_country"]["code"] == "ESP"
    assert data["end_country"]["code"] == "FRA"
    assert "session_id" in data


@pytest.mark.asyncio
async def test_submit_practice_guess(client, db_session):
    """POST /api/game/practice/guess processes guess in practice mode."""
    c1 = Country(code="BEL", name_ar="بلجيكا", name_en="Belgium", continent="Europe", region="Western Europe")
    c2 = Country(code="NLD", name_ar="هولندا", name_en="Netherlands", continent="Europe", region="Western Europe")
    db_session.add_all([c1, c2])
    await db_session.commit()

    a_id, b_id = sorted([c1.id, c2.id])
    border = Border(country_a_id=a_id, country_b_id=b_id)
    db_session.add(border)
    await db_session.commit()

    session_response = await client.post(
        "/api/game/practice/session",
        json={
            "start_country_id": str(c1.id),
            "end_country_id": str(c2.id),
        },
    )
    assert session_response.status_code == 200
    session_id = session_response.json()["session_id"]

    guess_response = await client.post(
        "/api/game/practice/guess",
        json={
            "session_id": session_id,
            "country_id": str(c2.id),
        },
    )
    assert guess_response.status_code == 200
    data = guess_response.json()
    assert data["is_destination"] is True
    assert data["game_complete"] is True

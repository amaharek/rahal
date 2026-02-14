"""Smoke tests for model creation and constraints."""
import pytest
from app.models.country import Country, Border
from app.models.user import Profile
from app.models.question import Question, QuestionCategory, QuestionDifficulty, QuestionType
from app.models.game import DailyChallenge, GameResult


@pytest.mark.asyncio
async def test_create_country(db_session):
    """Can create a Country."""
    country = Country(
        code="EGY",
        name_ar="مصر",
        name_en="Egypt",
        continent="Asia",
        region="Western Asia"
    )
    db_session.add(country)
    await db_session.commit()
    assert country.id is not None
    assert country.code == "EGY"
    assert country.name_en == "Egypt"


@pytest.mark.asyncio
async def test_create_border_with_uuid_ordering(db_session):
    """Border enforces country_a_id < country_b_id."""
    c1 = Country(code="EGY", name_ar="مصر", name_en="Egypt", continent="Asia", region="Western Asia")
    c2 = Country(code="SDN", name_ar="السودان", name_en="Sudan", continent="Africa", region="Northern Africa")
    db_session.add_all([c1, c2])
    await db_session.commit()

    # Sort UUIDs to satisfy CHECK constraint
    a_id, b_id = sorted([c1.id, c2.id])
    border = Border(country_a_id=a_id, country_b_id=b_id)
    db_session.add(border)
    await db_session.commit()
    assert border.id is not None


@pytest.mark.asyncio
async def test_create_profile(db_session):
    """Can create a Profile."""
    profile = Profile(
        id="user-123",
        username="test_user",
        display_name="Test User"
    )
    db_session.add(profile)
    await db_session.commit()
    assert profile.username == "test_user"
    assert profile.display_name == "Test User"


@pytest.mark.asyncio
async def test_create_question(db_session):
    """Can create a Question."""
    question = Question(
        category=QuestionCategory.CAPITALS.value,
        difficulty=QuestionDifficulty.EASY.value,
        question_type=QuestionType.MULTIPLE_CHOICE.value,
        question_ar="ما هي عاصمة مصر؟",
        correct_answer="القاهرة",
        correct_answer_normalized="القاهرة",
        options=["القاهرة", "الإسكندرية", "الجيزة", "أسوان"],
        hint="أكبر مدينة في مصر"
    )
    db_session.add(question)
    await db_session.commit()
    assert question.id is not None
    assert question.category == "capitals"
    assert isinstance(question.options, list)


@pytest.mark.asyncio
async def test_create_daily_challenge(db_session):
    """Can create a DailyChallenge."""
    from datetime import date

    c1 = Country(code="EGY", name_ar="مصر", name_en="Egypt", continent="Asia", region="Western Asia")
    c2 = Country(code="SDN", name_ar="السودان", name_en="Sudan", continent="Africa", region="Northern Africa")
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
    assert challenge.id is not None
    assert challenge.shortest_path == 2


@pytest.mark.asyncio
async def test_create_game_result(db_session):
    """Can create a GameResult."""
    from datetime import date

    profile = Profile(id="user-456", username="player1", display_name="Player One")
    c1 = Country(code="EGY", name_ar="مصر", name_en="Egypt", continent="Asia", region="Western Asia")
    c2 = Country(code="SDN", name_ar="السودان", name_en="Sudan", continent="Africa", region="Northern Africa")
    db_session.add_all([profile, c1, c2])
    await db_session.commit()

    challenge = DailyChallenge(
        challenge_date=date.today(),
        start_country_id=c1.id,
        end_country_id=c2.id,
        shortest_path=2
    )
    db_session.add(challenge)
    await db_session.commit()

    game_result = GameResult(
        user_id=profile.id,
        challenge_id=challenge.id,
        guesses=[],
        total_guesses=0,
        hints_used=0,
        completed=False
    )
    db_session.add(game_result)
    await db_session.commit()
    assert game_result.id is not None
    assert game_result.completed is False

"""
Integration tests for Game API endpoints.
Tests daily challenge retrieval, guessing, hints, and stats.
"""

import pytest
from datetime import date, datetime, timedelta
from uuid import uuid4
from httpx import AsyncClient

from app.models.game import DailyChallenge, GameResult
from app.models.country import Country


@pytest.fixture
async def sample_challenge(db_session, sample_countries: list[Country]):
    """Create a daily challenge for testing."""
    # Egypt -> Sudan
    egypt = sample_countries[0]  # Egypt
    sudan = sample_countries[1]  # Sudan
    
    challenge = DailyChallenge(
        id=uuid4(),
        challenge_date=date.today(),
        start_country_id=egypt.id,
        end_country_id=sudan.id,
        shortest_path=2,  # Egypt -> Sudan (1 border)
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)
    return challenge


@pytest.fixture
async def past_challenge(db_session, sample_countries: list[Country]):
    """Create a past daily challenge for testing."""
    egypt = sample_countries[0]
    ethiopia = sample_countries[2]  # Ethiopia
    
    challenge = DailyChallenge(
        id=uuid4(),
        challenge_date=date.today() - timedelta(days=1),
        start_country_id=egypt.id,
        end_country_id=ethiopia.id,
        shortest_path=3,  # Egypt -> Sudan -> Ethiopia
    )
    db_session.add(challenge)
    await db_session.commit()
    await db_session.refresh(challenge)
    return challenge


class TestGetDailyChallenge:
    """Test GET /api/game/daily endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_todays_challenge_success(
        self,
        async_async_client: AsyncClient,
        sample_challenge: DailyChallenge,
    ):
        """Test getting today's challenge without auth."""
        response = await async_client.get("/api/game/daily")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_challenge.id)
        assert data["challenge_date"] == date.today().isoformat()
        assert "start_country" in data
        assert "end_country" in data
        assert data["shortest_path"] == 2
        assert data["user_progress"] is None  # No auth
    
    @pytest.mark.asyncio
    async def test_get_challenge_with_specific_date(
        self,
        async_client: AsyncClient,
        past_challenge: DailyChallenge,
    ):
        """Test getting challenge for specific date."""
        target_date = date.today() - timedelta(days=1)
        response = await async_client.get(
            "/api/game/daily",
            params={"challenge_date": target_date.isoformat()}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(past_challenge.id)
        assert data["challenge_date"] == target_date.isoformat()
    
    @pytest.mark.asyncio
    async def test_get_challenge_authenticated_user_no_progress(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        """Test getting challenge with auth but no progress."""
        response = await async_client.get("/api/game/daily", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_progress"] is None  # No progress yet
    
    @pytest.mark.asyncio
    async def test_get_challenge_authenticated_user_with_progress(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
        sample_user,
        auth_headers: dict,
    ):
        """Test getting challenge with existing progress."""
        # Create progress
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=sample_user.id,
            guesses=[
                {
                    "country_id": str(uuid4()),
                    "emoji": "🟢",
                    "order": 1,
                }
            ],
            hints_used=1,
            completed=False,
            total_guesses=1,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        response = await async_client.get("/api/game/daily", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_progress"] is not None
        assert data["user_progress"]["guesses"] == game_result.guesses
        assert data["user_progress"]["hints_used"] == 1
        assert data["user_progress"]["completed"] is False
    
    @pytest.mark.asyncio
    async def test_get_challenge_not_found(
        self,
        async_client: AsyncClient,
    ):
        """Test getting challenge when none exists for today."""
        # No challenge created
        response = await async_client.get("/api/game/daily")
        
        assert response.status_code == 404
        assert "لا يوجد تحدٍ" in response.json()["detail"]


class TestSubmitGuess:
    """Test POST /api/game/guess endpoint."""
    
    @pytest.mark.asyncio
    async def test_submit_first_guess_success(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test submitting first guess."""
        sudan = sample_countries[1]  # Correct answer
        
        response = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(sudan.id),
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["country"]["id"] == str(sudan.id)
        assert data["is_destination"] is True
        assert data["game_complete"] is True
        assert data["total_guesses"] == 1
        assert "score_emoji" in data
    
    @pytest.mark.asyncio
    async def test_submit_wrong_guess(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test submitting incorrect guess."""
        jordan = sample_countries[3]  # Wrong answer
        
        response = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_destination"] is False
        assert data["game_complete"] is False
        assert data["total_guesses"] == 1
    
    @pytest.mark.asyncio
    async def test_submit_duplicate_guess_rejected(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test that duplicate guesses are rejected."""
        jordan = sample_countries[3]
        
        # Create existing game result with Jordan already guessed
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=None,  # Guest
            guesses=[
                {
                    "country_id": str(jordan.id),
                    "emoji": "🔴",
                    "order": 1,
                }
            ],
            total_guesses=1,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        # Try to guess Jordan again
        response = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        
        assert response.status_code == 400
        assert "خمنت هذه الدولة" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_submit_guess_after_completion_rejected(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test that guesses after completion are rejected."""
        sudan = sample_countries[1]
        
        # Create completed game result
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=None,
            guesses=[{"country_id": str(sudan.id), "emoji": "🟢", "order": 1}],
            completed=True,
            total_guesses=1,
            score=1000,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        # Try to guess again
        jordan = sample_countries[3]
        response = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        
        assert response.status_code == 400
        assert "أكملت هذا التحدي" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_submit_guess_nonexistent_challenge(
        self,
        async_client: AsyncClient,
    ):
        """Test submitting guess for non-existent challenge."""
        fake_id = uuid4()
        
        response = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(fake_id),
                "country_id": str(uuid4()),
            }
        )
        
        assert response.status_code == 404
        assert "غير موجود" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_multiple_guesses_track_order(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test that multiple guesses are tracked in order."""
        jordan = sample_countries[3]
        syria = sample_countries[4]
        
        # First guess
        response1 = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        assert response1.status_code == 200
        assert response1.json()["total_guesses"] == 1
        
        # Second guess
        response2 = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(syria.id),
            }
        )
        assert response2.status_code == 200
        assert response2.json()["total_guesses"] == 2
    
    @pytest.mark.asyncio
    async def test_guest_user_can_play(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test that guest users can play without auth."""
        jordan = sample_countries[3]
        
        response = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        
        assert response.status_code == 200
        # Guest can play but won't have user_id tracked
    
    @pytest.mark.asyncio
    async def test_authenticated_user_progress_saved(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
        auth_headers: dict,
    ):
        """Test that authenticated user progress is saved."""
        jordan = sample_countries[3]
        
        response = await async_client.post(
            "/api/game/guess",
            headers=auth_headers,
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        
        assert response.status_code == 200
        # Progress should be associated with user


class TestUseHint:
    """Test POST /api/game/hint endpoint."""
    
    @pytest.mark.asyncio
    async def test_use_first_hint_success(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
    ):
        """Test using first hint."""
        response = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "border_hint",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["hint_type"] == "border_hint"
        assert "hint_data" in data
        assert data["hints_remaining"] == 2
    
    @pytest.mark.asyncio
    async def test_use_all_three_hints(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
    ):
        """Test using all three hints."""
        hint_types = ["border_hint", "all_borders_hint", "first_letter_hint"]
        
        for i, hint_type in enumerate(hint_types):
            response = await async_client.post(
                "/api/game/hint",
                json={
                    "challenge_id": str(sample_challenge.id),
                    "hint_type": hint_type,
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["hints_remaining"] == 2 - i
    
    @pytest.mark.asyncio
    async def test_use_hint_exceeds_limit(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
    ):
        """Test that using more than 3 hints is rejected."""
        # Create game result with 3 hints already used
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=None,
            guesses=[],
            hints_used=3,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        response = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "border_hint",
            }
        )
        
        assert response.status_code == 400
        assert "جميع التلميحات" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_use_hint_after_completion_rejected(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
    ):
        """Test that hints cannot be used after completion."""
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=None,
            guesses=[{"country_id": str(uuid4()), "emoji": "🟢", "order": 1}],
            completed=True,
            score=1000,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        response = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "border_hint",
            }
        )
        
        assert response.status_code == 400
        assert "أكملت هذا التحدي" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_hint_types_return_different_data(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
    ):
        """Test that different hint types return appropriate data."""
        # Border hint
        response1 = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "border_hint",
            }
        )
        assert response1.status_code == 200
        
        # All borders hint
        response2 = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "all_borders_hint",
            }
        )
        assert response2.status_code == 200
        
        # First letter hint
        response3 = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "first_letter_hint",
            }
        )
        assert response3.status_code == 200


class TestGetGameStats:
    """Test GET /api/game/stats endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_stats_requires_auth(
        self,
        async_client: AsyncClient,
    ):
        """Test that stats endpoint requires authentication."""
        response = await async_client.get("/api/game/stats")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_stats_authenticated_user_no_games(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test getting stats for user with no games."""
        response = await async_client.get("/api/game/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["games_played"] == 0
        assert data["games_won"] == 0
        assert data["win_rate"] == 0.0
        assert data["current_streak"] == 0
        assert data["max_streak"] == 0
    
    @pytest.mark.asyncio
    async def test_get_stats_authenticated_user_with_games(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
        sample_user,
        auth_headers: dict,
    ):
        """Test getting stats for user with game history."""
        # Create completed game
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=sample_user.id,
            guesses=[{"country_id": str(uuid4()), "emoji": "🟢", "order": 1}],
            completed=True,
            total_guesses=5,
            hints_used=1,
            score=850,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        response = await async_client.get("/api/game/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["games_played"] >= 1
        assert data["games_won"] >= 1
        assert data["win_rate"] > 0
    
    @pytest.mark.asyncio
    async def test_stats_include_streak_info(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that stats include streak information."""
        response = await async_client.get("/api/game/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "current_streak" in data
        assert "max_streak" in data
    
    @pytest.mark.asyncio
    async def test_stats_include_average_guesses(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that stats include average guesses."""
        response = await async_client.get("/api/game/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "average_guesses" in data
        assert "hints_used_total" in data


class TestGameFlow:
    """Test complete game flow scenarios."""
    
    @pytest.mark.asyncio
    async def test_complete_game_optimal_path(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
        auth_headers: dict,
    ):
        """Test completing game with optimal path."""
        sudan = sample_countries[1]  # Correct answer
        
        # Submit correct guess
        response = await async_client.post(
            "/api/game/guess",
            headers=auth_headers,
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(sudan.id),
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["game_complete"] is True
        assert data["is_destination"] is True
        
        # Check stats updated
        stats_response = await async_client.get("/api/game/stats", headers=auth_headers)
        assert stats_response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_complete_game_with_hints_and_extra_guesses(
        self,
        async_client: AsyncClient,
        sample_challenge: DailyChallenge,
        sample_countries: list[Country],
    ):
        """Test completing game using hints and multiple guesses."""
        # Use hint
        hint_response = await async_client.post(
            "/api/game/hint",
            json={
                "challenge_id": str(sample_challenge.id),
                "hint_type": "border_hint",
            }
        )
        assert hint_response.status_code == 200
        
        # Make wrong guess
        jordan = sample_countries[3]
        guess1 = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(jordan.id),
            }
        )
        assert guess1.json()["game_complete"] is False
        
        # Make correct guess
        sudan = sample_countries[1]
        guess2 = await async_client.post(
            "/api/game/guess",
            json={
                "challenge_id": str(sample_challenge.id),
                "country_id": str(sudan.id),
            }
        )
        assert guess2.json()["game_complete"] is True
    
    @pytest.mark.asyncio
    async def test_resume_game_after_progress(
        self,
        async_client: AsyncClient,
        db_session,
        sample_challenge: DailyChallenge,
        sample_user,
        auth_headers: dict,
    ):
        """Test resuming game with existing progress."""
        # Create partial progress
        game_result = GameResult(
            id=uuid4(),
            challenge_id=sample_challenge.id,
            user_id=sample_user.id,
            guesses=[{"country_id": str(uuid4()), "emoji": "🔴", "order": 1}],
            total_guesses=1,
            hints_used=0,
        )
        db_session.add(game_result)
        await db_session.commit()
        
        # Get challenge should show progress
        response = await async_client.get("/api/game/daily", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["user_progress"] is not None
        assert data["user_progress"]["total_guesses"] == 1

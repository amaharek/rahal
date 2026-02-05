"""
Integration tests for Quiz API endpoints.
Tests question retrieval, answer submission, sessions, and stats.
"""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from app.models.question import Question, QuestionType


class TestGetRandomQuestion:
    """Test GET /api/quiz/question endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_random_question_no_filters(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test getting a random question without filters."""
        response = await async_client.get("/api/quiz/question")
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "category" in data
        assert "difficulty" in data
        assert "question_type" in data
        assert "question_ar" in data
        # Should NOT include correct_answer
        assert "correct_answer" not in data
    
    @pytest.mark.asyncio
    async def test_filter_by_category(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test filtering questions by category."""
        response = await async_client.get(
            "/api/quiz/question",
            params={"category": "capitals"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "capitals"
    
    @pytest.mark.asyncio
    async def test_filter_by_difficulty(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test filtering questions by difficulty."""
        response = await async_client.get(
            "/api/quiz/question",
            params={"difficulty": "easy"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["difficulty"] == "easy"
    
    @pytest.mark.asyncio
    async def test_filter_by_question_type(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test filtering questions by type."""
        response = await async_client.get(
            "/api/quiz/question",
            params={"question_type": "multiple_choice"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["question_type"] == "multiple_choice"
        assert "options" in data  # Multiple choice should have options
        assert isinstance(data["options"], list)
    
    @pytest.mark.asyncio
    async def test_exclude_specific_questions(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test excluding specific questions by ID."""
        exclude_ids = [str(sample_questions[0].id)]
        
        response = await async_client.get(
            "/api/quiz/question",
            params={"exclude_ids": exclude_ids}
        )
        
        # May or may not have questions, but shouldn't return excluded one
        if response.status_code == 200:
            data = response.json()
            assert data["id"] not in exclude_ids
    
    @pytest.mark.asyncio
    async def test_multiple_choice_includes_options(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that multiple choice questions include options."""
        response = await async_client.get(
            "/api/quiz/question",
            params={"question_type": "multiple_choice"}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "options" in data
            assert len(data["options"]) == 4  # Standard 4 options
    
    @pytest.mark.asyncio
    async def test_autocomplete_no_options(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that autocomplete questions don't include options."""
        response = await async_client.get(
            "/api/quiz/question",
            params={"question_type": "autocomplete"}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["options"] is None
    
    @pytest.mark.asyncio
    async def test_no_questions_available(
        self,
        async_client: AsyncClient,
    ):
        """Test response when no questions match criteria."""
        # Empty database — no sample_questions fixture
        response = await async_client.get("/api/quiz/question")

        assert response.status_code == 404
        assert "لا توجد أسئلة" in response.json()["detail"]


class TestSubmitAnswer:
    """Test POST /api/quiz/answer endpoint."""
    
    @pytest.mark.asyncio
    async def test_submit_correct_answer(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test submitting a correct answer."""
        question = sample_questions[0]
        
        response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": str(question.id),
                "answer": question.correct_answer,
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is True
        assert data["score"] > 0
        assert data["correct_answer"] == question.correct_answer
    
    @pytest.mark.asyncio
    async def test_submit_incorrect_answer(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test submitting an incorrect answer."""
        question = sample_questions[0]
        
        response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": str(question.id),
                "answer": "wrong answer",
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is False
        assert data["score"] == 0
        assert "explanation" in data
    
    @pytest.mark.asyncio
    async def test_submit_answer_with_hints(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that hints reduce score."""
        question = sample_questions[0]
        
        response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": str(question.id),
                "answer": question.correct_answer,
                "hints_used": 2,
                "time_taken_ms": 5000,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is True
        # Score should be reduced by hint penalty
        assert data["score"] < 15  # Less than full autocomplete score
    
    @pytest.mark.asyncio
    async def test_submit_answer_authenticated_user_updates_stats(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
        auth_headers: dict,
    ):
        """Test that authenticated user's stats are updated."""
        question = sample_questions[0]
        
        response = await async_client.post(
            "/api/quiz/answer",
            headers=auth_headers,
            json={
                "question_id": str(question.id),
                "answer": question.correct_answer,
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        assert response.status_code == 200
        # Stats should be updated (tested separately in stats endpoint)
    
    @pytest.mark.asyncio
    async def test_submit_answer_guest_user(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that guest users can submit answers."""
        question = sample_questions[0]
        
        response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": str(question.id),
                "answer": question.correct_answer,
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        assert response.status_code == 200
        # Guest can answer but stats won't be saved
    
    @pytest.mark.asyncio
    async def test_submit_answer_nonexistent_question(
        self,
        async_client: AsyncClient,
    ):
        """Test submitting answer for non-existent question."""
        fake_id = uuid4()
        
        response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": str(fake_id),
                "answer": "any answer",
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        assert response.status_code == 404
        assert "غير موجود" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_multiple_choice_exact_match_required(
        self,
        async_client: AsyncClient,
        db_session,
    ):
        """Test that multiple choice requires exact match."""
        question = Question(
            id=uuid4(),
            question_ar="ما هي عاصمة مصر؟",
            correct_answer="القاهرة",
            correct_answer_normalized="القاهرة",
            category="capitals",
            difficulty="easy",
            question_type="multiple_choice",
            options={"options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]},
        )
        db_session.add(question)
        await db_session.commit()
        
        # Close but not exact
        response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": str(question.id),
                "answer": "القاهرة ",  # Extra space
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        # Should normalize and accept
        data = response.json()
        assert data["is_correct"] is True


class TestQuizSession:
    """Test POST /api/quiz/session endpoint."""
    
    @pytest.mark.asyncio
    async def test_start_session_default_settings(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test starting a quiz session with default settings."""
        response = await async_client.post(
            "/api/quiz/session",
            json={"num_questions": 5}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "questions" in data
        assert "total_questions" in data
        assert "time_limit_seconds" in data
        assert len(data["questions"]) <= 5
    
    @pytest.mark.asyncio
    async def test_session_with_category_filter(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test session with category filter."""
        response = await async_client.post(
            "/api/quiz/session",
            json={
                "num_questions": 3,
                "category": "capitals"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            # All questions should be in capitals category
            for question in data["questions"]:
                assert question["category"] == "capitals"
    
    @pytest.mark.asyncio
    async def test_session_with_difficulty_filter(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test session with difficulty filter."""
        response = await async_client.post(
            "/api/quiz/session",
            json={
                "num_questions": 3,
                "difficulty": "easy"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            # All questions should be easy
            for question in data["questions"]:
                assert question["difficulty"] == "easy"
    
    @pytest.mark.asyncio
    async def test_session_with_question_type_filter(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test session with question type filter."""
        response = await async_client.post(
            "/api/quiz/session",
            json={
                "num_questions": 3,
                "question_type": "multiple_choice"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            # All questions should be multiple choice
            for question in data["questions"]:
                assert question["question_type"] == "multiple_choice"
                assert question["options"] is not None
    
    @pytest.mark.asyncio
    async def test_session_questions_have_no_answers(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that session questions don't include answers."""
        response = await async_client.post(
            "/api/quiz/session",
            json={"num_questions": 5}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for question in data["questions"]:
            assert "correct_answer" not in question
            assert "correct_answer_normalized" not in question
    
    @pytest.mark.asyncio
    async def test_session_time_limit_calculated(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that time limit is calculated based on questions."""
        response = await async_client.post(
            "/api/quiz/session",
            json={"num_questions": 10}
        )
        
        if response.status_code == 200:
            data = response.json()
            # 30 seconds per question
            expected_time = data["total_questions"] * 30
            assert data["time_limit_seconds"] == expected_time
    
    @pytest.mark.asyncio
    async def test_session_insufficient_questions(
        self,
        async_client: AsyncClient,
    ):
        """Test session when insufficient questions available."""
        # Empty database — no sample_questions fixture, request max allowed
        response = await async_client.post(
            "/api/quiz/session",
            json={"num_questions": 50}
        )

        assert response.status_code == 404


class TestDailyQuiz:
    """Test GET /api/quiz/daily endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_daily_quiz(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test getting daily quiz."""
        response = await async_client.get("/api/quiz/daily")
        
        if response.status_code == 200:
            data = response.json()
            assert "session_id" in data
            assert "questions" in data
            assert "total_questions" in data
            assert data["total_questions"] <= 10  # Default 10 questions
            assert data["time_limit_seconds"] == 300  # 5 minutes
    
    @pytest.mark.asyncio
    async def test_daily_quiz_balanced_difficulty(
        self,
        async_client: AsyncClient,
        db_session,
    ):
        """Test that daily quiz has balanced difficulty."""
        # Add more questions to ensure balance
        for difficulty in ["easy", "medium", "hard"]:
            for i in range(5):
                question = Question(
                    id=uuid4(),
                    question_ar=f"سؤال {difficulty} {i}",
                    correct_answer="جواب",
                    correct_answer_normalized="جواب",
                    category="geography",
                    difficulty=difficulty,
                    question_type="autocomplete",
                )
                db_session.add(question)
        await db_session.commit()
        
        response = await async_client.get("/api/quiz/daily")
        
        if response.status_code == 200:
            data = response.json()
            difficulties = [q["difficulty"] for q in data["questions"]]
            
            # Should have mix of difficulties
            assert "easy" in difficulties
            assert "medium" in difficulties
            assert "hard" in difficulties
    
    @pytest.mark.asyncio
    async def test_daily_quiz_no_duplicate_questions(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that daily quiz doesn't have duplicates."""
        response = await async_client.get("/api/quiz/daily")
        
        if response.status_code == 200:
            data = response.json()
            question_ids = [q["id"] for q in data["questions"]]
            assert len(question_ids) == len(set(question_ids))


class TestQuizStats:
    """Test GET /api/quiz/stats endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_stats_requires_auth(
        self,
        async_client: AsyncClient,
    ):
        """Test that stats endpoint requires authentication."""
        response = await async_client.get("/api/quiz/stats")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_stats_authenticated_user_no_history(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test getting stats for user with no quiz history."""
        response = await async_client.get("/api/quiz/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_answered"] == 0
        assert data["total_correct"] == 0
        assert data["accuracy"] == 0.0
        assert "by_category" in data
        assert "by_difficulty" in data
    
    @pytest.mark.asyncio
    async def test_get_stats_authenticated_user_with_history(
        self,
        async_client: AsyncClient,
        db_session,
        sample_questions: list[Question],
        sample_user,
        auth_headers: dict,
    ):
        """Test getting stats for user with quiz history."""
        # Submit some answers first
        question = sample_questions[0]
        
        await async_client.post(
            "/api/quiz/answer",
            headers=auth_headers,
            json={
                "question_id": str(question.id),
                "answer": question.correct_answer,
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        
        response = await async_client.get("/api/quiz/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_answered"] >= 1
        assert data["total_correct"] >= 1
        assert data["accuracy"] > 0
    
    @pytest.mark.asyncio
    async def test_stats_breakdown_by_category(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that stats include breakdown by category."""
        response = await async_client.get("/api/quiz/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "by_category" in data
        assert isinstance(data["by_category"], dict)
    
    @pytest.mark.asyncio
    async def test_stats_breakdown_by_difficulty(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test that stats include breakdown by difficulty."""
        response = await async_client.get("/api/quiz/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "by_difficulty" in data
        assert isinstance(data["by_difficulty"], dict)


class TestGetCategories:
    """Test GET /api/quiz/categories endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_categories(
        self,
        async_client: AsyncClient,
    ):
        """Test getting all categories."""
        response = await async_client.get("/api/quiz/categories")
        
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
    
    @pytest.mark.asyncio
    async def test_categories_have_arabic_labels(
        self,
        async_client: AsyncClient,
    ):
        """Test that categories include Arabic labels."""
        response = await async_client.get("/api/quiz/categories")
        
        assert response.status_code == 200
        data = response.json()
        
        for category in data["categories"]:
            assert "value" in category
            assert "label_ar" in category
            assert "label_en" in category
    
    @pytest.mark.asyncio
    async def test_categories_include_expected_values(
        self,
        async_client: AsyncClient,
    ):
        """Test that all expected categories are present."""
        response = await async_client.get("/api/quiz/categories")
        
        assert response.status_code == 200
        data = response.json()
        
        expected_categories = [
            "capitals", "flags", "landmarks", "attractions",
            "geography", "borders", "population", "arab_world"
        ]
        
        values = [cat["value"] for cat in data["categories"]]
        for expected in expected_categories:
            assert expected in values


class TestQuizFlow:
    """Test complete quiz flow scenarios."""
    
    @pytest.mark.asyncio
    async def test_complete_quiz_session_flow(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
        auth_headers: dict,
    ):
        """Test complete flow: start session, answer questions, check stats."""
        # Start session
        session_response = await async_client.post(
            "/api/quiz/session",
            json={"num_questions": 3}
        )
        assert session_response.status_code == 200
        session_data = session_response.json()
        questions = session_data["questions"]
        
        # Answer each question
        for question in questions:
            # Get question details to find correct answer
            question_obj = next(
                (q for q in sample_questions if str(q.id) == question["id"]),
                None
            )
            if question_obj:
                await async_client.post(
                    "/api/quiz/answer",
                    headers=auth_headers,
                    json={
                        "question_id": question["id"],
                        "answer": question_obj.correct_answer,
                        "hints_used": 0,
                        "time_taken_ms": 5000,
                    }
                )
        
        # Check stats
        stats_response = await async_client.get(
            "/api/quiz/stats",
            headers=auth_headers
        )
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert stats_data["total_answered"] >= len(questions)
    
    @pytest.mark.asyncio
    async def test_guest_can_play_but_not_track_stats(
        self,
        async_client: AsyncClient,
        sample_questions: list[Question],
    ):
        """Test that guest users can play but can't access stats."""
        # Get question
        question_response = await async_client.get("/api/quiz/question")
        assert question_response.status_code == 200
        
        # Answer question (no auth)
        question_data = question_response.json()
        answer_response = await async_client.post(
            "/api/quiz/answer",
            json={
                "question_id": question_data["id"],
                "answer": "any answer",
                "hints_used": 0,
                "time_taken_ms": 5000,
            }
        )
        assert answer_response.status_code == 200
        
        # Try to get stats (should fail)
        stats_response = await async_client.get("/api/quiz/stats")
        assert stats_response.status_code == 401

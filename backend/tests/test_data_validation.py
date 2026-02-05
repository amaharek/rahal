"""
Data validation tests for Rahal database.
These tests verify data integrity, completeness, and quality.
Should be run before and after seeding the database.
"""

import pytest
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.country import Country, CountryBorder
from app.models.question import Question
from app.crud.country import country_crud


class TestBorderGraphCompleteness:
    """Test border graph data quality and completeness."""
    
    @pytest.mark.asyncio
    async def test_minimum_border_count(self, db_session: AsyncSession):
        """
        Test that the database has at least 300 bidirectional border relationships.
        This is the minimum required for a complete game experience per PRD.
        """
        result = await db_session.execute(select(func.count()).select_from(CountryBorder))
        border_count = result.scalar()
        
        assert border_count >= 300, (
            f"Expected at least 300 borders for complete graph, got {border_count}. "
            "Complete data/borders.json seeding required."
        )
    
    @pytest.mark.asyncio
    async def test_all_borders_are_bidirectional(self, db_session: AsyncSession):
        """
        Test that border relationships are properly bidirectional.
        If A borders B, then B should border A (or explicit reverse exists).
        """
        result = await db_session.execute(select(CountryBorder))
        all_borders = result.scalars().all()
        
        # Build adjacency set
        border_set = {(b.country_a_id, b.country_b_id) for b in all_borders}
        
        missing_reverse = []
        for border in all_borders:
            # Check if reverse exists (either as explicit entry or as the border itself)
            reverse = (border.country_b_id, border.country_a_id)
            if reverse not in border_set:
                missing_reverse.append((border.country_a_id, border.country_b_id))
        
        assert len(missing_reverse) == 0, (
            f"Found {len(missing_reverse)} borders without reverse relationships. "
            f"Examples: {missing_reverse[:5]}"
        )
    
    @pytest.mark.asyncio
    async def test_no_orphaned_countries(self, db_session: AsyncSession):
        """
        Test that all countries have at least one border (except known island nations).
        Orphaned countries break pathfinding.
        """
        # Known island nations that should have no land borders
        ISLAND_NATIONS = {
            "JPN",  # Japan
            "NZL",  # New Zealand
            "ISL",  # Iceland
            "CUB",  # Cuba
            "MDG",  # Madagascar
            "LKA",  # Sri Lanka
            "PHL",  # Philippines
            "IDN",  # Indonesia
            "GBR",  # United Kingdom (except Northern Ireland)
            "IRL",  # Ireland
            "AUS",  # Australia
        }
        
        countries = await country_crud.get_all_with_borders(db_session)
        
        orphaned = []
        for country in countries:
            border_count = len(country.borders_from) + len(country.borders_to)
            if border_count == 0 and country.iso_alpha_3 not in ISLAND_NATIONS:
                orphaned.append(country.name_en)
        
        assert len(orphaned) == 0, (
            f"Found {len(orphaned)} orphaned countries (no borders): {orphaned}. "
            "These countries will be unreachable in pathfinding."
        )
    
    @pytest.mark.asyncio
    async def test_no_self_referencing_borders(self, db_session: AsyncSession):
        """Test that no country borders itself."""
        result = await db_session.execute(
            select(CountryBorder).where(CountryBorder.country_a_id == CountryBorder.country_b_id)
        )
        self_borders = result.scalars().all()
        
        assert len(self_borders) == 0, (
            f"Found {len(self_borders)} self-referencing borders. "
            "Countries cannot border themselves."
        )
    
    @pytest.mark.asyncio
    async def test_graph_connectivity(self, db_session: AsyncSession):
        """
        Test that major continents form connected subgraphs.
        All European countries should be reachable from each other, etc.
        """
        countries = await country_crud.get_all_with_borders(db_session)
        
        # Build adjacency graph
        graph = {}
        continent_countries = {}
        
        for country in countries:
            graph[country.id] = set()
            if country.continent not in continent_countries:
                continent_countries[country.continent] = []
            continent_countries[country.continent].append(country.id)
            
            for border in country.borders_from:
                graph[country.id].add(border.country_b_id)
            for border in country.borders_to:
                graph[country.id].add(border.country_a_id)
        
        # Test connectivity for continents with >5 countries
        def is_connected(start_id, country_ids):
            """BFS to check if all countries are reachable."""
            if not country_ids:
                return True
            
            visited = {start_id}
            queue = [start_id]
            
            while queue:
                current = queue.pop(0)
                for neighbor in graph.get(current, set()):
                    if neighbor in country_ids and neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)
            
            return len(visited) == len(country_ids)
        
        disconnected_continents = []
        for continent, country_ids in continent_countries.items():
            if len(country_ids) > 5:  # Only test large continents
                if not is_connected(country_ids[0], country_ids):
                    disconnected_continents.append(continent)
        
        assert len(disconnected_continents) == 0, (
            f"Found disconnected continents: {disconnected_continents}. "
            "Not all countries within these continents are reachable from each other."
        )


class TestCountryDataCompleteness:
    """Test country data quality and completeness."""
    
    @pytest.mark.asyncio
    async def test_all_countries_have_required_fields(self, db_session: AsyncSession):
        """Test that all countries have complete required data."""
        result = await db_session.execute(select(Country))
        countries = result.scalars().all()
        
        assert len(countries) > 0, "No countries found in database"
        
        incomplete = []
        for country in countries:
            missing_fields = []
            if not country.name_ar:
                missing_fields.append("name_ar")
            if not country.name_en:
                missing_fields.append("name_en")
            if not country.iso_alpha_2:
                missing_fields.append("iso_alpha_2")
            if not country.iso_alpha_3:
                missing_fields.append("iso_alpha_3")
            if not country.flag_emoji:
                missing_fields.append("flag_emoji")
            if not country.continent:
                missing_fields.append("continent")
            
            if missing_fields:
                incomplete.append((country.name_en or "Unknown", missing_fields))
        
        assert len(incomplete) == 0, (
            f"Found {len(incomplete)} countries with missing required fields: "
            f"{incomplete[:5]}"
        )
    
    @pytest.mark.asyncio
    async def test_arabic_names_are_valid(self, db_session: AsyncSession):
        """Test that Arabic names contain Arabic characters."""
        result = await db_session.execute(select(Country))
        countries = result.scalars().all()
        
        invalid_arabic = []
        for country in countries:
            if country.name_ar:
                # Check if name contains at least one Arabic character (U+0600 to U+06FF)
                has_arabic = any('\u0600' <= char <= '\u06FF' for char in country.name_ar)
                if not has_arabic:
                    invalid_arabic.append(country.name_en)
        
        assert len(invalid_arabic) == 0, (
            f"Found {len(invalid_arabic)} countries with non-Arabic name_ar: {invalid_arabic[:5]}"
        )
    
    @pytest.mark.asyncio
    async def test_iso_codes_are_unique(self, db_session: AsyncSession):
        """Test that ISO codes are unique."""
        result = await db_session.execute(select(Country))
        countries = result.scalars().all()
        
        iso2_codes = [c.iso_alpha_2 for c in countries if c.iso_alpha_2]
        iso3_codes = [c.iso_alpha_3 for c in countries if c.iso_alpha_3]
        
        duplicate_iso2 = len(iso2_codes) - len(set(iso2_codes))
        duplicate_iso3 = len(iso3_codes) - len(set(iso3_codes))
        
        assert duplicate_iso2 == 0, f"Found {duplicate_iso2} duplicate ISO Alpha-2 codes"
        assert duplicate_iso3 == 0, f"Found {duplicate_iso3} duplicate ISO Alpha-3 codes"
    
    @pytest.mark.asyncio
    async def test_coordinates_are_valid(self, db_session: AsyncSession):
        """Test that coordinates are within valid ranges."""
        result = await db_session.execute(select(Country))
        countries = result.scalars().all()
        
        invalid_coords = []
        for country in countries:
            if country.latitude and (country.latitude < -90 or country.latitude > 90):
                invalid_coords.append((country.name_en, "latitude", country.latitude))
            if country.longitude and (country.longitude < -180 or country.longitude > 180):
                invalid_coords.append((country.name_en, "longitude", country.longitude))
        
        assert len(invalid_coords) == 0, (
            f"Found {len(invalid_coords)} countries with invalid coordinates: {invalid_coords}"
        )


class TestQuestionDataDistribution:
    """Test quiz question data quality and distribution."""
    
    @pytest.mark.asyncio
    async def test_minimum_question_count(self, db_session: AsyncSession):
        """
        Test that database has sufficient questions for varied gameplay.
        PRD targets 5000 questions eventually, but minimum 100 for launch.
        """
        result = await db_session.execute(select(func.count()).select_from(Question))
        question_count = result.scalar()
        
        assert question_count >= 100, (
            f"Expected at least 100 questions for launch, got {question_count}. "
            "More questions needed for varied quiz experience."
        )
    
    @pytest.mark.asyncio
    async def test_questions_cover_all_categories(self, db_session: AsyncSession):
        """Test that questions span all major categories."""
        result = await db_session.execute(
            select(Question.category, func.count()).group_by(Question.category)
        )
        category_counts = dict(result.all())
        
        REQUIRED_CATEGORIES = {"capitals", "geography", "flags", "landmarks", "culture"}
        missing_categories = REQUIRED_CATEGORIES - set(category_counts.keys())
        
        assert len(missing_categories) == 0, (
            f"Missing questions for categories: {missing_categories}"
        )
        
        # Each category should have at least 10 questions
        sparse_categories = {
            cat: count for cat, count in category_counts.items()
            if count < 10
        }
        
        assert len(sparse_categories) == 0, (
            f"Categories with <10 questions: {sparse_categories}"
        )
    
    @pytest.mark.asyncio
    async def test_difficulty_distribution_is_balanced(self, db_session: AsyncSession):
        """Test that questions have balanced difficulty distribution."""
        result = await db_session.execute(
            select(Question.difficulty, func.count()).group_by(Question.difficulty)
        )
        difficulty_counts = dict(result.all())
        
        total = sum(difficulty_counts.values())
        if total < 30:
            pytest.skip("Need at least 30 questions to test distribution")
        
        # Each difficulty should be 20-50% of total (allowing some imbalance)
        for difficulty in ["easy", "medium", "hard"]:
            count = difficulty_counts.get(difficulty, 0)
            percentage = (count / total) * 100
            
            assert 20 <= percentage <= 50, (
                f"Difficulty '{difficulty}' is {percentage:.1f}% of total "
                f"(expected 20-50% for balanced distribution)"
            )
    
    @pytest.mark.asyncio
    async def test_question_types_are_valid(self, db_session: AsyncSession):
        """Test that all questions have valid question types."""
        result = await db_session.execute(select(Question))
        questions = result.scalars().all()
        
        VALID_TYPES = {"multiple_choice", "autocomplete", "true_false"}
        invalid_types = []
        
        for question in questions:
            if question.question_type not in VALID_TYPES:
                invalid_types.append((question.id, question.question_type))
        
        assert len(invalid_types) == 0, (
            f"Found {len(invalid_types)} questions with invalid question_type: {invalid_types}"
        )
    
    @pytest.mark.asyncio
    async def test_multiple_choice_questions_have_options(self, db_session: AsyncSession):
        """Test that multiple choice questions have 4 options."""
        result = await db_session.execute(
            select(Question).where(Question.question_type == "multiple_choice")
        )
        mc_questions = result.scalars().all()
        
        invalid_options = []
        for question in mc_questions:
            if not question.options_ar or len(question.options_ar) != 4:
                invalid_options.append((question.id, "options_ar"))
            if not question.options_en or len(question.options_en) != 4:
                invalid_options.append((question.id, "options_en"))
            
            # Correct answer should be in options
            if question.options_ar and question.correct_answer_ar not in question.options_ar:
                invalid_options.append((question.id, "answer not in options_ar"))
            if question.options_en and question.correct_answer_en not in question.options_en:
                invalid_options.append((question.id, "answer not in options_en"))
        
        assert len(invalid_options) == 0, (
            f"Found {len(invalid_options)} multiple choice questions with invalid options: "
            f"{invalid_options[:5]}"
        )
    
    @pytest.mark.asyncio
    async def test_questions_have_both_languages(self, db_session: AsyncSession):
        """Test that all questions have both Arabic and English versions."""
        result = await db_session.execute(select(Question))
        questions = result.scalars().all()
        
        incomplete = []
        for question in questions:
            if not question.question_ar or not question.question_en:
                incomplete.append((question.id, "missing question text"))
            if not question.correct_answer_ar or not question.correct_answer_en:
                incomplete.append((question.id, "missing answer"))
        
        assert len(incomplete) == 0, (
            f"Found {len(incomplete)} questions with missing translations: {incomplete[:5]}"
        )


class TestDatabaseSeedingIdempotency:
    """Test that seeding script can be run multiple times safely."""
    
    @pytest.mark.asyncio
    async def test_duplicate_countries_not_created(self, db_session: AsyncSession):
        """Test that running seed script twice doesn't create duplicates."""
        # This test assumes seeding script uses upsert logic
        result = await db_session.execute(
            select(Country.iso_alpha_3, func.count())
            .group_by(Country.iso_alpha_3)
            .having(func.count() > 1)
        )
        duplicates = result.all()
        
        assert len(duplicates) == 0, (
            f"Found duplicate countries: {duplicates}. "
            "Seeding script should use upsert to prevent duplicates."
        )
    
    @pytest.mark.asyncio
    async def test_duplicate_borders_not_created(self, db_session: AsyncSession):
        """Test that borders aren't duplicated."""
        result = await db_session.execute(
            select(
                CountryBorder.country_a_id,
                CountryBorder.country_b_id,
                func.count()
            )
            .group_by(CountryBorder.country_a_id, CountryBorder.country_b_id)
            .having(func.count() > 1)
        )
        duplicates = result.all()
        
        assert len(duplicates) == 0, (
            f"Found {len(duplicates)} duplicate border entries. "
            "Seeding script should check for existing borders."
        )

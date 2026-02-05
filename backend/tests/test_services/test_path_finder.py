"""
Unit tests for PathFinderService.
Tests BFS algorithm, path finding, hints generation, and edge cases.
"""

import pytest
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.path_finder import PathFinderService
from app.models.country import Country
from app.models.game import DailyChallenge


@pytest.fixture
def path_finder():
    """Create fresh PathFinderService instance."""
    return PathFinderService()


class TestGraphBuilding:
    """Test graph construction from database."""
    
    @pytest.mark.asyncio
    async def test_graph_builds_from_countries(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that graph is correctly built from country borders."""
        egypt = sample_countries[0]
        neighbors = await path_finder.get_neighbors(db_session, egypt.id)
        
        # Egypt borders Sudan and Jordan in our fixture
        assert len(neighbors) == 2
    
    @pytest.mark.asyncio
    async def test_graph_is_bidirectional(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that if A borders B, then B borders A."""
        egypt = sample_countries[0]
        sudan = sample_countries[1]
        
        egypt_neighbors = await path_finder.get_neighbors(db_session, egypt.id)
        sudan_neighbors = await path_finder.get_neighbors(db_session, sudan.id)
        
        # Egypt should be in Sudan's neighbors
        assert sudan.id in egypt_neighbors
        # Sudan should be in Egypt's neighbors
        assert egypt.id in sudan_neighbors
    
    @pytest.mark.asyncio
    async def test_graph_caches_after_first_build(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that graph is cached and not rebuilt on subsequent calls."""
        # First call builds graph
        await path_finder.get_neighbors(db_session, sample_countries[0].id)
        
        assert path_finder._graph is not None
        assert path_finder._countries is not None
        
        # Store references
        original_graph = path_finder._graph
        
        # Second call should use cached graph
        await path_finder.get_neighbors(db_session, sample_countries[1].id)
        
        assert path_finder._graph is original_graph  # Same object
    
    @pytest.mark.asyncio
    async def test_clear_cache_resets_graph(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that clear_cache removes cached graph."""
        await path_finder.get_neighbors(db_session, sample_countries[0].id)
        assert path_finder._graph is not None
        
        path_finder.clear_cache()
        
        assert path_finder._graph is None
        assert path_finder._countries is None
    
    @pytest.mark.asyncio
    async def test_empty_neighbors_for_nonexistent_country(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that non-existent country returns empty neighbors."""
        fake_id = uuid4()
        neighbors = await path_finder.get_neighbors(db_session, fake_id)
        
        assert neighbors == []


class TestShortestPathFinding:
    """Test BFS shortest path algorithm."""
    
    @pytest.mark.asyncio
    async def test_finds_direct_path(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test finding direct path between neighbors."""
        egypt = sample_countries[0]
        sudan = sample_countries[1]
        
        path = await path_finder.find_shortest_path(db_session, egypt.id, sudan.id)
        
        assert path is not None
        assert len(path) == 2
        assert path == [egypt.id, sudan.id]
    
    @pytest.mark.asyncio
    async def test_finds_multi_hop_path(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test finding path with multiple hops."""
        egypt = sample_countries[0]  # Egypt
        ethiopia = sample_countries[2]  # Ethiopia
        
        # Path: Egypt -> Sudan -> Ethiopia
        path = await path_finder.find_shortest_path(db_session, egypt.id, ethiopia.id)
        
        assert path is not None
        assert len(path) == 3
        assert path[0] == egypt.id
        assert path[-1] == ethiopia.id
    
    @pytest.mark.asyncio
    async def test_same_start_and_end_returns_single_country(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that path from country to itself is just that country."""
        egypt = sample_countries[0]
        
        path = await path_finder.find_shortest_path(db_session, egypt.id, egypt.id)
        
        assert path == [egypt.id]
    
    @pytest.mark.asyncio
    async def test_returns_none_for_no_path(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that no path returns None for isolated countries."""
        # Add an isolated island country
        island = Country(
            id=uuid4(),
            name_ar="جزيرة",
            name_en="Island",
            iso_alpha_2="IS",
            iso_alpha_3="ISL",
            flag_emoji="🏝️",
            continent="Pacific",
        )
        db_session.add(island)
        await db_session.commit()
        
        # Clear cache to rebuild graph
        path_finder.clear_cache()
        
        egypt = sample_countries[0]
        path = await path_finder.find_shortest_path(db_session, egypt.id, island.id)
        
        assert path is None
    
    @pytest.mark.asyncio
    async def test_returns_none_for_nonexistent_start(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that nonexistent start country returns None."""
        fake_id = uuid4()
        egypt = sample_countries[0]
        
        path = await path_finder.find_shortest_path(db_session, fake_id, egypt.id)
        
        assert path is None
    
    @pytest.mark.asyncio
    async def test_returns_none_for_nonexistent_end(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that nonexistent end country returns None."""
        egypt = sample_countries[0]
        fake_id = uuid4()
        
        path = await path_finder.find_shortest_path(db_session, egypt.id, fake_id)
        
        assert path is None
    
    @pytest.mark.asyncio
    async def test_shortest_path_length(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test calculating shortest path length."""
        egypt = sample_countries[0]
        ethiopia = sample_countries[2]
        
        # Path: Egypt -> Sudan -> Ethiopia (3 countries, 2 borders)
        length = await path_finder.get_shortest_path_length(db_session, egypt.id, ethiopia.id)
        
        assert length == 2


class TestMultipleShortestPaths:
    """Test finding all equally short paths."""
    
    @pytest.mark.asyncio
    async def test_finds_all_shortest_paths(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that all equally short paths are returned."""
        egypt = sample_countries[0]
        syria = sample_countries[4]
        
        # Two paths: Egypt -> Jordan -> Syria (both length 3)
        # OR if there are multiple routes
        all_paths = await path_finder.get_all_shortest_paths(db_session, egypt.id, syria.id)
        
        assert len(all_paths) >= 1
        # All paths should have same length
        if len(all_paths) > 1:
            lengths = [len(p) for p in all_paths]
            assert len(set(lengths)) == 1  # All same length
    
    @pytest.mark.asyncio
    async def test_all_paths_start_and_end_correctly(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that all paths start at start and end at end."""
        egypt = sample_countries[0]
        ethiopia = sample_countries[2]
        
        all_paths = await path_finder.get_all_shortest_paths(db_session, egypt.id, ethiopia.id)
        
        for path in all_paths:
            assert path[0] == egypt.id
            assert path[-1] == ethiopia.id
    
    @pytest.mark.asyncio
    async def test_returns_empty_list_for_no_paths(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that no paths returns empty list."""
        # Add isolated island
        island = Country(
            id=uuid4(),
            name_ar="جزيرة",
            name_en="Island",
            iso_alpha_2="IS",
            iso_alpha_3="ISL",
            flag_emoji="🏝️",
            continent="Pacific",
        )
        db_session.add(island)
        await db_session.commit()
        
        path_finder.clear_cache()
        
        egypt = sample_countries[0]
        all_paths = await path_finder.get_all_shortest_paths(db_session, egypt.id, island.id)
        
        assert all_paths == []


class TestPathValidation:
    """Test checking if country is on shortest path."""
    
    @pytest.mark.asyncio
    async def test_country_on_shortest_path_returns_true(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that country on shortest path returns True."""
        sudan = sample_countries[1]
        
        # Sudan is on path from Egypt to Ethiopia
        is_on_path = await path_finder.is_on_shortest_path(
            db_session,
            sample_daily_challenge,
            sudan.id,
            []
        )
        
        assert is_on_path is True
    
    @pytest.mark.asyncio
    async def test_country_not_on_shortest_path_returns_false(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that country not on path returns False."""
        jordan = sample_countries[3]
        
        # Jordan is not on path from Egypt to Ethiopia
        # (Path is Egypt -> Sudan -> Ethiopia)
        is_on_path = await path_finder.is_on_shortest_path(
            db_session,
            sample_daily_challenge,
            jordan.id,
            []
        )
        
        assert is_on_path is False
    
    @pytest.mark.asyncio
    async def test_considers_previous_valid_guesses(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that validation considers previous correct guesses."""
        sudan = sample_countries[1]
        ethiopia = sample_countries[2]
        
        # Previous guess: Sudan (correct)
        previous_guesses = [{
            "country_id": str(sudan.id),
            "emoji": "🟢"
        }]
        
        # Ethiopia should still be on path after Sudan
        is_on_path = await path_finder.is_on_shortest_path(
            db_session,
            sample_daily_challenge,
            ethiopia.id,
            previous_guesses
        )
        
        assert is_on_path is True


class TestDistanceCalculation:
    """Test calculating distance from country to shortest path."""
    
    @pytest.mark.asyncio
    async def test_distance_zero_for_country_on_path(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that distance is 0 for countries on shortest path."""
        sudan = sample_countries[1]
        
        distance = await path_finder.get_distance_from_path(
            db_session,
            sample_daily_challenge,
            sudan.id
        )
        
        assert distance == 0
    
    @pytest.mark.asyncio
    async def test_distance_one_for_neighbor_of_path(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test correct distance for countries neighboring the path."""
        jordan = sample_countries[3]
        
        # Jordan borders Egypt (on path), so distance = 1
        distance = await path_finder.get_distance_from_path(
            db_session,
            sample_daily_challenge,
            jordan.id
        )
        
        assert distance == 1
    
    @pytest.mark.asyncio
    async def test_distance_two_for_two_hops_away(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test correct distance for countries 2 hops from path."""
        syria = sample_countries[4]
        
        # Syria -> Jordan -> Egypt (on path), so distance = 2
        distance = await path_finder.get_distance_from_path(
            db_session,
            sample_daily_challenge,
            syria.id
        )
        
        assert distance == 2


class TestHintGeneration:
    """Test hint generation for different hint types."""
    
    @pytest.mark.asyncio
    async def test_border_hint_shows_neighbors(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that border hint shows neighboring countries."""
        hint = await path_finder.generate_hint(
            db_session,
            sample_daily_challenge,
            "border_hint",
            []
        )
        
        assert "border_countries" in hint
        assert isinstance(hint["border_countries"], list)
        assert len(hint["border_countries"]) > 0
    
    @pytest.mark.asyncio
    async def test_all_borders_hint_shows_path(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that all_borders hint reveals the path."""
        hint = await path_finder.generate_hint(
            db_session,
            sample_daily_challenge,
            "all_borders_hint",
            []
        )
        
        assert "path_countries" in hint
        assert "path_length" in hint
        assert isinstance(hint["path_countries"], list)
        assert hint["path_length"] == len(hint["path_countries"])
    
    @pytest.mark.asyncio
    async def test_first_letter_hint_shows_initials(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that first_letter hint shows country initials."""
        hint = await path_finder.generate_hint(
            db_session,
            sample_daily_challenge,
            "first_letter_hint",
            []
        )
        
        assert "first_letters" in hint
        assert "remaining_countries" in hint
        assert isinstance(hint["first_letters"], list)
    
    @pytest.mark.asyncio
    async def test_hint_skips_already_guessed_countries(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that hints don't reveal already guessed countries."""
        sudan = sample_countries[1]
        
        previous_guesses = [{
            "country_id": str(sudan.id),
            "emoji": "🟢"
        }]
        
        hint = await path_finder.generate_hint(
            db_session,
            sample_daily_challenge,
            "first_letter_hint",
            previous_guesses
        )
        
        # Should have fewer remaining countries
        assert hint["remaining_countries"] < 3  # Total path length is 3
    
    @pytest.mark.asyncio
    async def test_invalid_hint_type_returns_error(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        sample_daily_challenge: DailyChallenge,
        path_finder: PathFinderService
    ):
        """Test that invalid hint type returns error."""
        hint = await path_finder.generate_hint(
            db_session,
            sample_daily_challenge,
            "invalid_hint_type",
            []
        )
        
        assert "error" in hint


class TestPerformance:
    """Test pathfinding performance and edge cases."""
    
    @pytest.mark.asyncio
    async def test_handles_large_graph(
        self,
        db_session: AsyncSession,
        path_finder: PathFinderService
    ):
        """Test that algorithm handles larger graphs efficiently."""
        # Create a chain of 20 countries
        countries = []
        for i in range(20):
            country = Country(
                id=uuid4(),
                name_ar=f"دولة {i}",
                name_en=f"Country {i}",
                iso_alpha_2=f"C{i:02d}"[:2],
                iso_alpha_3=f"C{i:03d}",
                flag_emoji="🏳️",
                continent="Test",
            )
            countries.append(country)
            db_session.add(country)
        
        await db_session.commit()
        
        # Add borders creating a chain
        from app.models.country import CountryBorder
        for i in range(19):
            border = CountryBorder(
                country_a_id=countries[i].id,
                country_b_id=countries[i + 1].id
            )
            db_session.add(border)
        
        await db_session.commit()
        path_finder.clear_cache()
        
        # Find path from first to last
        path = await path_finder.find_shortest_path(
            db_session,
            countries[0].id,
            countries[19].id
        )
        
        assert path is not None
        assert len(path) == 20
    
    @pytest.mark.asyncio
    async def test_no_infinite_loop_on_cycles(
        self,
        db_session: AsyncSession,
        sample_countries: list[Country],
        path_finder: PathFinderService
    ):
        """Test that BFS handles cycles correctly without infinite loops."""
        # The graph already has cycles (bidirectional borders)
        egypt = sample_countries[0]
        syria = sample_countries[4]
        
        # Should complete without hanging
        path = await path_finder.find_shortest_path(db_session, egypt.id, syria.id)
        
        assert path is not None

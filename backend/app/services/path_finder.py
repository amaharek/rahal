"""
PathFinder service for calculating shortest paths between countries.
Uses BFS algorithm on the country border graph.
"""

from collections import deque
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.country import country_crud
from app.models.country import Country
from app.models.game import DailyChallenge


class PathFinderService:
    """
    Service for finding paths between countries using BFS.
    Builds a graph from country borders and computes shortest paths.
    """

    def __init__(self):
        self._graph: dict[UUID, set[UUID]] | None = None
        self._countries: dict[UUID, Country] | None = None

    async def _build_graph(self, db: AsyncSession) -> None:
        """Build the adjacency graph from database."""
        if self._graph is not None:
            return

        countries = await country_crud.get_all_with_borders(db)
        self._graph = {}
        self._countries = {}

        for country in countries:
            self._countries[country.id] = country
            self._graph[country.id] = set()

            # Add all neighbors (bidirectional)
            for border in country.borders_from:
                self._graph[country.id].add(border.country_b_id)
            for border in country.borders_to:
                self._graph[country.id].add(border.country_a_id)

    async def get_neighbors(self, db: AsyncSession, country_id: UUID) -> list[UUID]:
        """Get all neighboring country IDs."""
        await self._build_graph(db)
        return list(self._graph.get(country_id, set()))

    async def find_shortest_path(
        self,
        db: AsyncSession,
        start_id: UUID,
        end_id: UUID,
    ) -> list[UUID] | None:
        """
        Find the shortest path between two countries using BFS.

        Args:
            db: Database session
            start_id: Starting country ID
            end_id: Destination country ID

        Returns:
            List of country IDs representing the shortest path,
            or None if no path exists
        """
        await self._build_graph(db)

        if start_id == end_id:
            return [start_id]

        if start_id not in self._graph or end_id not in self._graph:
            return None

        # BFS
        queue = deque([(start_id, [start_id])])
        visited = {start_id}

        while queue:
            current, path = queue.popleft()

            for neighbor in self._graph.get(current, set()):
                if neighbor == end_id:
                    return path + [neighbor]

                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return None  # No path found

    async def get_shortest_path_length(
        self,
        db: AsyncSession,
        start_id: UUID,
        end_id: UUID,
    ) -> int | None:
        """Get the length of the shortest path (number of countries - 1)."""
        path = await self.find_shortest_path(db, start_id, end_id)
        if path is None:
            return None
        return len(path) - 1  # Subtract 1 because we don't count start country

    async def get_all_shortest_paths(
        self,
        db: AsyncSession,
        start_id: UUID,
        end_id: UUID,
    ) -> list[list[UUID]]:
        """
        Find ALL shortest paths between two countries.

        Returns:
            List of all paths that are equally short
        """
        await self._build_graph(db)

        if start_id == end_id:
            return [[start_id]]

        if start_id not in self._graph or end_id not in self._graph:
            return []

        # BFS to find shortest path length first
        shortest_length = None
        all_paths: list[list[UUID]] = []

        queue = deque([(start_id, [start_id])])
        visited_at_level: dict[UUID, int] = {start_id: 0}

        while queue:
            current, path = queue.popleft()
            current_level = len(path) - 1

            # If we already found shorter paths, skip
            if shortest_length is not None and current_level >= shortest_length:
                continue

            for neighbor in self._graph.get(current, set()):
                new_path = path + [neighbor]
                new_level = len(new_path) - 1

                if neighbor == end_id:
                    if shortest_length is None:
                        shortest_length = new_level
                    if new_level == shortest_length:
                        all_paths.append(new_path)
                    continue

                # Visit if not seen or seen at same level (allows multiple paths)
                if neighbor not in visited_at_level or visited_at_level[neighbor] == new_level:
                    visited_at_level[neighbor] = new_level
                    queue.append((neighbor, new_path))

        return all_paths

    async def is_on_shortest_path(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        country_id: UUID,
        previous_guesses: list[dict[str, Any]],
    ) -> bool:
        """
        Check if a country is on any shortest path from start to end,
        considering previous valid guesses.

        Args:
            db: Database session
            challenge: The daily challenge
            country_id: Country to check
            previous_guesses: List of previous guess entries

        Returns:
            True if country is on a valid shortest path
        """
        # Get all shortest paths
        all_paths = await self.get_all_shortest_paths(
            db, challenge.start_country_id, challenge.end_country_id
        )

        if not all_paths:
            return False

        # Get the chain of valid guesses so far
        valid_chain = [challenge.start_country_id]
        for guess in previous_guesses:
            if guess.get("emoji") in ["🟢", "🟡"]:  # On shortest path
                valid_chain.append(UUID(guess["country_id"]))

        # Check if country_id appears in any shortest path after the valid chain
        for path in all_paths:
            # Check if valid chain is a prefix of this path
            if len(valid_chain) > len(path):
                continue

            is_prefix = all(
                path[i] == valid_chain[i] for i in range(len(valid_chain))
            )

            if is_prefix and country_id in path[len(valid_chain):]:
                return True

        return False

    async def get_distance_from_path(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        country_id: UUID,
    ) -> int:
        """
        Get the minimum distance from a country to any shortest path.

        Args:
            db: Database session
            challenge: The daily challenge
            country_id: Country to check

        Returns:
            Minimum number of borders to reach shortest path
        """
        await self._build_graph(db)

        # Get all shortest paths
        all_paths = await self.get_all_shortest_paths(
            db, challenge.start_country_id, challenge.end_country_id
        )

        if not all_paths:
            return -1

        # Get all countries on any shortest path
        path_countries = set()
        for path in all_paths:
            path_countries.update(path)

        if country_id in path_countries:
            return 0

        # BFS from country_id to find nearest path country
        queue = deque([(country_id, 0)])
        visited = {country_id}

        while queue:
            current, distance = queue.popleft()

            for neighbor in self._graph.get(current, set()):
                if neighbor in path_countries:
                    return distance + 1

                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, distance + 1))

        return -1  # No connection found (shouldn't happen normally)

    async def generate_hint(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        hint_step: int,
        previous_guesses: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Generate hint data based on hint type.

        Args:
            db: Database session
            challenge: The daily challenge
            hint_step: Progressive hint step (1-3)
            previous_guesses: Previous guesses made

        Returns:
            Hint data dictionary
        """
        await self._build_graph(db)

        # Get one shortest path
        path = await self.find_shortest_path(
            db, challenge.start_country_id, challenge.end_country_id
        )

        if not path:
            return {"error": "No path found"}

        # Get guessed country IDs
        guessed_ids = {UUID(g["country_id"]) for g in previous_guesses}

        # Find next unguessed country on path
        unguessed_on_path = [
            cid for cid in path[1:]  # Skip start country
            if cid not in guessed_ids
        ]

        if hint_step == 1:
            # Show neighbors of one country on path
            if unguessed_on_path:
                target_id = unguessed_on_path[0]
                target = self._countries.get(target_id)
                neighbors = await self.get_neighbors(db, target_id)
                neighbor_names = [
                    self._countries[n].name_ar
                    for n in neighbors
                    if n in self._countries
                ]
                return {
                    "country_name_ar": target.name_ar if target else "???",
                    "border_countries": neighbor_names,
                }

        elif hint_step == 2:
            # Show first letters of unguessed countries on path
            from app.utils.arabic import get_first_letter

            letters = []
            for cid in unguessed_on_path:
                country = self._countries.get(cid)
                if country:
                    letters.append(get_first_letter(country.name_ar))
            return {
                "first_letters": letters,
                "remaining_countries": len(unguessed_on_path),
            }

        elif hint_step == 3:
            # Show all countries on shortest path
            path_names = [
                self._countries[cid].name_ar
                for cid in path
                if cid in self._countries
            ]
            return {
                "path_countries": path_names,
                "path_length": len(path),
            }

        return {"error": "Unknown hint step"}

    def clear_cache(self) -> None:
        """Clear the cached graph (useful for testing or updates)."""
        self._graph = None
        self._countries = None

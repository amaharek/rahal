"""
Score calculator service for game scoring and emoji feedback.
"""

from dataclasses import dataclass
from typing import Any, Literal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.country import country_crud
from app.models.country import Country
from app.models.game import DailyChallenge
from app.services.path_finder import PathFinderService

# Emoji definitions
EMOJI_EXCELLENT = "🟢"  # On shortest path, correct order
EMOJI_GOOD = "🟡"  # On shortest path, wrong order
EMOJI_OKAY = "🟠"  # Close to shortest path (1-2 borders away)
EMOJI_FAR = "🔴"  # Far from shortest path (3+ borders away)
EMOJI_WRONG_CONTINENT = "⚫"  # Different landmass/continent

# Arabic descriptions
EMOJI_DESCRIPTIONS = {
    EMOJI_EXCELLENT: "ممتاز",  # Excellent
    EMOJI_GOOD: "جيد",  # Good
    EMOJI_OKAY: "مقبول",  # Acceptable
    EMOJI_FAR: "بعيد",  # Far
    EMOJI_WRONG_CONTINENT: "قارة مختلفة",  # Different continent
}

EmojiType = Literal["🟢", "🟡", "🟠", "🔴", "⚫"]


@dataclass
class ScoreResult:
    """Result of scoring a guess."""

    country: Country
    emoji: EmojiType
    description_ar: str
    is_on_shortest_path: bool
    is_destination: bool
    distance_from_path: int

    def to_guess_entry(self) -> dict[str, Any]:
        """Convert to guess entry for storage."""
        return {
            "country_id": str(self.country.id),
            "name_ar": self.country.name_ar,
            "flag_emoji": self.country.flag_emoji,
            "emoji": self.emoji,
        }


class ScoreCalculator:
    """Service for calculating game scores and emoji feedback."""

    def __init__(self):
        self.path_finder = PathFinderService()

    async def calculate_guess_score(
        self,
        db: AsyncSession,
        challenge: DailyChallenge,
        guessed_country_id: UUID,
        previous_guesses: list[dict[str, Any]],
    ) -> ScoreResult:
        """
        Calculate the score/emoji for a guess.

        Args:
            db: Database session
            challenge: The daily challenge
            guessed_country_id: ID of the guessed country
            previous_guesses: List of previous guesses

        Returns:
            ScoreResult with emoji and metadata
        """
        # Get the guessed country
        country = await country_crud.get(db, guessed_country_id)
        if not country:
            raise ValueError(f"Country not found: {guessed_country_id}")

        # Check if this is the destination
        is_destination = guessed_country_id == challenge.end_country_id
        if is_destination:
            return ScoreResult(
                country=country,
                emoji=EMOJI_EXCELLENT,
                description_ar=EMOJI_DESCRIPTIONS[EMOJI_EXCELLENT],
                is_on_shortest_path=True,
                is_destination=True,
                distance_from_path=0,
            )

        # Check if on shortest path
        is_on_path = await self.path_finder.is_on_shortest_path(
            db, challenge, guessed_country_id, previous_guesses
        )

        if is_on_path:
            # Check if in correct order (connected to last valid guess)
            in_order = await self._is_in_order(
                db, guessed_country_id, previous_guesses, challenge
            )
            emoji = EMOJI_EXCELLENT if in_order else EMOJI_GOOD
            return ScoreResult(
                country=country,
                emoji=emoji,
                description_ar=EMOJI_DESCRIPTIONS[emoji],
                is_on_shortest_path=True,
                is_destination=False,
                distance_from_path=0,
            )

        # Calculate distance from path
        distance = await self.path_finder.get_distance_from_path(
            db, challenge, guessed_country_id
        )

        # Check for different continent (heuristic: distance > some threshold)
        # In reality, we'd check actual continent data
        start_country = await country_crud.get(db, challenge.start_country_id)
        if start_country and country.continent and start_country.continent:
            if country.continent != start_country.continent:
                return ScoreResult(
                    country=country,
                    emoji=EMOJI_WRONG_CONTINENT,
                    description_ar=EMOJI_DESCRIPTIONS[EMOJI_WRONG_CONTINENT],
                    is_on_shortest_path=False,
                    is_destination=False,
                    distance_from_path=distance,
                )

        # Score based on distance
        if distance <= 2:
            emoji = EMOJI_OKAY
        else:
            emoji = EMOJI_FAR

        return ScoreResult(
            country=country,
            emoji=emoji,
            description_ar=EMOJI_DESCRIPTIONS[emoji],
            is_on_shortest_path=False,
            is_destination=False,
            distance_from_path=distance,
        )

    async def _is_in_order(
        self,
        db: AsyncSession,
        country_id: UUID,
        previous_guesses: list[dict[str, Any]],
        challenge: DailyChallenge,
    ) -> bool:
        """
        Check if the country is connected to the last valid guess.

        For excellent score, the country should be adjacent to either:
        - The start country (if no valid guesses yet)
        - The last valid guess on the path
        """
        # Find the last valid position in the path
        last_valid_id = challenge.start_country_id

        for guess in previous_guesses:
            if guess.get("emoji") == EMOJI_EXCELLENT:
                last_valid_id = UUID(guess["country_id"])

        # Check if guessed country is adjacent to last valid
        neighbors = await self.path_finder.get_neighbors(db, last_valid_id)
        return country_id in neighbors

    def calculate_final_score(
        self,
        total_guesses: int,
        hints_used: int,
        shortest_path: int,
    ) -> int:
        """
        Calculate the final game score.

        Scoring formula:
        - Base score: 1000
        - Penalty per extra guess: -50
        - Penalty per hint: -100
        - Bonus for optimal path: +200

        Args:
            total_guesses: Number of guesses made
            hints_used: Number of hints used
            shortest_path: Length of shortest path

        Returns:
            Final score (minimum 0)
        """
        base_score = 1000

        # Penalty for extra guesses beyond optimal
        extra_guesses = max(0, total_guesses - shortest_path)
        guess_penalty = extra_guesses * 50

        # Penalty for hints
        hint_penalty = hints_used * 100

        # Bonus for optimal path
        optimal_bonus = 200 if total_guesses == shortest_path else 0

        score = base_score - guess_penalty - hint_penalty + optimal_bonus
        return max(0, score)  # Minimum score is 0

    def get_share_text(
        self,
        challenge_number: int,
        guesses: list[dict[str, Any]],
        score: int,
        hints_used: int,
    ) -> str:
        """
        Generate shareable text for game results.

        Args:
            challenge_number: Challenge number/ID
            guesses: List of guess entries with emojis
            score: Final score
            hints_used: Hints used

        Returns:
            Formatted share text in Arabic
        """
        emoji_line = "".join(g.get("emoji", "") for g in guesses)
        hint_text = f" ({hints_used} تلميحات)" if hints_used > 0 else ""

        return f"""رحال #{challenge_number} 🌍

{emoji_line}

{len(guesses)} محاولات{hint_text}
النتيجة: {score} نقطة

العب الآن: https://rahal.app"""

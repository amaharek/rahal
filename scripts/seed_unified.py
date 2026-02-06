#!/usr/bin/env python3
"""
Unified Database Seeding Script for Rahal

Features:
- Loads from JSON files (data/)
- Uses SQLAlchemy ORM (type-safe)
- Idempotent (safe to re-run)
- Validates completeness
- Progress reporting

Seeds:
- 98 countries (all continents)
- 170 borders (connected graph)
- 85 questions (8 categories × 3 difficulties)
- 61 daily challenges (30 past + today + 30 future)
- 5 achievements

Usage:
    cd backend
    uv run python ../scripts/seed_unified.py

Or:
    make seed
"""

import asyncio
import json
import random
import re
import sys
import unicodedata
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

# This script should be run from backend directory
current_dir = Path.cwd()
if current_dir.name != "backend":
    print("⚠️  This script should be run from the backend directory:")
    print("    cd backend")
    print("    uv run python ../scripts/seed_unified.py")
    sys.exit(1)

from app.core.database import async_session_maker
from app.models.country import Border, Country
from app.models.game import DailyChallenge
from app.models.question import Question
from app.models.user import Achievement


# ============================================================================
# ARABIC NORMALIZATION UTILITY
# ============================================================================

# Arabic diacritics to remove
ARABIC_DIACRITICS = re.compile(
    r"[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]"
)

HAMZA_MAP = {
    "أ": "ا",
    "إ": "ا",
    "آ": "ا",
    "ٱ": "ا",
    "ؤ": "و",
    "ئ": "ي",
    "ى": "ي",
    "ة": "ه",
}


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for search (remove diacritics, normalize hamza)."""
    text = unicodedata.normalize("NFKC", text)
    text = ARABIC_DIACRITICS.sub("", text)
    for variant, normalized in HAMZA_MAP.items():
        text = text.replace(variant, normalized)
    return " ".join(text.split())


# ============================================================================
# DATA LOADING
# ============================================================================


def load_json_data() -> dict[str, Any]:
    """
    Load all JSON data files.
    
    Returns:
        Dict with countries, borders, questions data
        
    Raises:
        FileNotFoundError: If data files don't exist
        ValueError: If data doesn't meet minimum requirements
    """
    print("📂 Loading data files...")
    
    data_dir = Path.cwd().parent / "data"
    
    # Load countries
    countries_file = data_dir / "countries.json"
    if not countries_file.exists():
        raise FileNotFoundError(f"Countries file not found: {countries_file}")
    
    with open(countries_file, "r", encoding="utf-8") as f:
        countries_data = json.load(f)
    countries = countries_data.get("countries", [])
    print(f"  ✓ Loaded {len(countries)} countries")
    
    # Load borders
    borders_file = data_dir / "borders.json"
    if not borders_file.exists():
        raise FileNotFoundError(f"Borders file not found: {borders_file}")
    
    with open(borders_file, "r", encoding="utf-8") as f:
        borders_data = json.load(f)
    borders = borders_data.get("borders", [])
    print(f"  ✓ Loaded {len(borders)} borders")
    
    # Load questions
    questions_file = data_dir / "questions" / "sample_questions.json"
    if not questions_file.exists():
        raise FileNotFoundError(f"Questions file not found: {questions_file}")
    
    with open(questions_file, "r", encoding="utf-8") as f:
        questions_data = json.load(f)
    questions = questions_data.get("questions", [])
    print(f"  ✓ Loaded {len(questions)} questions")
    
    # Validate minimum requirements
    if len(countries) < 50:
        raise ValueError(f"Insufficient countries: {len(countries)} (minimum 50)")
    if len(borders) < 80:
        raise ValueError(f"Insufficient borders: {len(borders)} (minimum 80)")
    if len(questions) < 50:
        raise ValueError(f"Insufficient questions: {len(questions)} (minimum 50)")
    
    print(f"  ✅ All data files validated\n")
    
    return {
        "countries": countries,
        "borders": borders,
        "questions": questions,
    }


# ============================================================================
# SEEDING FUNCTIONS
# ============================================================================


async def seed_countries(
    session: AsyncSession, data: list[dict[str, Any]]
) -> dict[str, Country]:
    """
    Seed countries using ORM. Idempotent.
    
    Args:
        session: Database session
        data: List of country dicts from JSON
        
    Returns:
        Dict mapping country code to Country object
    """
    print("🌍 Seeding countries...")
    
    # Check if already seeded
    result = await session.execute(select(Country).limit(1))
    if result.scalar_one_or_none():
        print("  ⏭️  Countries already exist, loading...")
        result = await session.execute(select(Country))
        countries = {c.code: c for c in result.scalars().all()}
        print(f"  ✅ Loaded {len(countries)} existing countries\n")
        return countries
    
    # Seed new countries
    country_map = {}
    for i, item in enumerate(data, 1):
        country = Country(
            id=uuid4(),
            code=item["code"],
            name_ar=item["name_ar"],
            name_en=item["name_en"],
            name_ar_normalized=normalize_arabic(item["name_ar"]),
            continent=item.get("continent"),
            region=item.get("region"),
            capital_ar=item.get("capital_ar"),
            capital_en=item.get("capital_en"),
            flag_emoji=item.get("flag_emoji"),
            population=item.get("population"),
            area_km2=item.get("area_km2"),
        )
        session.add(country)
        country_map[item["code"]] = country
        
        # Progress indicator
        if i % 20 == 0 or i == len(data):
            print(f"  Progress: {i}/{len(data)} countries...")
    
    await session.flush()
    print(f"  ✅ Created {len(country_map)} countries\n")
    return country_map


async def seed_borders(
    session: AsyncSession, data: list[dict[str, Any]], country_map: dict[str, Country]
) -> int:
    """
    Seed borders between countries. Idempotent.
    
    Args:
        session: Database session
        data: List of border dicts from JSON
        country_map: Mapping of country code to Country object
        
    Returns:
        Number of borders created/loaded
    """
    print("🔗 Seeding borders...")
    
    # Check if already seeded
    result = await session.execute(select(Border).limit(1))
    if result.scalar_one_or_none():
        print("  ⏭️  Borders already exist, skipping...")
        result = await session.execute(select(Border))
        existing = result.scalars().all()
        print(f"  ✅ {len(existing)} borders already exist\n")
        return len(existing)
    
    # Seed new borders
    borders_created = 0
    seen_pairs = set()
    
    for i, item in enumerate(data, 1):
        code_a = item["country_a"]
        code_b = item["country_b"]
        
        if code_a not in country_map or code_b not in country_map:
            print(f"  ⚠️  Skipping border {code_a}-{code_b}: country not found")
            continue
        
        country_a = country_map[code_a]
        country_b = country_map[code_b]
        
        # Ensure consistent ordering (smaller UUID first) to satisfy CHECK constraint
        id_a, id_b = country_a.id, country_b.id
        if str(id_a) > str(id_b):
            id_a, id_b = id_b, id_a
        
        # Avoid duplicates
        pair = (id_a, id_b)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        
        border = Border(
            id=uuid4(),
            country_a_id=id_a,
            country_b_id=id_b,
            border_type=item.get("border_type", "land"),
        )
        session.add(border)
        borders_created += 1
        
        # Progress indicator
        if i % 50 == 0 or i == len(data):
            print(f"  Progress: {i}/{len(data)} borders processed...")
    
    await session.flush()
    print(f"  ✅ Created {borders_created} borders\n")
    return borders_created


async def seed_questions(
    session: AsyncSession, data: list[dict[str, Any]]
) -> int:
    """
    Seed questions. Idempotent.
    
    Args:
        session: Database session
        data: List of question dicts from JSON
        
    Returns:
        Number of questions created/loaded
    """
    print("❓ Seeding questions...")
    
    # Check if already seeded
    result = await session.execute(select(Question).limit(1))
    if result.scalar_one_or_none():
        print("  ⏭️  Questions already exist, skipping...")
        result = await session.execute(select(Question))
        existing = result.scalars().all()
        print(f"  ✅ {len(existing)} questions already exist\n")
        return len(existing)
    
    # Seed new questions
    questions_created = 0
    
    for i, item in enumerate(data, 1):
        question = Question(
            id=uuid4(),
            category=item["category"],
            difficulty=item["difficulty"],
            question_type=item["question_type"],
            question_ar=item["question_ar"],
            correct_answer=item["correct_answer"],
            correct_answer_normalized=normalize_arabic(item["correct_answer"]),
            options=item.get("options"),  # Direct array format
            hint=item.get("hint"),
            image_url=item.get("image_url"),
            tags=item.get("tags", []),
            is_active=True,
        )
        session.add(question)
        questions_created += 1
        
        # Progress indicator
        if i % 20 == 0 or i == len(data):
            print(f"  Progress: {i}/{len(data)} questions...")
    
    await session.flush()
    print(f"  ✅ Created {questions_created} questions\n")
    return questions_created


async def seed_achievements(session: AsyncSession) -> int:
    """
    Seed predefined achievements. Idempotent.
    
    Args:
        session: Database session
        
    Returns:
        Number of achievements created/loaded
    """
    print("🏆 Seeding achievements...")
    
    # Check if already seeded by checking count (avoid model mismatch with TimestampMixin)
    result = await session.execute(text("SELECT COUNT(*) FROM achievements"))
    count = result.scalar()
    
    if count and count > 0:
        print(f"  ⏭️  {count} achievements already exist, skipping...\n")
        return count
    
    # Define achievements
    achievements = [
        {
            "code": "first_win",
            "name_ar": "الفوز الأول",
            "name_en": "First Win",
            "description_ar": "أكمل التحدي اليومي الأول",
            "icon": "🎉",
            "category": "games",
            "points": 10,
        },
        {
            "code": "streak_3",
            "name_ar": "سلسلة ثلاثية",
            "name_en": "3-Day Streak",
            "description_ar": "حافظ على سلسلة 3 أيام متتالية",
            "icon": "🔥",
            "category": "streak",
            "points": 30,
        },
        {
            "code": "streak_7",
            "name_ar": "سلسلة أسبوعية",
            "name_en": "7-Day Streak",
            "description_ar": "حافظ على سلسلة 7 أيام متتالية",
            "icon": "🔥",
            "category": "streak",
            "points": 70,
        },
        {
            "code": "quiz_master",
            "name_ar": "خبير الأسئلة",
            "name_en": "Quiz Master",
            "description_ar": "أجب على 100 سؤال بشكل صحيح",
            "icon": "🎓",
            "category": "quiz",
            "points": 100,
        },
        {
            "code": "no_hints",
            "name_ar": "بدون مساعدة",
            "name_en": "No Hints",
            "description_ar": "أكمل 5 تحديات بدون استخدام أي تلميح",
            "icon": "💪",
            "category": "games",
            "points": 50,
        },
    ]
    
    # Seed achievements using raw SQL (avoid ORM model mismatch with timestamp columns)
    for ach in achievements:
        await session.execute(
            text("""
                INSERT INTO achievements (id, code, name_ar, name_en, description_ar, icon, category, points, requirement)
                VALUES (:id, :code, :name_ar, :name_en, :description_ar, :icon, :category, :points, :requirement)
            """),
            {
                "id": uuid4(),
                "code": ach["code"],
                "name_ar": ach["name_ar"],
                "name_en": ach["name_en"],
                "description_ar": ach["description_ar"],
                "icon": ach["icon"],
                "category": ach["category"],
                "points": ach["points"],
                "requirement": None,  # Can be populated later with specific criteria
            }
        )
    
    await session.flush()
    print(f"  ✅ Created {len(achievements)} achievements\n")
    return len(achievements)


async def seed_daily_challenges(
    session: AsyncSession, country_map: dict[str, Country]
) -> int:
    """
    Seed daily challenges for 61 days (30 past + today + 30 future). Idempotent.
    
    Args:
        session: Database session
        country_map: Mapping of country code to Country object
        
    Returns:
        Number of challenges created/loaded
    """
    print("📅 Seeding daily challenges...")
    
    # Check if already seeded
    result = await session.execute(select(DailyChallenge).limit(1))
    if result.scalar_one_or_none():
        print("  ⏭️  Daily challenges already exist, skipping...")
        result = await session.execute(select(DailyChallenge))
        existing = result.scalars().all()
        print(f"  ✅ {len(existing)} daily challenges already exist\n")
        return len(existing)
    
    # Get all country codes
    country_codes = list(country_map.keys())
    if len(country_codes) < 2:
        print("  ⚠️  Not enough countries to create challenges")
        return 0
    
    # Generate challenges for 61 days
    today = date.today()
    challenges_created = 0
    
    for days_offset in range(-30, 31):
        challenge_date = today + timedelta(days=days_offset)
        
        # Select random start and end countries
        start_code = random.choice(country_codes)
        end_code = random.choice([c for c in country_codes if c != start_code])
        
        start_country = country_map[start_code]
        end_country = country_map[end_code]
        
        # Estimate shortest path (simplified - between 2 and 6)
        shortest_path = random.randint(2, 6)
        
        challenge = DailyChallenge(
            id=uuid4(),
            challenge_date=challenge_date,
            start_country_id=start_country.id,
            end_country_id=end_country.id,
            shortest_path=shortest_path,
        )
        session.add(challenge)
        challenges_created += 1
    
    await session.flush()
    print(f"  ✅ Created {challenges_created} daily challenges\n")
    return challenges_created


# ============================================================================
# MAIN SEEDING ORCHESTRATION
# ============================================================================


async def seed_database():
    """Main seeding orchestration function."""
    print("=" * 70)
    print("🚀 Rahal Database Seeding (Unified)")
    print("=" * 70)
    print()
    
    try:
        # Load data from JSON files
        data = load_json_data()
        
        # Create database session
        async with async_session_maker() as session:
            # Seed in correct order (respecting foreign keys)
            country_map = await seed_countries(session, data["countries"])
            borders_count = await seed_borders(session, data["borders"], country_map)
            questions_count = await seed_questions(session, data["questions"])
            achievements_count = await seed_achievements(session)
            challenges_count = await seed_daily_challenges(session, country_map)
            
            # Commit all changes
            await session.commit()
            
            # Summary
            print("=" * 70)
            print("✨ Database Seeding Complete!")
            print("=" * 70)
            print(f"Countries:         {len(country_map)}")
            print(f"Borders:           {borders_count}")
            print(f"Questions:         {questions_count}")
            print(f"Achievements:      {achievements_count}")
            print(f"Daily Challenges:  {challenges_count}")
            print()
            print("🎉 All data seeded successfully!")
            print()
            
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    """Entry point."""
    asyncio.run(seed_database())


if __name__ == "__main__":
    main()

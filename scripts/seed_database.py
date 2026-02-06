#!/usr/bin/env python3
"""
⚠️  DEPRECATED - Use scripts/seed_unified.py instead

Rahal Database Seeding Script (Legacy)
Seeds countries, borders, questions, achievements, daily challenges, and daily quizzes.

This script is deprecated and kept for reference only.
It has known issues:
- Uses incorrect options format (wrapped object)
- Incomplete data (39 countries, 41 borders, 48 questions)
- Does not meet MVP requirements

Please use: scripts/seed_unified.py

Old Usage:
    cd backend
    source .venv/bin/activate
    python ../scripts/seed_database.py
"""

import asyncio
import json
import os
import random
import re
import sys
import unicodedata
from datetime import date, timedelta
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Arabic diacritics to remove
ARABIC_DIACRITICS = re.compile(
    r"[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]"
)

HAMZA_MAP = {
    "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
    "ؤ": "و", "ئ": "ي", "ى": "ي", "ة": "ه",
}


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for search."""
    text = unicodedata.normalize("NFKC", text)
    text = ARABIC_DIACRITICS.sub("", text)
    for variant, normalized in HAMZA_MAP.items():
        text = text.replace(variant, normalized)
    return " ".join(text.split())


async def seed_database():
    """Main seeding function."""
    database_url = os.getenv(
        "DATABASE_URL_ASYNC",
        "postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres"
    )

    engine = create_async_engine(database_url, echo=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    data_dir = Path(__file__).parent.parent / "data"

    async with async_session() as session:
        # Load and seed countries
        print("🌍 Seeding countries...")
        countries_file = data_dir / "countries.json"
        with open(countries_file, "r", encoding="utf-8") as f:
            countries_data = json.load(f)

        country_id_map = {}  # code -> id mapping

        for country in countries_data["countries"]:
            normalized = normalize_arabic(country["name_ar"])
            result = await session.execute(
                text("""
                    INSERT INTO countries (code, name_ar, name_en, name_ar_normalized,
                        continent, region, population, area_km2, capital_ar, capital_en, flag_emoji)
                    VALUES (:code, :name_ar, :name_en, :name_ar_normalized,
                        :continent, :region, :population, :area_km2, :capital_ar, :capital_en, :flag_emoji)
                    ON CONFLICT (code) DO UPDATE SET
                        name_ar = EXCLUDED.name_ar,
                        name_en = EXCLUDED.name_en,
                        name_ar_normalized = EXCLUDED.name_ar_normalized
                    RETURNING id
                """),
                {
                    "code": country["code"],
                    "name_ar": country["name_ar"],
                    "name_en": country["name_en"],
                    "name_ar_normalized": normalized,
                    "continent": country.get("continent"),
                    "region": country.get("region"),
                    "population": country.get("population"),
                    "area_km2": country.get("area_km2"),
                    "capital_ar": country.get("capital_ar"),
                    "capital_en": country.get("capital_en"),
                    "flag_emoji": country.get("flag_emoji"),
                }
            )
            row = result.fetchone()
            country_id_map[country["code"]] = row[0]
            print(f"  ✓ {country['name_ar']} ({country['code']})")

        await session.commit()
        print(f"✅ Seeded {len(countries_data['countries'])} countries\n")

        # Load and seed borders
        print("🔗 Seeding borders...")
        borders_file = data_dir / "borders.json"
        with open(borders_file, "r", encoding="utf-8") as f:
            borders_data = json.load(f)

        border_count = 0
        for border in borders_data["borders"]:
            code_a = border["country_a"]
            code_b = border["country_b"]

            if code_a not in country_id_map or code_b not in country_id_map:
                print(f"  ⚠ Skipping border {code_a}-{code_b}: country not found")
                continue

            id_a = country_id_map[code_a]
            id_b = country_id_map[code_b]

            # Ensure consistent ordering (smaller UUID first)
            if str(id_a) > str(id_b):
                id_a, id_b = id_b, id_a

            try:
                await session.execute(
                    text("""
                        INSERT INTO borders (country_a_id, country_b_id, border_type)
                        VALUES (:country_a_id, :country_b_id, :border_type)
                        ON CONFLICT (country_a_id, country_b_id) DO NOTHING
                    """),
                    {
                        "country_a_id": id_a,
                        "country_b_id": id_b,
                        "border_type": border.get("border_type", "land"),
                    }
                )
                border_count += 1
            except Exception as e:
                print(f"  ⚠ Error creating border {code_a}-{code_b}: {e}")

        await session.commit()
        print(f"✅ Seeded {border_count} borders\n")

        # Load and seed questions
        print("❓ Seeding questions...")
        questions_file = data_dir / "questions" / "sample_questions.json"
        with open(questions_file, "r", encoding="utf-8") as f:
            questions_data = json.load(f)

        question_count = 0
        for q in questions_data["questions"]:
            normalized_answer = normalize_arabic(q["correct_answer"])
            options_json = json.dumps({"options": q.get("options", [])}) if q.get("options") else None

            await session.execute(
                text("""
                    INSERT INTO questions (category, difficulty, question_type,
                        question_ar, correct_answer, correct_answer_normalized,
                        options, hint, tags, is_active)
                    VALUES (:category, :difficulty, :question_type,
                        :question_ar, :correct_answer, :correct_answer_normalized,
                        CAST(:options AS jsonb), :hint, :tags, true)
                """),
                {
                    "category": q["category"],
                    "difficulty": q["difficulty"],
                    "question_type": q["question_type"],
                    "question_ar": q["question_ar"],
                    "correct_answer": q["correct_answer"],
                    "correct_answer_normalized": normalized_answer,
                    "options": options_json,
                    "hint": q.get("hint"),
                    "tags": q.get("tags", []),
                }
            )
            question_count += 1

        await session.commit()
        print(f"✅ Seeded {question_count} questions\n")

        # Seed achievements
        print("🏆 Seeding achievements...")
        achievements = [
            {"code": "first_win", "name_ar": "الفوز الأول", "name_en": "First Win",
             "description_ar": "أكمل التحدي اليومي الأول", "icon": "🎉", "category": "games", "points": 10},
            {"code": "streak_3", "name_ar": "سلسلة ثلاثية", "name_en": "3-Day Streak",
             "description_ar": "حافظ على سلسلة 3 أيام متتالية", "icon": "🔥", "category": "streak", "points": 30},
            {"code": "streak_7", "name_ar": "سلسلة أسبوعية", "name_en": "7-Day Streak",
             "description_ar": "حافظ على سلسلة 7 أيام متتالية", "icon": "🔥", "category": "streak", "points": 70},
            {"code": "quiz_master", "name_ar": "خبير الأسئلة", "name_en": "Quiz Master",
             "description_ar": "أجب على 100 سؤال بشكل صحيح", "icon": "🎓", "category": "quiz", "points": 100},
            {"code": "no_hints", "name_ar": "بدون مساعدة", "name_en": "No Hints",
             "description_ar": "أكمل 5 تحديات بدون استخدام أي تلميح", "icon": "💪", "category": "games", "points": 50},
        ]

        for ach in achievements:
            await session.execute(
                text("""
                    INSERT INTO achievements (code, name_ar, name_en, description_ar, icon, category, points)
                    VALUES (:code, :name_ar, :name_en, :description_ar, :icon, :category, :points)
                    ON CONFLICT (code) DO NOTHING
                """),
                ach
            )

        await session.commit()
        print(f"✅ Seeded {len(achievements)} achievements\n")

        # Create multiple daily challenges
        print("📅 Creating daily challenges...")
        today = date.today()
        
        # Get all country IDs for random selection
        result = await session.execute(text("SELECT id, code FROM countries"))
        all_countries = {row[1]: row[0] for row in result.fetchall()}
        country_codes = list(all_countries.keys())
        
        # Generate challenges for 60 days (30 past, 30 future)
        challenges_created = 0
        for days_offset in range(-30, 31):
            challenge_date = today + timedelta(days=days_offset)
            
            # Select random start and end countries
            start_code = random.choice(country_codes)
            end_code = random.choice([c for c in country_codes if c != start_code])
            
            start_id = all_countries[start_code]
            end_id = all_countries[end_code]
            
            # Estimate shortest path (simplified - between 1 and 6)
            shortest_path = random.randint(2, 6)
            
            try:
                await session.execute(
                    text("""
                        INSERT INTO daily_challenges (challenge_date, start_country_id, end_country_id, shortest_path)
                        VALUES (:challenge_date, :start_id, :end_id, :shortest_path)
                        ON CONFLICT (challenge_date) DO NOTHING
                    """),
                    {
                        "challenge_date": challenge_date,
                        "start_id": start_id,
                        "end_id": end_id,
                        "shortest_path": shortest_path,
                    }
                )
                challenges_created += 1
            except Exception as e:
                print(f"  ⚠ Error creating challenge for {challenge_date}: {e}")
        
        await session.commit()
        print(f"✅ Created {challenges_created} daily challenges (from {today - timedelta(days=30)} to {today + timedelta(days=30)})\n")

        # Create daily quizzes
        print("🧩 Creating daily quizzes...")
        
        # Get all question IDs
        result = await session.execute(text("SELECT id FROM questions"))
        all_question_ids = [row[0] for row in result.fetchall()]
        
        if len(all_question_ids) < 5:
            print("  ⚠ Not enough questions to create quizzes (need at least 5)")
        else:
            quizzes_created = 0
            for days_offset in range(-30, 31):
                quiz_date = today + timedelta(days=days_offset)
                
                # Select 5 random questions for this quiz
                selected_questions = random.sample(all_question_ids, min(5, len(all_question_ids)))
                
                for idx, question_id in enumerate(selected_questions, 1):
                    try:
                        await session.execute(
                            text("""
                                INSERT INTO daily_quizzes (quiz_date, question_id, question_order)
                                VALUES (:quiz_date, :question_id, :question_order)
                                ON CONFLICT (quiz_date, question_id) DO NOTHING
                            """),
                            {
                                "quiz_date": quiz_date,
                                "question_id": question_id,
                                "question_order": idx,
                            }
                        )
                        quizzes_created += 1
                    except Exception as e:
                        print(f"  ⚠ Error creating quiz for {quiz_date}: {e}")
            
            await session.commit()
            print(f"✅ Created {quizzes_created} daily quiz entries (5 questions per day for 61 days)\n")

    print("🎉 Database seeding complete!")
    print("\n📊 Summary:")
    print(f"  • Countries: Loaded from data/countries.json")
    print(f"  • Borders: Loaded from data/borders.json")
    print(f"  • Questions: Loaded from data/questions/sample_questions.json")
    print(f"  • Achievements: 5 predefined achievements")
    print(f"  • Daily Challenges: 61 days (30 past + today + 30 future)")
    print(f"  • Daily Quizzes: 61 days × 5 questions = 305 entries")


if __name__ == "__main__":
    asyncio.run(seed_database())

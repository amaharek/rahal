#!/usr/bin/env python3
"""
Idempotent achievement seeding script for Rahal.

Seeds 5 core achievement rows into the achievements table.
Safe to run multiple times — skips rows that already exist.

Usage:
    uv run python backend/scripts/seed_achievements.py
"""

import asyncio
import sys
from pathlib import Path

# Ensure `app` package is resolvable regardless of working directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session_maker
from app.crud.user import achievement_crud
from app.models.user import Achievement

ACHIEVEMENTS = [
    {
        "code": "first_steps",
        "name_ar": "الخطوات الأولى",
        "name_en": "First Steps",
        "description_ar": "أكمل أول لعبة",
        "description_en": "Complete your first game",
        "icon": "🗺️",
        "category": "games",
        "points": 10,
    },
    {
        "code": "streak_starter",
        "name_ar": "بداية السلسلة",
        "name_en": "Streak Starter",
        "description_ar": "حافظ على سلسلة لمدة 3 أيام",
        "description_en": "Maintain a 3-day streak",
        "icon": "🔥",
        "category": "streak",
        "points": 20,
    },
    {
        "code": "week_warrior",
        "name_ar": "محارب الأسبوع",
        "name_en": "Week Warrior",
        "description_ar": "حافظ على سلسلة لمدة 7 أيام",
        "description_en": "Maintain a 7-day streak",
        "icon": "🏆",
        "category": "streak",
        "points": 50,
    },
    {
        "code": "pathfinder",
        "name_ar": "مستكشف المسارات",
        "name_en": "Pathfinder",
        "description_ar": "أكمل 10 ألعاب",
        "description_en": "Complete 10 games",
        "icon": "⚡",
        "category": "games",
        "points": 30,
    },
    {
        "code": "perfect_route",
        "name_ar": "المسار المثالي",
        "name_en": "Perfect Route",
        "description_ar": "أكمل اللعبة بالمسار الأمثل بدون تلميحات",
        "description_en": "Complete a game on the optimal path with no hints",
        "icon": "💎",
        "category": "special",
        "points": 100,
    },
]


async def seed() -> None:
    async with async_session_maker() as db:
        created = 0
        skipped = 0
        for data in ACHIEVEMENTS:
            existing = await achievement_crud.get_by_code(db, data["code"])
            if existing:
                print(f"  skip  {data['icon']} {data['code']}")
                skipped += 1
                continue

            achievement = Achievement(
                code=data["code"],
                name_ar=data["name_ar"],
                name_en=data["name_en"],
                description_ar=data.get("description_ar"),
                description_en=data.get("description_en"),
                icon=data.get("icon"),
                category=data.get("category"),
                points=data.get("points", 0),
            )
            db.add(achievement)
            await db.flush()
            print(f"  created {data['icon']} {data['code']}")
            created += 1

        await db.commit()
        print(f"\nDone: {created} created, {skipped} skipped.")


if __name__ == "__main__":
    asyncio.run(seed())

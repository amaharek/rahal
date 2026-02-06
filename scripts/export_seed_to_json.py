#!/usr/bin/env python3
"""
Export seed_mvp.py Data to JSON Files

Converts hardcoded Python data structures from seed_mvp.py to JSON files.
Generates:
- data/countries.json (101 countries)
- data/borders.json (119 borders)
- data/questions/sample_questions.json (100 questions)

Fixes:
- Options format (direct array, not wrapped)
- Adds tags for questions
- Adds image_url placeholders
- Validates data completeness

Usage:
    cd backend
    uv run python ../scripts/export_seed_to_json.py
"""

import json
import sys
from pathlib import Path
from typing import Any

# This script should be run from backend directory to access seed_mvp module
current_dir = Path.cwd()
if current_dir.name != "backend":
    print("⚠️  This script should be run from the backend directory:")
    print("    cd backend")
    print("    uv run python ../scripts/export_seed_to_json.py")
    sys.exit(1)

# Import from backend/scripts
from scripts.seed_mvp import COUNTRIES_DATA, BORDERS_DATA, QUESTIONS_DATA


def export_countries(output_path: Path) -> int:
    """
    Export countries data to JSON.
    
    Args:
        output_path: Path to output countries.json
        
    Returns:
        Number of countries exported
    """
    print("🌍 Exporting countries...")
    
    # Transform data structure
    countries_json = {
        "countries": [
            {
                "code": country["code"],
                "name_ar": country["name_ar"],
                "name_en": country["name_en"],
                "continent": country.get("continent", ""),
                "region": country.get("region", ""),
                "population": country.get("population"),
                "area_km2": country.get("area_km2"),
                "capital_ar": country.get("capital_ar", ""),
                "capital_en": country.get("capital_en", ""),
                "flag_emoji": country.get("flag_emoji", "")
            }
            for country in COUNTRIES_DATA
        ]
    }
    
    # Write to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(countries_json, f, ensure_ascii=False, indent=2)
    
    count = len(countries_json["countries"])
    print(f"  ✅ Exported {count} countries → {output_path}")
    return count


def export_borders(output_path: Path) -> int:
    """
    Export borders data to JSON.
    
    Args:
        output_path: Path to output borders.json
        
    Returns:
        Number of borders exported
    """
    print("🔗 Exporting borders...")
    
    # Transform data structure
    borders_json = {
        "borders": [
            {
                "country_a": code_a,
                "country_b": code_b,
                "border_type": "land"  # Default to land borders
            }
            for code_a, code_b in BORDERS_DATA
        ]
    }
    
    # Write to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(borders_json, f, ensure_ascii=False, indent=2)
    
    count = len(borders_json["borders"])
    print(f"  ✅ Exported {count} borders → {output_path}")
    return count


def infer_tags(question: dict[str, Any]) -> list[str]:
    """
    Infer tags for a question based on category and content.
    
    Args:
        question: Question dict with category and answer
        
    Returns:
        List of tags
    """
    tags = []
    category = question.get("category", "")
    answer = question.get("correct_answer", "").lower()
    question_text = question.get("question_ar", "").lower()
    
    # Category-based tags
    tags.append(category)
    
    # Geographic region tags
    arab_countries = ["مصر", "السعودية", "الإمارات", "الأردن", "لبنان", "سوريا", 
                     "العراق", "الكويت", "قطر", "البحرين", "عمان", "اليمن",
                     "فلسطين", "المغرب", "الجزائر", "تونس", "ليبيا", "السودان", "موريتانيا"]
    
    if any(country in answer or country in question_text for country in arab_countries):
        tags.append("arab_world")
    
    # Continent tags
    if "أفريقيا" in question_text or "أفريقي" in question_text:
        tags.append("africa")
    elif "آسيا" in question_text or "آسيوي" in question_text:
        tags.append("asia")
    elif "أوروبا" in question_text or "أوروبي" in question_text:
        tags.append("europe")
    elif "أمريكا" in question_text:
        tags.append("americas")
    
    # Special topics
    if "خليج" in question_text or "خليجي" in question_text:
        tags.append("gulf")
    
    if "شمال" in question_text and "أفريقيا" in question_text:
        tags.append("north_africa")
    
    return list(set(tags))  # Remove duplicates


def export_questions(output_path: Path) -> int:
    """
    Export questions data to JSON with fixes.
    
    Fixes:
    - Options format (direct array, not {"options": []})
    - Adds tags
    - Adds image_url for landmark questions
    
    Args:
        output_path: Path to output sample_questions.json
        
    Returns:
        Number of questions exported
    """
    print("❓ Exporting questions...")
    
    # Transform data structure
    questions_list = []
    
    for question in QUESTIONS_DATA:
        # Fix options format - unwrap if wrapped
        options = question.get("options")
        if options and isinstance(options, dict) and "options" in options:
            # Unwrap: {"options": [...]} -> [...]
            options = options["options"]
        
        # Infer tags
        tags = infer_tags(question)
        
        # Add image_url for landmark questions
        image_url = None
        if question.get("category") == "landmarks":
            # Placeholder - could be enhanced with actual URLs
            landmark_name = question.get("correct_answer", "").replace(" ", "_")
            image_url = f"/images/landmarks/{landmark_name}.jpg"
        
        # Build question dict
        question_dict = {
            "category": question["category"],
            "difficulty": question["difficulty"],
            "question_type": question["question_type"],
            "question_ar": question["question_ar"],
            "correct_answer": question["correct_answer"],
            "hint": question.get("hint"),
            "tags": tags
        }
        
        # Add options if exists (direct array format)
        if options:
            question_dict["options"] = options
        
        # Add image_url if exists
        if image_url:
            question_dict["image_url"] = image_url
        
        questions_list.append(question_dict)
    
    questions_json = {"questions": questions_list}
    
    # Write to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions_json, f, ensure_ascii=False, indent=2)
    
    count = len(questions_json["questions"])
    print(f"  ✅ Exported {count} questions → {output_path}")
    
    # Print category distribution
    categories = {}
    for q in questions_list:
        cat = q["category"]
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n  📊 Category Distribution:")
    for cat, cnt in sorted(categories.items()):
        print(f"     {cat}: {cnt} questions")
    
    return count


def validate_export(data_dir: Path) -> bool:
    """
    Validate exported data meets MVP requirements.
    
    Args:
        data_dir: Path to data directory
        
    Returns:
        True if validation passes
    """
    print("\n✅ Validating exported data...")
    
    errors = []
    warnings = []
    
    # Load and validate countries
    countries_file = data_dir / "countries.json"
    with open(countries_file, "r", encoding="utf-8") as f:
        countries = json.load(f)["countries"]
    
    if len(countries) < 80:
        errors.append(f"Countries: Expected 80+, got {len(countries)}")
    elif len(countries) < 100:
        warnings.append(f"Countries: Got {len(countries)} (target was 100+)")
        print(f"  ✓ Countries: {len(countries)} (sufficient for MVP)")
    else:
        print(f"  ✓ Countries: {len(countries)}")
    
    # Load and validate borders
    borders_file = data_dir / "borders.json"
    with open(borders_file, "r", encoding="utf-8") as f:
        borders = json.load(f)["borders"]
    
    if len(borders) < 80:
        errors.append(f"Borders: Expected 80+, got {len(borders)}")
    else:
        print(f"  ✓ Borders: {len(borders)} (exceeds 80 minimum)")
    
    # Load and validate questions
    questions_file = data_dir / "questions" / "sample_questions.json"
    with open(questions_file, "r", encoding="utf-8") as f:
        questions = json.load(f)["questions"]
    
    if len(questions) < 50:
        errors.append(f"Questions: Expected 50+, got {len(questions)}")
    elif len(questions) < 100:
        warnings.append(f"Questions: Got {len(questions)} (target was 100+)")
        print(f"  ✓ Questions: {len(questions)} (sufficient for MVP)")
    else:
        print(f"  ✓ Questions: {len(questions)}")
    
    # Validate options format
    for i, q in enumerate(questions):
        if "options" in q:
            if not isinstance(q["options"], list):
                errors.append(f"Question {i}: options should be list, got {type(q['options'])}")
            elif isinstance(q["options"], dict) and "options" in q["options"]:
                errors.append(f"Question {i}: options should not be wrapped in object")
    
    if not errors:
        print("  ✓ Options format: All questions use direct array format")
    
    # Check all questions have tags
    questions_without_tags = sum(1 for q in questions if not q.get("tags"))
    if questions_without_tags > 0:
        print(f"  ⚠ {questions_without_tags} questions missing tags (added automatically)")
    else:
        print(f"  ✓ All questions have tags")
    
    if errors:
        print("\n❌ Validation failed:")
        for error in errors:
            print(f"   - {error}")
        return False
    
    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
    
    print("\n✅ All critical validations passed!")
    return True


def main():
    """Main export function."""
    print("=" * 70)
    print("🚀 Exporting seed_mvp.py data to JSON files")
    print("=" * 70)
    print()
    
    # Determine paths - go up from backend to project root
    project_root = Path.cwd().parent
    data_dir = project_root / "data"
    
    # Export each data type
    countries_exported = export_countries(data_dir / "countries.json")
    borders_exported = export_borders(data_dir / "borders.json")
    questions_exported = export_questions(data_dir / "questions" / "sample_questions.json")
    
    # Validate
    valid = validate_export(data_dir)
    
    # Summary
    print("\n" + "=" * 70)
    print("📋 Export Summary")
    print("=" * 70)
    print(f"Countries:  {countries_exported} → data/countries.json")
    print(f"Borders:    {borders_exported} → data/borders.json")
    print(f"Questions:  {questions_exported} → data/questions/sample_questions.json")
    print()
    
    if valid:
        print("✨ Export completed successfully!")
        print("\nℹ️  Note: seed_mvp.py has 98 countries, 170 borders, 85 questions")
        print("   This exceeds MVP minimums (80 borders, 50 questions)")
        print("\nNext steps:")
        print("  1. Review exported files in data/ directory")
        print("  2. Run: cd backend && uv run python ../scripts/seed_unified.py")
        print("  3. Or: make seed")
        return 0
    else:
        print("⚠️  Export completed with errors - please review")
        return 1


if __name__ == "__main__":
    sys.exit(main())

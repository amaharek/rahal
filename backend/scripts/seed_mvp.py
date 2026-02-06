#!/usr/bin/env python3
"""
⚠️  DEPRECATED - Use ../scripts/seed_unified.py instead

MVP Database Seeding Script for Rahal (Legacy)

This script uses hardcoded Python data structures.
Data has been exported to JSON files and is now loaded by seed_unified.py

Seeds the database with:
- 98 countries (all continents)
- 170 borders (connected graph for path-finding)
- 85 questions (across 8 categories, 3 difficulties)
- 2 daily challenges (today + historical)

Please use: ../scripts/seed_unified.py

Old Usage: python -m scripts.seed_mvp
"""

import asyncio
import sys
import unicodedata
from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

# Add parent directory to path for imports
sys.path.insert(0, ".")

from app.core.database import async_session_maker
from app.models.country import Country, Border
from app.models.question import Question, QuestionCategory, QuestionDifficulty, QuestionType
from app.models.game import DailyChallenge


def normalize_arabic(text: str) -> str:
    """Remove diacritics and normalize Arabic text for search."""
    # Normalize unicode
    normalized = unicodedata.normalize("NFKD", text)
    # Remove diacritics (combining marks)
    without_diacritics = "".join(
        c for c in normalized if not unicodedata.combining(c)
    )
    return without_diacritics.strip()


# ============================================================================
# COUNTRY DATA - ~100 countries covering all continents
# ============================================================================

COUNTRIES_DATA = [
    # Middle East & North Africa (MENA)
    {"code": "SAU", "name_ar": "السعودية", "name_en": "Saudi Arabia", "continent": "Asia", "region": "Middle East", "capital_ar": "الرياض", "capital_en": "Riyadh", "flag_emoji": "🇸🇦", "population": 34813871},
    {"code": "EGY", "name_ar": "مصر", "name_en": "Egypt", "continent": "Africa", "region": "North Africa", "capital_ar": "القاهرة", "capital_en": "Cairo", "flag_emoji": "🇪🇬", "population": 102334404},
    {"code": "ARE", "name_ar": "الإمارات", "name_en": "UAE", "continent": "Asia", "region": "Middle East", "capital_ar": "أبو ظبي", "capital_en": "Abu Dhabi", "flag_emoji": "🇦🇪", "population": 9890402},
    {"code": "JOR", "name_ar": "الأردن", "name_en": "Jordan", "continent": "Asia", "region": "Middle East", "capital_ar": "عمّان", "capital_en": "Amman", "flag_emoji": "🇯🇴", "population": 10203134},
    {"code": "LBN", "name_ar": "لبنان", "name_en": "Lebanon", "continent": "Asia", "region": "Middle East", "capital_ar": "بيروت", "capital_en": "Beirut", "flag_emoji": "🇱🇧", "population": 6825445},
    {"code": "SYR", "name_ar": "سوريا", "name_en": "Syria", "continent": "Asia", "region": "Middle East", "capital_ar": "دمشق", "capital_en": "Damascus", "flag_emoji": "🇸🇾", "population": 17500658},
    {"code": "IRQ", "name_ar": "العراق", "name_en": "Iraq", "continent": "Asia", "region": "Middle East", "capital_ar": "بغداد", "capital_en": "Baghdad", "flag_emoji": "🇮🇶", "population": 40222493},
    {"code": "KWT", "name_ar": "الكويت", "name_en": "Kuwait", "continent": "Asia", "region": "Middle East", "capital_ar": "مدينة الكويت", "capital_en": "Kuwait City", "flag_emoji": "🇰🇼", "population": 4270571},
    {"code": "QAT", "name_ar": "قطر", "name_en": "Qatar", "continent": "Asia", "region": "Middle East", "capital_ar": "الدوحة", "capital_en": "Doha", "flag_emoji": "🇶🇦", "population": 2881053},
    {"code": "BHR", "name_ar": "البحرين", "name_en": "Bahrain", "continent": "Asia", "region": "Middle East", "capital_ar": "المنامة", "capital_en": "Manama", "flag_emoji": "🇧🇭", "population": 1701575},
    {"code": "OMN", "name_ar": "عُمان", "name_en": "Oman", "continent": "Asia", "region": "Middle East", "capital_ar": "مسقط", "capital_en": "Muscat", "flag_emoji": "🇴🇲", "population": 5106626},
    {"code": "YEM", "name_ar": "اليمن", "name_en": "Yemen", "continent": "Asia", "region": "Middle East", "capital_ar": "صنعاء", "capital_en": "Sanaa", "flag_emoji": "🇾🇪", "population": 29825964},
    {"code": "PSE", "name_ar": "فلسطين", "name_en": "Palestine", "continent": "Asia", "region": "Middle East", "capital_ar": "القدس", "capital_en": "Jerusalem", "flag_emoji": "🇵🇸", "population": 5101414},
    {"code": "ISR", "name_ar": "إسرائيل", "name_en": "Israel", "continent": "Asia", "region": "Middle East", "capital_ar": "القدس", "capital_en": "Jerusalem", "flag_emoji": "🇮🇱", "population": 8655535},
    {"code": "TUR", "name_ar": "تركيا", "name_en": "Turkey", "continent": "Asia", "region": "Middle East", "capital_ar": "أنقرة", "capital_en": "Ankara", "flag_emoji": "🇹🇷", "population": 84339067},
    {"code": "IRN", "name_ar": "إيران", "name_en": "Iran", "continent": "Asia", "region": "Middle East", "capital_ar": "طهران", "capital_en": "Tehran", "flag_emoji": "🇮🇷", "population": 83992949},

    # North Africa
    {"code": "MAR", "name_ar": "المغرب", "name_en": "Morocco", "continent": "Africa", "region": "North Africa", "capital_ar": "الرباط", "capital_en": "Rabat", "flag_emoji": "🇲🇦", "population": 36910560},
    {"code": "DZA", "name_ar": "الجزائر", "name_en": "Algeria", "continent": "Africa", "region": "North Africa", "capital_ar": "الجزائر", "capital_en": "Algiers", "flag_emoji": "🇩🇿", "population": 43851044},
    {"code": "TUN", "name_ar": "تونس", "name_en": "Tunisia", "continent": "Africa", "region": "North Africa", "capital_ar": "تونس", "capital_en": "Tunis", "flag_emoji": "🇹🇳", "population": 11818619},
    {"code": "LBY", "name_ar": "ليبيا", "name_en": "Libya", "continent": "Africa", "region": "North Africa", "capital_ar": "طرابلس", "capital_en": "Tripoli", "flag_emoji": "🇱🇾", "population": 6871292},
    {"code": "SDN", "name_ar": "السودان", "name_en": "Sudan", "continent": "Africa", "region": "North Africa", "capital_ar": "الخرطوم", "capital_en": "Khartoum", "flag_emoji": "🇸🇩", "population": 43849260},
    {"code": "MRT", "name_ar": "موريتانيا", "name_en": "Mauritania", "continent": "Africa", "region": "North Africa", "capital_ar": "نواكشوط", "capital_en": "Nouakchott", "flag_emoji": "🇲🇷", "population": 4649658},

    # Sub-Saharan Africa
    {"code": "NGA", "name_ar": "نيجيريا", "name_en": "Nigeria", "continent": "Africa", "region": "West Africa", "capital_ar": "أبوجا", "capital_en": "Abuja", "flag_emoji": "🇳🇬", "population": 206139589},
    {"code": "ETH", "name_ar": "إثيوبيا", "name_en": "Ethiopia", "continent": "Africa", "region": "East Africa", "capital_ar": "أديس أبابا", "capital_en": "Addis Ababa", "flag_emoji": "🇪🇹", "population": 114963588},
    {"code": "KEN", "name_ar": "كينيا", "name_en": "Kenya", "continent": "Africa", "region": "East Africa", "capital_ar": "نيروبي", "capital_en": "Nairobi", "flag_emoji": "🇰🇪", "population": 53771296},
    {"code": "ZAF", "name_ar": "جنوب أفريقيا", "name_en": "South Africa", "continent": "Africa", "region": "Southern Africa", "capital_ar": "بريتوريا", "capital_en": "Pretoria", "flag_emoji": "🇿🇦", "population": 59308690},
    {"code": "GHA", "name_ar": "غانا", "name_en": "Ghana", "continent": "Africa", "region": "West Africa", "capital_ar": "أكرا", "capital_en": "Accra", "flag_emoji": "🇬🇭", "population": 31072940},
    {"code": "TZA", "name_ar": "تنزانيا", "name_en": "Tanzania", "continent": "Africa", "region": "East Africa", "capital_ar": "دودوما", "capital_en": "Dodoma", "flag_emoji": "🇹🇿", "population": 59734218},
    {"code": "UGA", "name_ar": "أوغندا", "name_en": "Uganda", "continent": "Africa", "region": "East Africa", "capital_ar": "كمبالا", "capital_en": "Kampala", "flag_emoji": "🇺🇬", "population": 45741007},
    {"code": "SEN", "name_ar": "السنغال", "name_en": "Senegal", "continent": "Africa", "region": "West Africa", "capital_ar": "داكار", "capital_en": "Dakar", "flag_emoji": "🇸🇳", "population": 16743927},
    {"code": "MLI", "name_ar": "مالي", "name_en": "Mali", "continent": "Africa", "region": "West Africa", "capital_ar": "باماكو", "capital_en": "Bamako", "flag_emoji": "🇲🇱", "population": 20250833},
    {"code": "NER", "name_ar": "النيجر", "name_en": "Niger", "continent": "Africa", "region": "West Africa", "capital_ar": "نيامي", "capital_en": "Niamey", "flag_emoji": "🇳🇪", "population": 24206644},
    {"code": "TCD", "name_ar": "تشاد", "name_en": "Chad", "continent": "Africa", "region": "Central Africa", "capital_ar": "نجامينا", "capital_en": "N'Djamena", "flag_emoji": "🇹🇩", "population": 16425864},
    {"code": "CMR", "name_ar": "الكاميرون", "name_en": "Cameroon", "continent": "Africa", "region": "Central Africa", "capital_ar": "ياوندي", "capital_en": "Yaoundé", "flag_emoji": "🇨🇲", "population": 26545863},
    {"code": "SOM", "name_ar": "الصومال", "name_en": "Somalia", "continent": "Africa", "region": "East Africa", "capital_ar": "مقديشو", "capital_en": "Mogadishu", "flag_emoji": "🇸🇴", "population": 15893222},
    {"code": "DJI", "name_ar": "جيبوتي", "name_en": "Djibouti", "continent": "Africa", "region": "East Africa", "capital_ar": "جيبوتي", "capital_en": "Djibouti", "flag_emoji": "🇩🇯", "population": 988000},
    {"code": "ERI", "name_ar": "إريتريا", "name_en": "Eritrea", "continent": "Africa", "region": "East Africa", "capital_ar": "أسمرة", "capital_en": "Asmara", "flag_emoji": "🇪🇷", "population": 3546421},

    # Europe
    {"code": "GBR", "name_ar": "بريطانيا", "name_en": "United Kingdom", "continent": "Europe", "region": "Northern Europe", "capital_ar": "لندن", "capital_en": "London", "flag_emoji": "🇬🇧", "population": 67886011},
    {"code": "FRA", "name_ar": "فرنسا", "name_en": "France", "continent": "Europe", "region": "Western Europe", "capital_ar": "باريس", "capital_en": "Paris", "flag_emoji": "🇫🇷", "population": 65273511},
    {"code": "DEU", "name_ar": "ألمانيا", "name_en": "Germany", "continent": "Europe", "region": "Western Europe", "capital_ar": "برلين", "capital_en": "Berlin", "flag_emoji": "🇩🇪", "population": 83783942},
    {"code": "ITA", "name_ar": "إيطاليا", "name_en": "Italy", "continent": "Europe", "region": "Southern Europe", "capital_ar": "روما", "capital_en": "Rome", "flag_emoji": "🇮🇹", "population": 60461826},
    {"code": "ESP", "name_ar": "إسبانيا", "name_en": "Spain", "continent": "Europe", "region": "Southern Europe", "capital_ar": "مدريد", "capital_en": "Madrid", "flag_emoji": "🇪🇸", "population": 46754778},
    {"code": "PRT", "name_ar": "البرتغال", "name_en": "Portugal", "continent": "Europe", "region": "Southern Europe", "capital_ar": "لشبونة", "capital_en": "Lisbon", "flag_emoji": "🇵🇹", "population": 10196709},
    {"code": "NLD", "name_ar": "هولندا", "name_en": "Netherlands", "continent": "Europe", "region": "Western Europe", "capital_ar": "أمستردام", "capital_en": "Amsterdam", "flag_emoji": "🇳🇱", "population": 17134872},
    {"code": "BEL", "name_ar": "بلجيكا", "name_en": "Belgium", "continent": "Europe", "region": "Western Europe", "capital_ar": "بروكسل", "capital_en": "Brussels", "flag_emoji": "🇧🇪", "population": 11589623},
    {"code": "CHE", "name_ar": "سويسرا", "name_en": "Switzerland", "continent": "Europe", "region": "Western Europe", "capital_ar": "برن", "capital_en": "Bern", "flag_emoji": "🇨🇭", "population": 8654622},
    {"code": "AUT", "name_ar": "النمسا", "name_en": "Austria", "continent": "Europe", "region": "Western Europe", "capital_ar": "فيينا", "capital_en": "Vienna", "flag_emoji": "🇦🇹", "population": 9006398},
    {"code": "SWE", "name_ar": "السويد", "name_en": "Sweden", "continent": "Europe", "region": "Northern Europe", "capital_ar": "ستوكهولم", "capital_en": "Stockholm", "flag_emoji": "🇸🇪", "population": 10099265},
    {"code": "NOR", "name_ar": "النرويج", "name_en": "Norway", "continent": "Europe", "region": "Northern Europe", "capital_ar": "أوسلو", "capital_en": "Oslo", "flag_emoji": "🇳🇴", "population": 5421241},
    {"code": "DNK", "name_ar": "الدنمارك", "name_en": "Denmark", "continent": "Europe", "region": "Northern Europe", "capital_ar": "كوبنهاغن", "capital_en": "Copenhagen", "flag_emoji": "🇩🇰", "population": 5792202},
    {"code": "FIN", "name_ar": "فنلندا", "name_en": "Finland", "continent": "Europe", "region": "Northern Europe", "capital_ar": "هلسنكي", "capital_en": "Helsinki", "flag_emoji": "🇫🇮", "population": 5540720},
    {"code": "POL", "name_ar": "بولندا", "name_en": "Poland", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "وارسو", "capital_en": "Warsaw", "flag_emoji": "🇵🇱", "population": 37846611},
    {"code": "CZE", "name_ar": "التشيك", "name_en": "Czech Republic", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "براغ", "capital_en": "Prague", "flag_emoji": "🇨🇿", "population": 10708981},
    {"code": "GRC", "name_ar": "اليونان", "name_en": "Greece", "continent": "Europe", "region": "Southern Europe", "capital_ar": "أثينا", "capital_en": "Athens", "flag_emoji": "🇬🇷", "population": 10423054},
    {"code": "RUS", "name_ar": "روسيا", "name_en": "Russia", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "موسكو", "capital_en": "Moscow", "flag_emoji": "🇷🇺", "population": 145934462},
    {"code": "UKR", "name_ar": "أوكرانيا", "name_en": "Ukraine", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "كييف", "capital_en": "Kyiv", "flag_emoji": "🇺🇦", "population": 43733762},
    {"code": "ROU", "name_ar": "رومانيا", "name_en": "Romania", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "بوخارست", "capital_en": "Bucharest", "flag_emoji": "🇷🇴", "population": 19237691},
    {"code": "HUN", "name_ar": "المجر", "name_en": "Hungary", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "بودابست", "capital_en": "Budapest", "flag_emoji": "🇭🇺", "population": 9660351},
    {"code": "BGR", "name_ar": "بلغاريا", "name_en": "Bulgaria", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "صوفيا", "capital_en": "Sofia", "flag_emoji": "🇧🇬", "population": 6948445},
    {"code": "SRB", "name_ar": "صربيا", "name_en": "Serbia", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "بلغراد", "capital_en": "Belgrade", "flag_emoji": "🇷🇸", "population": 8737371},
    {"code": "HRV", "name_ar": "كرواتيا", "name_en": "Croatia", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "زغرب", "capital_en": "Zagreb", "flag_emoji": "🇭🇷", "population": 4105267},
    {"code": "SVK", "name_ar": "سلوفاكيا", "name_en": "Slovakia", "continent": "Europe", "region": "Eastern Europe", "capital_ar": "براتيسلافا", "capital_en": "Bratislava", "flag_emoji": "🇸🇰", "population": 5459642},
    {"code": "IRL", "name_ar": "أيرلندا", "name_en": "Ireland", "continent": "Europe", "region": "Northern Europe", "capital_ar": "دبلن", "capital_en": "Dublin", "flag_emoji": "🇮🇪", "population": 4937786},

    # Asia
    {"code": "CHN", "name_ar": "الصين", "name_en": "China", "continent": "Asia", "region": "East Asia", "capital_ar": "بكين", "capital_en": "Beijing", "flag_emoji": "🇨🇳", "population": 1439323776},
    {"code": "JPN", "name_ar": "اليابان", "name_en": "Japan", "continent": "Asia", "region": "East Asia", "capital_ar": "طوكيو", "capital_en": "Tokyo", "flag_emoji": "🇯🇵", "population": 126476461},
    {"code": "KOR", "name_ar": "كوريا الجنوبية", "name_en": "South Korea", "continent": "Asia", "region": "East Asia", "capital_ar": "سيول", "capital_en": "Seoul", "flag_emoji": "🇰🇷", "population": 51269185},
    {"code": "IND", "name_ar": "الهند", "name_en": "India", "continent": "Asia", "region": "South Asia", "capital_ar": "نيودلهي", "capital_en": "New Delhi", "flag_emoji": "🇮🇳", "population": 1380004385},
    {"code": "PAK", "name_ar": "باكستان", "name_en": "Pakistan", "continent": "Asia", "region": "South Asia", "capital_ar": "إسلام آباد", "capital_en": "Islamabad", "flag_emoji": "🇵🇰", "population": 220892340},
    {"code": "BGD", "name_ar": "بنغلاديش", "name_en": "Bangladesh", "continent": "Asia", "region": "South Asia", "capital_ar": "دكا", "capital_en": "Dhaka", "flag_emoji": "🇧🇩", "population": 164689383},
    {"code": "IDN", "name_ar": "إندونيسيا", "name_en": "Indonesia", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "جاكرتا", "capital_en": "Jakarta", "flag_emoji": "🇮🇩", "population": 273523615},
    {"code": "MYS", "name_ar": "ماليزيا", "name_en": "Malaysia", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "كوالالمبور", "capital_en": "Kuala Lumpur", "flag_emoji": "🇲🇾", "population": 32365999},
    {"code": "THA", "name_ar": "تايلاند", "name_en": "Thailand", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "بانكوك", "capital_en": "Bangkok", "flag_emoji": "🇹🇭", "population": 69799978},
    {"code": "VNM", "name_ar": "فيتنام", "name_en": "Vietnam", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "هانوي", "capital_en": "Hanoi", "flag_emoji": "🇻🇳", "population": 97338579},
    {"code": "PHL", "name_ar": "الفلبين", "name_en": "Philippines", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "مانيلا", "capital_en": "Manila", "flag_emoji": "🇵🇭", "population": 109581078},
    {"code": "SGP", "name_ar": "سنغافورة", "name_en": "Singapore", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "سنغافورة", "capital_en": "Singapore", "flag_emoji": "🇸🇬", "population": 5850342},
    {"code": "AFG", "name_ar": "أفغانستان", "name_en": "Afghanistan", "continent": "Asia", "region": "South Asia", "capital_ar": "كابول", "capital_en": "Kabul", "flag_emoji": "🇦🇫", "population": 38928346},
    {"code": "KAZ", "name_ar": "كازاخستان", "name_en": "Kazakhstan", "continent": "Asia", "region": "Central Asia", "capital_ar": "أستانا", "capital_en": "Astana", "flag_emoji": "🇰🇿", "population": 18776707},
    {"code": "UZB", "name_ar": "أوزبكستان", "name_en": "Uzbekistan", "continent": "Asia", "region": "Central Asia", "capital_ar": "طشقند", "capital_en": "Tashkent", "flag_emoji": "🇺🇿", "population": 33469203},
    {"code": "TKM", "name_ar": "تركمانستان", "name_en": "Turkmenistan", "continent": "Asia", "region": "Central Asia", "capital_ar": "عشق آباد", "capital_en": "Ashgabat", "flag_emoji": "🇹🇲", "population": 6031200},
    {"code": "MMR", "name_ar": "ميانمار", "name_en": "Myanmar", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "نايبيداو", "capital_en": "Naypyidaw", "flag_emoji": "🇲🇲", "population": 54409800},
    {"code": "LAO", "name_ar": "لاوس", "name_en": "Laos", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "فيينتيان", "capital_en": "Vientiane", "flag_emoji": "🇱🇦", "population": 7275560},
    {"code": "KHM", "name_ar": "كمبوديا", "name_en": "Cambodia", "continent": "Asia", "region": "Southeast Asia", "capital_ar": "بنوم بنه", "capital_en": "Phnom Penh", "flag_emoji": "🇰🇭", "population": 16718965},
    {"code": "NPL", "name_ar": "نيبال", "name_en": "Nepal", "continent": "Asia", "region": "South Asia", "capital_ar": "كاتماندو", "capital_en": "Kathmandu", "flag_emoji": "🇳🇵", "population": 29136808},

    # Americas
    {"code": "USA", "name_ar": "الولايات المتحدة", "name_en": "United States", "continent": "North America", "region": "North America", "capital_ar": "واشنطن", "capital_en": "Washington D.C.", "flag_emoji": "🇺🇸", "population": 331002651},
    {"code": "CAN", "name_ar": "كندا", "name_en": "Canada", "continent": "North America", "region": "North America", "capital_ar": "أوتاوا", "capital_en": "Ottawa", "flag_emoji": "🇨🇦", "population": 37742154},
    {"code": "MEX", "name_ar": "المكسيك", "name_en": "Mexico", "continent": "North America", "region": "Central America", "capital_ar": "مكسيكو سيتي", "capital_en": "Mexico City", "flag_emoji": "🇲🇽", "population": 128932753},
    {"code": "BRA", "name_ar": "البرازيل", "name_en": "Brazil", "continent": "South America", "region": "South America", "capital_ar": "برازيليا", "capital_en": "Brasilia", "flag_emoji": "🇧🇷", "population": 212559417},
    {"code": "ARG", "name_ar": "الأرجنتين", "name_en": "Argentina", "continent": "South America", "region": "South America", "capital_ar": "بوينس آيرس", "capital_en": "Buenos Aires", "flag_emoji": "🇦🇷", "population": 45195774},
    {"code": "COL", "name_ar": "كولومبيا", "name_en": "Colombia", "continent": "South America", "region": "South America", "capital_ar": "بوغوتا", "capital_en": "Bogota", "flag_emoji": "🇨🇴", "population": 50882891},
    {"code": "CHL", "name_ar": "تشيلي", "name_en": "Chile", "continent": "South America", "region": "South America", "capital_ar": "سانتياغو", "capital_en": "Santiago", "flag_emoji": "🇨🇱", "population": 19116201},
    {"code": "PER", "name_ar": "بيرو", "name_en": "Peru", "continent": "South America", "region": "South America", "capital_ar": "ليما", "capital_en": "Lima", "flag_emoji": "🇵🇪", "population": 32971854},
    {"code": "VEN", "name_ar": "فنزويلا", "name_en": "Venezuela", "continent": "South America", "region": "South America", "capital_ar": "كاراكاس", "capital_en": "Caracas", "flag_emoji": "🇻🇪", "population": 28435940},
    {"code": "ECU", "name_ar": "الإكوادور", "name_en": "Ecuador", "continent": "South America", "region": "South America", "capital_ar": "كيتو", "capital_en": "Quito", "flag_emoji": "🇪🇨", "population": 17643054},
    {"code": "BOL", "name_ar": "بوليفيا", "name_en": "Bolivia", "continent": "South America", "region": "South America", "capital_ar": "سوكري", "capital_en": "Sucre", "flag_emoji": "🇧🇴", "population": 11673021},
    {"code": "PRY", "name_ar": "باراغواي", "name_en": "Paraguay", "continent": "South America", "region": "South America", "capital_ar": "أسونسيون", "capital_en": "Asuncion", "flag_emoji": "🇵🇾", "population": 7132538},
    {"code": "URY", "name_ar": "أوروغواي", "name_en": "Uruguay", "continent": "South America", "region": "South America", "capital_ar": "مونتيفيديو", "capital_en": "Montevideo", "flag_emoji": "🇺🇾", "population": 3473730},

    # Oceania
    {"code": "AUS", "name_ar": "أستراليا", "name_en": "Australia", "continent": "Oceania", "region": "Oceania", "capital_ar": "كانبرا", "capital_en": "Canberra", "flag_emoji": "🇦🇺", "population": 25499884},
    {"code": "NZL", "name_ar": "نيوزيلندا", "name_en": "New Zealand", "continent": "Oceania", "region": "Oceania", "capital_ar": "ويلينغتون", "capital_en": "Wellington", "flag_emoji": "🇳🇿", "population": 4822233},
]

# ============================================================================
# BORDER DATA - Country pairs that share borders
# The script will automatically sort UUIDs to satisfy CHECK constraint
# ============================================================================

BORDERS_DATA = [
    # Middle East borders
    ("SAU", "JOR"), ("SAU", "IRQ"), ("SAU", "KWT"), ("SAU", "QAT"),
    ("SAU", "ARE"), ("SAU", "OMN"), ("SAU", "YEM"),
    ("JOR", "SYR"), ("JOR", "IRQ"), ("JOR", "ISR"), ("JOR", "PSE"),
    ("LBN", "SYR"), ("LBN", "ISR"),
    ("SYR", "TUR"), ("SYR", "IRQ"), ("SYR", "ISR"),
    ("IRQ", "TUR"), ("IRQ", "IRN"), ("IRQ", "KWT"),
    ("IRN", "TUR"), ("IRN", "AFG"), ("IRN", "PAK"), ("IRN", "TKM"),
    ("OMN", "ARE"), ("OMN", "YEM"),
    ("ISR", "EGY"), ("ISR", "PSE"),
    ("TUR", "GRC"), ("TUR", "BGR"),

    # North Africa borders
    ("EGY", "LBY"), ("EGY", "SDN"),
    ("LBY", "TUN"), ("LBY", "DZA"), ("LBY", "NER"), ("LBY", "TCD"), ("LBY", "SDN"),
    ("TUN", "DZA"),
    ("DZA", "MAR"), ("DZA", "MRT"), ("DZA", "MLI"), ("DZA", "NER"),
    ("MAR", "MRT"),
    ("SDN", "TCD"), ("SDN", "ETH"), ("SDN", "ERI"),
    ("MRT", "MLI"), ("MRT", "SEN"),

    # Sub-Saharan Africa borders
    ("MLI", "SEN"), ("MLI", "NER"),
    ("SEN", "GHA"),  # Not directly adjacent but for graph connectivity
    ("NER", "NGA"), ("NER", "TCD"),
    ("NGA", "CMR"), ("NGA", "TCD"),
    ("TCD", "CMR"), ("TCD", "SDN"),
    ("CMR", "NGA"),
    ("ETH", "ERI"), ("ETH", "DJI"), ("ETH", "SOM"), ("ETH", "KEN"), ("ETH", "SDN"),
    ("SOM", "KEN"), ("SOM", "DJI"),
    ("KEN", "TZA"), ("KEN", "UGA"),
    ("TZA", "UGA"),

    # Europe borders
    ("FRA", "ESP"), ("FRA", "BEL"), ("FRA", "DEU"), ("FRA", "CHE"), ("FRA", "ITA"),
    ("ESP", "PRT"),
    ("DEU", "NLD"), ("DEU", "BEL"), ("DEU", "CHE"), ("DEU", "AUT"), ("DEU", "POL"), ("DEU", "CZE"), ("DEU", "DNK"),
    ("ITA", "CHE"), ("ITA", "AUT"), ("ITA", "FRA"),
    ("CHE", "AUT"),
    ("AUT", "CZE"), ("AUT", "HUN"), ("AUT", "SVK"),
    ("POL", "CZE"), ("POL", "SVK"), ("POL", "UKR"), ("POL", "RUS"),
    ("HUN", "SVK"), ("HUN", "UKR"), ("HUN", "ROU"), ("HUN", "SRB"), ("HUN", "HRV"),
    ("ROU", "UKR"), ("ROU", "BGR"), ("ROU", "SRB"), ("ROU", "HUN"),
    ("BGR", "GRC"), ("BGR", "SRB"), ("BGR", "TUR"),
    ("SRB", "HRV"), ("SRB", "BGR"),
    ("GRC", "TUR"), ("GRC", "BGR"),
    ("NOR", "SWE"), ("NOR", "FIN"), ("NOR", "RUS"),
    ("SWE", "FIN"), ("SWE", "NOR"),
    ("FIN", "RUS"),
    ("RUS", "UKR"), ("RUS", "KAZ"),

    # Asia borders
    ("CHN", "RUS"), ("CHN", "KAZ"), ("CHN", "IND"), ("CHN", "PAK"), ("CHN", "AFG"),
    ("CHN", "NPL"), ("CHN", "MMR"), ("CHN", "LAO"), ("CHN", "VNM"),
    ("IND", "PAK"), ("IND", "NPL"), ("IND", "BGD"), ("IND", "MMR"),
    ("PAK", "AFG"), ("PAK", "IRN"), ("PAK", "CHN"),
    ("AFG", "TKM"), ("AFG", "UZB"), ("AFG", "PAK"),
    ("KAZ", "UZB"), ("KAZ", "TKM"), ("KAZ", "RUS"),
    ("UZB", "TKM"), ("UZB", "AFG"),
    ("THA", "MMR"), ("THA", "LAO"), ("THA", "KHM"), ("THA", "MYS"),
    ("VNM", "LAO"), ("VNM", "KHM"),
    ("LAO", "KHM"), ("LAO", "MMR"),

    # Americas borders
    ("USA", "CAN"), ("USA", "MEX"),
    ("MEX", "USA"),
    ("BRA", "ARG"), ("BRA", "URY"), ("BRA", "PRY"), ("BRA", "BOL"), ("BRA", "PER"),
    ("BRA", "COL"), ("BRA", "VEN"), ("BRA", "ECU"),  # Guyana etc simplified
    ("ARG", "CHL"), ("ARG", "BOL"), ("ARG", "PRY"), ("ARG", "URY"),
    ("CHL", "PER"), ("CHL", "BOL"),
    ("PER", "ECU"), ("PER", "COL"), ("PER", "BOL"),
    ("COL", "VEN"), ("COL", "ECU"),
    ("BOL", "PRY"),
]

# ============================================================================
# QUESTIONS DATA - 100+ questions across categories
# ============================================================================

QUESTIONS_DATA = [
    # CAPITALS - Easy
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة مصر؟",
     "correct_answer": "القاهرة",
     "options": {"options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة السعودية؟",
     "correct_answer": "الرياض",
     "options": {"options": ["الرياض", "جدة", "مكة", "المدينة"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة الإمارات؟",
     "correct_answer": "أبو ظبي",
     "options": {"options": ["أبو ظبي", "دبي", "الشارقة", "العين"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة فرنسا؟",
     "correct_answer": "باريس",
     "options": {"options": ["باريس", "ليون", "مرسيليا", "نيس"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة بريطانيا؟",
     "correct_answer": "لندن",
     "options": {"options": ["لندن", "مانشستر", "ليفربول", "برمنغهام"]}},

    # CAPITALS - Medium
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة كازاخستان؟",
     "correct_answer": "أستانا",
     "options": {"options": ["أستانا", "ألماتي", "شيمكنت", "أكتوبي"]}},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة البرازيل؟",
     "correct_answer": "برازيليا",
     "options": {"options": ["برازيليا", "ريو دي جانيرو", "ساو باولو", "سلفادور"]}},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة أستراليا؟",
     "correct_answer": "كانبرا",
     "options": {"options": ["كانبرا", "سيدني", "ملبورن", "بريسبان"]}},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة تركيا؟",
     "correct_answer": "أنقرة",
     "options": {"options": ["أنقرة", "إسطنبول", "إزمير", "أنطاليا"]}},
    {"category": "capitals", "difficulty": "medium", "question_type": "autocomplete",
     "question_ar": "ما هي عاصمة ميانمار؟",
     "correct_answer": "نايبيداو",
     "options": None},

    # CAPITALS - Hard
    {"category": "capitals", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "ما هي عاصمة بوروندي؟",
     "correct_answer": "غيتيغا",
     "options": None},
    {"category": "capitals", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "ما هي عاصمة ناورو؟",
     "correct_answer": "يارين",
     "options": None},

    # FLAGS - Easy
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هو لون علم المملكة العربية السعودية؟",
     "correct_answer": "أخضر",
     "options": {"options": ["أخضر", "أحمر", "أزرق", "أصفر"]}},
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "كم عدد النجوم على علم الولايات المتحدة؟",
     "correct_answer": "50",
     "options": {"options": ["50", "48", "52", "13"]}},
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما لون النجمة على علم المغرب؟",
     "correct_answer": "أخضر",
     "options": {"options": ["أخضر", "أحمر", "أصفر", "أبيض"]}},
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما لون خلفية علم اليابان؟",
     "correct_answer": "أبيض",
     "options": {"options": ["أبيض", "أحمر", "أزرق", "أصفر"]}},

    # FLAGS - Medium
    {"category": "flags", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة يحتوي علمها على نسر؟",
     "correct_answer": "المكسيك",
     "options": {"options": ["المكسيك", "البرازيل", "الأرجنتين", "كولومبيا"]}},
    {"category": "flags", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "كم عدد ألوان علم جنوب أفريقيا؟",
     "correct_answer": "6",
     "options": {"options": ["6", "4", "5", "3"]}},

    # FLAGS - Hard
    {"category": "flags", "difficulty": "hard", "question_type": "multiple_choice",
     "question_ar": "أي دولة لديها علم مربع الشكل؟",
     "correct_answer": "سويسرا",
     "options": {"options": ["سويسرا", "النمسا", "ألمانيا", "بلجيكا"]}},

    # LANDMARKS - Easy
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد برج إيفل؟",
     "correct_answer": "فرنسا",
     "options": {"options": ["فرنسا", "إيطاليا", "إسبانيا", "بريطانيا"]}},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة توجد أهرامات الجيزة؟",
     "correct_answer": "مصر",
     "options": {"options": ["مصر", "السودان", "المكسيك", "العراق"]}},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد تاج محل؟",
     "correct_answer": "الهند",
     "options": {"options": ["الهند", "باكستان", "إيران", "بنغلاديش"]}},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد سور الصين العظيم؟",
     "correct_answer": "الصين",
     "options": {"options": ["الصين", "اليابان", "كوريا", "منغوليا"]}},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد الكولوسيوم؟",
     "correct_answer": "إيطاليا",
     "options": {"options": ["إيطاليا", "اليونان", "إسبانيا", "تركيا"]}},

    # LANDMARKS - Medium
    {"category": "landmarks", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد ماتشو بيتشو؟",
     "correct_answer": "بيرو",
     "options": {"options": ["بيرو", "البرازيل", "بوليفيا", "الإكوادور"]}},
    {"category": "landmarks", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "في أي دولة توجد البتراء؟",
     "correct_answer": "الأردن",
     "options": {"options": ["الأردن", "فلسطين", "سوريا", "لبنان"]}},
    {"category": "landmarks", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد برج خليفة؟",
     "correct_answer": "الإمارات",
     "options": {"options": ["الإمارات", "السعودية", "قطر", "الكويت"]}},

    # LANDMARKS - Hard
    {"category": "landmarks", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "في أي دولة يوجد معبد أنغكور وات؟",
     "correct_answer": "كمبوديا",
     "options": None},

    # GEOGRAPHY - Easy
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هو أكبر محيط في العالم؟",
     "correct_answer": "المحيط الهادئ",
     "options": {"options": ["المحيط الهادئ", "المحيط الأطلسي", "المحيط الهندي", "المحيط المتجمد"]}},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي أكبر قارة في العالم؟",
     "correct_answer": "آسيا",
     "options": {"options": ["آسيا", "أفريقيا", "أمريكا الشمالية", "أوروبا"]}},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هو أطول نهر في العالم؟",
     "correct_answer": "نهر النيل",
     "options": {"options": ["نهر النيل", "نهر الأمازون", "نهر المسيسيبي", "نهر اليانغتسي"]}},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي أكبر صحراء في العالم؟",
     "correct_answer": "الصحراء الكبرى",
     "options": {"options": ["الصحراء الكبرى", "صحراء جوبي", "صحراء كالاهاري", "صحراء أتاكاما"]}},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هو أعلى جبل في العالم؟",
     "correct_answer": "جبل إيفرست",
     "options": {"options": ["جبل إيفرست", "جبل كيليمنجارو", "جبل مونت بلان", "جبل فوجي"]}},

    # GEOGRAPHY - Medium
    {"category": "geography", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة تمتد على قارتين؟",
     "correct_answer": "تركيا",
     "options": {"options": ["تركيا", "إيران", "السعودية", "باكستان"]}},
    {"category": "geography", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هي أصغر دولة في العالم؟",
     "correct_answer": "الفاتيكان",
     "options": {"options": ["الفاتيكان", "موناكو", "سان مارينو", "ليختنشتاين"]}},
    {"category": "geography", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "كم عدد الدول التي يمر بها نهر الدانوب؟",
     "correct_answer": "10",
     "options": {"options": ["10", "8", "6", "12"]}},

    # GEOGRAPHY - Hard
    {"category": "geography", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "ما هي أعمق نقطة في المحيطات؟",
     "correct_answer": "خندق ماريانا",
     "options": None},

    # BORDERS - Easy
    {"category": "borders", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي دولة تشترك في الحدود مع مصر؟",
     "correct_answer": "ليبيا",
     "options": {"options": ["ليبيا", "تونس", "المغرب", "الجزائر"]}},
    {"category": "borders", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي دولة تشترك في الحدود مع السعودية؟",
     "correct_answer": "الأردن",
     "options": {"options": ["الأردن", "لبنان", "سوريا", "فلسطين"]}},
    {"category": "borders", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي دولة لا تشترك في الحدود مع الصين؟",
     "correct_answer": "اليابان",
     "options": {"options": ["اليابان", "الهند", "باكستان", "روسيا"]}},
    {"category": "borders", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "كم دولة تشترك في الحدود مع ألمانيا؟",
     "correct_answer": "9",
     "options": {"options": ["9", "7", "5", "11"]}},

    # BORDERS - Medium
    {"category": "borders", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة لديها أطول حدود برية في العالم؟",
     "correct_answer": "كندا",
     "options": {"options": ["كندا", "روسيا", "الصين", "البرازيل"]}},
    {"category": "borders", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة تشترك في الحدود مع 14 دولة؟",
     "correct_answer": "الصين",
     "options": {"options": ["الصين", "روسيا", "البرازيل", "الهند"]}},

    # BORDERS - Hard
    {"category": "borders", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "ما هي الدولة الوحيدة التي تشترك في الحدود مع كل من فرنسا وإسبانيا؟",
     "correct_answer": "أندورا",
     "options": None},

    # POPULATION - Easy
    {"category": "population", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي أكبر دولة من حيث عدد السكان؟",
     "correct_answer": "الصين",
     "options": {"options": ["الصين", "الهند", "الولايات المتحدة", "إندونيسيا"]}},
    {"category": "population", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي دولة عربية لديها أكبر عدد سكان؟",
     "correct_answer": "مصر",
     "options": {"options": ["مصر", "السعودية", "العراق", "المغرب"]}},
    {"category": "population", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي أكبر دولة أوروبية من حيث السكان؟",
     "correct_answer": "روسيا",
     "options": {"options": ["روسيا", "ألمانيا", "فرنسا", "بريطانيا"]}},

    # POPULATION - Medium
    {"category": "population", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "كم عدد سكان الهند تقريباً؟",
     "correct_answer": "1.4 مليار",
     "options": {"options": ["1.4 مليار", "800 مليون", "2 مليار", "500 مليون"]}},
    {"category": "population", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة لديها أعلى كثافة سكانية؟",
     "correct_answer": "موناكو",
     "options": {"options": ["موناكو", "سنغافورة", "هونغ كونغ", "مالطا"]}},

    # POPULATION - Hard
    {"category": "population", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "كم عدد سكان نيجيريا تقريباً بالمليون؟",
     "correct_answer": "200",
     "options": None},

    # ARAB_WORLD - Easy
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "كم عدد الدول العربية؟",
     "correct_answer": "22",
     "options": {"options": ["22", "20", "18", "24"]}},
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي دولة عربية هي الأكبر مساحة؟",
     "correct_answer": "الجزائر",
     "options": {"options": ["الجزائر", "السعودية", "السودان", "ليبيا"]}},
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي قارة تقع معظم الدول العربية؟",
     "correct_answer": "أفريقيا",
     "options": {"options": ["أفريقيا", "آسيا", "متساوية", "أوروبا"]}},
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي العملة الرسمية للسعودية؟",
     "correct_answer": "الريال",
     "options": {"options": ["الريال", "الدرهم", "الدينار", "الجنيه"]}},
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أين يقع المسجد الأقصى؟",
     "correct_answer": "القدس",
     "options": {"options": ["القدس", "مكة", "المدينة", "دمشق"]}},

    # ARAB_WORLD - Medium
    {"category": "arab_world", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة عربية ليست عضواً في جامعة الدول العربية منذ التأسيس؟",
     "correct_answer": "جيبوتي",
     "options": {"options": ["جيبوتي", "مصر", "السعودية", "العراق"]}},
    {"category": "arab_world", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "متى تأسست جامعة الدول العربية؟",
     "correct_answer": "1945",
     "options": {"options": ["1945", "1948", "1952", "1956"]}},
    {"category": "arab_world", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة عربية تقع بالكامل في آسيا ولها حدود مع إيران؟",
     "correct_answer": "العراق",
     "options": {"options": ["العراق", "الأردن", "لبنان", "سوريا"]}},

    # ARAB_WORLD - Hard
    {"category": "arab_world", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "في أي سنة استقلت الجزائر؟",
     "correct_answer": "1962",
     "options": None},

    # ATTRACTIONS - Easy
    {"category": "attractions", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد ديزني لاند الأصلي؟",
     "correct_answer": "الولايات المتحدة",
     "options": {"options": ["الولايات المتحدة", "فرنسا", "اليابان", "الصين"]}},
    {"category": "attractions", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أين يقع برج العرب؟",
     "correct_answer": "دبي",
     "options": {"options": ["دبي", "أبو ظبي", "الدوحة", "الكويت"]}},
    {"category": "attractions", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي مدينة يوجد تمثال الحرية؟",
     "correct_answer": "نيويورك",
     "options": {"options": ["نيويورك", "واشنطن", "لوس أنجلوس", "شيكاغو"]}},

    # ATTRACTIONS - Medium
    {"category": "attractions", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أين يقع متحف اللوفر؟",
     "correct_answer": "باريس",
     "options": {"options": ["باريس", "لندن", "روما", "برلين"]}},
    {"category": "attractions", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "في أي دولة توجد شلالات نياجرا؟",
     "correct_answer": "كندا والولايات المتحدة",
     "options": {"options": ["كندا والولايات المتحدة", "البرازيل", "الأرجنتين", "فنزويلا"]}},

    # ATTRACTIONS - Hard
    {"category": "attractions", "difficulty": "hard", "question_type": "autocomplete",
     "question_ar": "في أي دولة يوجد منتزه سيرينغيتي الوطني؟",
     "correct_answer": "تنزانيا",
     "options": None},

    # More questions to reach 100+
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة اليابان؟",
     "correct_answer": "طوكيو",
     "options": {"options": ["طوكيو", "أوساكا", "كيوتو", "يوكوهاما"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة الصين؟",
     "correct_answer": "بكين",
     "options": {"options": ["بكين", "شنغهاي", "هونغ كونغ", "قوانغجو"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة روسيا؟",
     "correct_answer": "موسكو",
     "options": {"options": ["موسكو", "سان بطرسبرغ", "نوفوسيبيرسك", "يكاترينبورغ"]}},
    {"category": "capitals", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة الهند؟",
     "correct_answer": "نيودلهي",
     "options": {"options": ["نيودلهي", "مومباي", "كولكاتا", "بنغالور"]}},
    {"category": "capitals", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة كندا؟",
     "correct_answer": "أوتاوا",
     "options": {"options": ["أوتاوا", "تورونتو", "فانكوفر", "مونتريال"]}},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي قارة تقع مصر؟",
     "correct_answer": "أفريقيا",
     "options": {"options": ["أفريقيا", "آسيا", "أوروبا", "أمريكا"]}},
    {"category": "geography", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي بحر يفصل بين أوروبا وأفريقيا؟",
     "correct_answer": "البحر المتوسط",
     "options": {"options": ["البحر المتوسط", "البحر الأحمر", "البحر الأسود", "بحر العرب"]}},
    {"category": "geography", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "ما هو المضيق الذي يربط البحر المتوسط بالمحيط الأطلسي؟",
     "correct_answer": "مضيق جبل طارق",
     "options": {"options": ["مضيق جبل طارق", "مضيق هرمز", "مضيق باب المندب", "قناة السويس"]}},
    {"category": "flags", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما لون علم ليبيا القديم (2011 وما قبل)؟",
     "correct_answer": "أخضر",
     "options": {"options": ["أخضر", "أحمر", "أبيض", "أسود"]}},
    {"category": "flags", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "أي دولة علمها يحتوي على هلال ونجمة؟",
     "correct_answer": "تركيا",
     "options": {"options": ["تركيا", "السعودية", "الإمارات", "مصر"]}},
    {"category": "landmarks", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي دولة توجد ساعة بيغ بن؟",
     "correct_answer": "بريطانيا",
     "options": {"options": ["بريطانيا", "فرنسا", "ألمانيا", "إيطاليا"]}},
    {"category": "landmarks", "difficulty": "medium", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد تمثال المسيح الفادي؟",
     "correct_answer": "البرازيل",
     "options": {"options": ["البرازيل", "الأرجنتين", "البرتغال", "إسبانيا"]}},
    {"category": "borders", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "أي دولة تشترك في الحدود مع الولايات المتحدة من الشمال؟",
     "correct_answer": "كندا",
     "options": {"options": ["كندا", "المكسيك", "كوبا", "جواتيمالا"]}},
    {"category": "population", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي ثاني أكبر دولة من حيث السكان؟",
     "correct_answer": "الهند",
     "options": {"options": ["الهند", "الولايات المتحدة", "إندونيسيا", "البرازيل"]}},
    {"category": "arab_world", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "ما هي أصغر دولة عربية مساحة؟",
     "correct_answer": "البحرين",
     "options": {"options": ["البحرين", "قطر", "الكويت", "لبنان"]}},
    {"category": "attractions", "difficulty": "easy", "question_type": "multiple_choice",
     "question_ar": "في أي مدينة يقع برج بيزا المائل؟",
     "correct_answer": "بيزا",
     "options": {"options": ["بيزا", "روما", "فلورنسا", "ميلانو"]}},
    {"category": "geography", "difficulty": "hard", "question_type": "multiple_choice",
     "question_ar": "ما هي أكبر جزيرة في العالم؟",
     "correct_answer": "غرينلاند",
     "options": {"options": ["غرينلاند", "أستراليا", "بورنيو", "مدغشقر"]}},
    {"category": "capitals", "difficulty": "hard", "question_type": "multiple_choice",
     "question_ar": "ما هي عاصمة سريلانكا؟",
     "correct_answer": "سري جاياواردنبورا كوتي",
     "options": {"options": ["سري جاياواردنبورا كوتي", "كولومبو", "كاندي", "غال"]}},
    {"category": "flags", "difficulty": "hard", "question_type": "multiple_choice",
     "question_ar": "أي دولة علمها ليس مستطيلاً؟",
     "correct_answer": "نيبال",
     "options": {"options": ["نيبال", "سويسرا", "الفاتيكان", "موناكو"]}},
    {"category": "landmarks", "difficulty": "hard", "question_type": "multiple_choice",
     "question_ar": "في أي دولة يوجد قصر بوتالا؟",
     "correct_answer": "الصين",
     "options": {"options": ["الصين", "نيبال", "بوتان", "الهند"]}},
]


async def seed_countries(session: AsyncSession) -> dict[str, Country]:
    """Seed countries and return a mapping of code -> Country."""
    print("Seeding countries...")

    # Check if countries already exist
    result = await session.execute(select(Country).limit(1))
    if result.scalar_one_or_none():
        print("  Countries already exist, loading existing data...")
        result = await session.execute(select(Country))
        countries = result.scalars().all()
        return {c.code: c for c in countries}

    country_map = {}
    for data in COUNTRIES_DATA:
        country = Country(
            id=uuid4(),
            code=data["code"],
            name_ar=data["name_ar"],
            name_en=data["name_en"],
            name_ar_normalized=normalize_arabic(data["name_ar"]),
            continent=data.get("continent"),
            region=data.get("region"),
            capital_ar=data.get("capital_ar"),
            capital_en=data.get("capital_en"),
            flag_emoji=data.get("flag_emoji"),
            population=data.get("population"),
        )
        session.add(country)
        country_map[data["code"]] = country

    await session.flush()
    print(f"  Created {len(country_map)} countries")
    return country_map


async def seed_borders(session: AsyncSession, country_map: dict[str, Country]) -> int:
    """Seed borders between countries. Returns count of borders created."""
    print("Seeding borders...")

    # Check if borders already exist
    result = await session.execute(select(Border).limit(1))
    if result.scalar_one_or_none():
        print("  Borders already exist, skipping...")
        result = await session.execute(select(Border))
        return len(result.scalars().all())

    borders_created = 0
    seen_pairs = set()

    for code_a, code_b in BORDERS_DATA:
        if code_a not in country_map or code_b not in country_map:
            print(f"  Warning: Skipping border {code_a}-{code_b}, country not found")
            continue

        country_a = country_map[code_a]
        country_b = country_map[code_b]

        # Sort UUIDs to satisfy CHECK constraint (country_a_id < country_b_id)
        if str(country_a.id) > str(country_b.id):
            country_a, country_b = country_b, country_a

        # Skip duplicates
        pair_key = (str(country_a.id), str(country_b.id))
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)

        border = Border(
            id=uuid4(),
            country_a_id=country_a.id,
            country_b_id=country_b.id,
            border_type="land",
        )
        session.add(border)
        borders_created += 1

    await session.flush()
    print(f"  Created {borders_created} borders")
    return borders_created


async def seed_questions(session: AsyncSession) -> int:
    """Seed questions. Returns count of questions created."""
    print("Seeding questions...")

    # Check if questions already exist
    result = await session.execute(select(Question).limit(1))
    if result.scalar_one_or_none():
        print("  Questions already exist, skipping...")
        result = await session.execute(select(Question))
        return len(result.scalars().all())

    questions_created = 0
    for data in QUESTIONS_DATA:
        question = Question(
            id=uuid4(),
            category=data["category"],
            difficulty=data["difficulty"],
            question_type=data["question_type"],
            question_ar=data["question_ar"],
            correct_answer=data["correct_answer"],
            correct_answer_normalized=normalize_arabic(data["correct_answer"]),
            options=data.get("options"),
            hint=data.get("hint"),
            image_url=data.get("image_url"),
            is_active=True,
        )
        session.add(question)
        questions_created += 1

    await session.flush()
    print(f"  Created {questions_created} questions")
    return questions_created


async def seed_daily_challenges(session: AsyncSession, country_map: dict[str, Country]) -> int:
    """Seed daily challenges. Returns count created."""
    print("Seeding daily challenges...")

    # Check if challenges already exist
    result = await session.execute(select(DailyChallenge).limit(1))
    if result.scalar_one_or_none():
        print("  Daily challenges already exist, skipping...")
        result = await session.execute(select(DailyChallenge))
        return len(result.scalars().all())

    today = date.today()
    yesterday = today - timedelta(days=1)

    challenges = [
        # Today's challenge: Saudi Arabia -> Egypt (via Jordan)
        {
            "date": today,
            "start": "SAU",
            "end": "EGY",
            "shortest_path": 2,  # SAU -> JOR -> EGY (via Israel/Palestine)
            "solution": ["SAU", "JOR", "ISR", "EGY"],
        },
        # Yesterday's challenge: Morocco -> Tunisia (via Algeria)
        {
            "date": yesterday,
            "start": "MAR",
            "end": "TUN",
            "shortest_path": 2,  # MAR -> DZA -> TUN
            "solution": ["MAR", "DZA", "TUN"],
        },
    ]

    created = 0
    for c in challenges:
        if c["start"] not in country_map or c["end"] not in country_map:
            print(f"  Warning: Skipping challenge, country not found")
            continue

        challenge = DailyChallenge(
            id=uuid4(),
            challenge_date=c["date"],
            start_country_id=country_map[c["start"]].id,
            end_country_id=country_map[c["end"]].id,
            shortest_path=c["shortest_path"],
            solution_path=[str(country_map[code].id) for code in c["solution"]],
        )
        session.add(challenge)
        created += 1

    await session.flush()
    print(f"  Created {created} daily challenges")
    return created


async def main():
    """Main seeding function."""
    print("=" * 60)
    print("Rahal MVP Database Seeding")
    print("=" * 60)

    async with async_session_maker() as session:
        try:
            # Seed in order
            country_map = await seed_countries(session)
            borders_count = await seed_borders(session, country_map)
            questions_count = await seed_questions(session)
            challenges_count = await seed_daily_challenges(session, country_map)

            # Commit all changes
            await session.commit()

            print("\n" + "=" * 60)
            print("Seeding Complete!")
            print("=" * 60)
            print(f"Countries:        {len(country_map)}")
            print(f"Borders:          {borders_count}")
            print(f"Questions:        {questions_count}")
            print(f"Daily Challenges: {challenges_count}")
            print("=" * 60)

        except Exception as e:
            await session.rollback()
            print(f"\nError during seeding: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())

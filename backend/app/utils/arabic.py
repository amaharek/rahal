"""
Arabic text processing utilities.
Handles normalization, diacritic removal, and similarity calculations.
"""

import re
import unicodedata
from difflib import SequenceMatcher

# Arabic diacritics (tashkeel) to remove for normalization
ARABIC_DIACRITICS = re.compile(
    r"[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]"
)

# Hamza variations to normalize
HAMZA_MAP = {
    "أ": "ا",  # Alef with hamza above -> Alef
    "إ": "ا",  # Alef with hamza below -> Alef
    "آ": "ا",  # Alef with madda -> Alef
    "ٱ": "ا",  # Alef wasla -> Alef
    "ؤ": "و",  # Waw with hamza -> Waw
    "ئ": "ي",  # Yeh with hamza -> Yeh
    "ى": "ي",  # Alef maksura -> Yeh
    "ة": "ه",  # Teh marbuta -> Heh
}

# Common Arabic prefixes (الـ، الْـ)
DEFINITE_ARTICLE = re.compile(r"^ال")


def strip_diacritics(text: str) -> str:
    """
    Remove Arabic diacritics (tashkeel) from text.

    Args:
        text: Arabic text with possible diacritics

    Returns:
        Text without diacritics

    Example:
        >>> strip_diacritics("مِصْرُ")
        'مصر'
    """
    return ARABIC_DIACRITICS.sub("", text)


def normalize_hamza(text: str) -> str:
    """
    Normalize Hamza variations to base forms.

    Args:
        text: Arabic text with Hamza variations

    Returns:
        Text with normalized Hamza

    Example:
        >>> normalize_hamza("أحمد")
        'احمد'
    """
    for variant, normalized in HAMZA_MAP.items():
        text = text.replace(variant, normalized)
    return text


def normalize_arabic(text: str) -> str:
    """
    Full Arabic text normalization for search and comparison.

    Steps:
    1. Unicode NFKC normalization
    2. Strip diacritics
    3. Normalize Hamza variations
    4. Strip whitespace

    Args:
        text: Arabic text to normalize

    Returns:
        Normalized text

    Example:
        >>> normalize_arabic("المَمْلَكَة العَرَبِيَّة السُّعُودِيَّة")
        'المملكة العربية السعودية'
    """
    # Unicode normalization
    text = unicodedata.normalize("NFKC", text)

    # Strip diacritics
    text = strip_diacritics(text)

    # Normalize Hamza
    text = normalize_hamza(text)

    # Strip extra whitespace
    text = " ".join(text.split())

    return text


def remove_definite_article(text: str) -> str:
    """
    Remove the definite article (ال) from the beginning of text.

    Args:
        text: Arabic text possibly starting with ال

    Returns:
        Text without leading definite article

    Example:
        >>> remove_definite_article("السعودية")
        'سعودية'
    """
    return DEFINITE_ARTICLE.sub("", text)


def calculate_similarity(text1: str, text2: str, normalize: bool = True) -> float:
    """
    Calculate similarity between two Arabic texts.

    Uses SequenceMatcher ratio after optional normalization.

    Args:
        text1: First text
        text2: Second text
        normalize: Whether to normalize texts before comparison

    Returns:
        Similarity score between 0 and 1

    Example:
        >>> calculate_similarity("مصر", "مِصْر")
        1.0
    """
    if normalize:
        text1 = normalize_arabic(text1)
        text2 = normalize_arabic(text2)

    return SequenceMatcher(None, text1, text2).ratio()


def fuzzy_match(query: str, target: str, threshold: float = 0.6) -> bool:
    """
    Check if query fuzzy-matches target above threshold.

    Args:
        query: Search query
        target: Target text to match against
        threshold: Minimum similarity score (0-1)

    Returns:
        True if similarity >= threshold
    """
    # Normalize both
    query_norm = normalize_arabic(query)
    target_norm = normalize_arabic(target)

    # Check exact match first
    if query_norm == target_norm:
        return True

    # Check if query is prefix
    if target_norm.startswith(query_norm):
        return True

    # Check without article
    target_no_al = remove_definite_article(target_norm)
    if target_no_al.startswith(query_norm):
        return True

    # Fall back to similarity check
    return calculate_similarity(query_norm, target_norm, normalize=False) >= threshold


def get_first_letter(text: str) -> str:
    """
    Get the first Arabic letter of text, skipping ال if present.

    Args:
        text: Arabic text

    Returns:
        First letter (excluding ال)

    Example:
        >>> get_first_letter("السعودية")
        'س'
    """
    normalized = normalize_arabic(text)
    without_al = remove_definite_article(normalized)
    return without_al[0] if without_al else ""


def get_arabic_ordinal(number: int) -> str:
    """
    Convert a number to Arabic ordinal text.

    Args:
        number: Integer to convert

    Returns:
        Arabic ordinal (e.g., 1 -> "الأول")
    """
    ordinals = {
        1: "الأول",
        2: "الثاني",
        3: "الثالث",
        4: "الرابع",
        5: "الخامس",
        6: "السادس",
        7: "السابع",
        8: "الثامن",
        9: "التاسع",
        10: "العاشر",
    }
    return ordinals.get(number, f"رقم {number}")

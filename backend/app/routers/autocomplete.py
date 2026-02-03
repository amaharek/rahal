"""
Arabic autocomplete API endpoints.
"""

from fastapi import APIRouter, Query

from app.core.deps import DBSession
from app.crud.country import country_crud
from app.schemas.country import AutocompleteResponse, AutocompleteSuggestion
from app.utils.arabic import normalize_arabic, calculate_similarity

router = APIRouter()


@router.get("/countries", response_model=AutocompleteResponse)
async def search_countries(
    db: DBSession,
    q: str = Query(..., min_length=1, description="Search query (Arabic or English)"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
):
    """
    Search countries by name with fuzzy matching.

    Supports Arabic text with diacritics and handles common variations.

    Example queries:
    - "مص" → مصر (Egypt)
    - "السع" → السعودية (Saudi Arabia)
    - "jor" → الأردن (Jordan)
    """
    # Normalize the query
    query_normalized = normalize_arabic(q)

    # Search with similarity
    results = await country_crud.search_with_similarity(
        db,
        query_normalized,
        limit=limit,
        min_similarity=0.1,
    )

    # If no results from similarity search, try basic search
    if not results:
        countries = await country_crud.search(db, q, limit=limit)
        results = [
            (c, calculate_similarity(query_normalized, normalize_arabic(c.name_ar)))
            for c in countries
        ]

    # Sort by similarity and convert to response
    results.sort(key=lambda x: x[1], reverse=True)

    suggestions = [
        AutocompleteSuggestion(
            id=country.id,
            code=country.code,
            name_ar=country.name_ar,
            name_en=country.name_en,
            flag_emoji=country.flag_emoji,
            similarity=round(similarity, 2),
        )
        for country, similarity in results[:limit]
    ]

    return AutocompleteResponse(
        query=q,
        suggestions=suggestions,
        total=len(suggestions),
    )


@router.get("/capitals")
async def search_capitals(
    db: DBSession,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Search capital cities by name.

    Returns matching countries with their capitals.
    """
    # Search countries
    countries = await country_crud.search(db, q, limit=limit * 2)

    # Filter to those with matching capitals and return
    results = []
    query_normalized = normalize_arabic(q)

    for country in countries:
        if country.capital_ar:
            capital_normalized = normalize_arabic(country.capital_ar)
            if q.lower() in country.capital_ar.lower() or \
               q.lower() in (country.capital_en or "").lower() or \
               query_normalized in capital_normalized:
                similarity = calculate_similarity(query_normalized, capital_normalized)
                results.append({
                    "country_id": str(country.id),
                    "country_name_ar": country.name_ar,
                    "country_name_en": country.name_en,
                    "capital_ar": country.capital_ar,
                    "capital_en": country.capital_en,
                    "flag_emoji": country.flag_emoji,
                    "similarity": round(similarity, 2),
                })

    # Sort by similarity
    results.sort(key=lambda x: x["similarity"], reverse=True)

    return {
        "query": q,
        "suggestions": results[:limit],
        "total": len(results[:limit]),
    }


@router.get("/all-countries")
async def get_all_countries(
    db: DBSession,
    continent: str | None = Query(None, description="Filter by continent"),
):
    """
    Get all countries, optionally filtered by continent.

    Useful for building local autocomplete caches.
    """
    countries = await country_crud.get_multi(db, limit=300)

    if continent:
        countries = [c for c in countries if c.continent == continent]

    return {
        "countries": [
            {
                "id": str(c.id),
                "code": c.code,
                "name_ar": c.name_ar,
                "name_en": c.name_en,
                "flag_emoji": c.flag_emoji,
                "continent": c.continent,
            }
            for c in countries
        ],
        "total": len(countries),
    }

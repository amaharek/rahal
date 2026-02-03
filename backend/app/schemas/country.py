"""
Country-related Pydantic schemas.
"""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CountryBase(BaseModel):
    """Base country schema."""

    code: str = Field(..., min_length=3, max_length=3, description="ISO 3166-1 alpha-3 code")
    name_ar: str = Field(..., min_length=1, max_length=100, description="Arabic name")
    name_en: str = Field(..., min_length=1, max_length=100, description="English name")
    continent: str | None = Field(None, max_length=50)
    region: str | None = Field(None, max_length=100)
    population: int | None = Field(None, ge=0)
    area_km2: Decimal | None = Field(None, ge=0)
    capital_ar: str | None = Field(None, max_length=100)
    capital_en: str | None = Field(None, max_length=100)
    flag_emoji: str | None = Field(None, max_length=10)


class CountryCreate(CountryBase):
    """Schema for creating a country."""

    name_ar_normalized: str = Field(..., description="Normalized Arabic name without diacritics")


class CountryResponse(CountryBase):
    """Full country response schema."""

    id: UUID
    name_ar_normalized: str

    class Config:
        from_attributes = True


class CountryBrief(BaseModel):
    """Brief country info for autocomplete and game display."""

    id: UUID
    code: str
    name_ar: str
    name_en: str
    flag_emoji: str | None

    class Config:
        from_attributes = True


class AutocompleteSuggestion(BaseModel):
    """Autocomplete suggestion with similarity score."""

    id: UUID
    code: str
    name_ar: str
    name_en: str
    flag_emoji: str | None
    similarity: float = Field(..., ge=0, le=1, description="Similarity score 0-1")

    class Config:
        from_attributes = True


class AutocompleteResponse(BaseModel):
    """Autocomplete response with suggestions."""

    query: str
    suggestions: list[AutocompleteSuggestion]
    total: int


class BorderCreate(BaseModel):
    """Schema for creating a border."""

    country_a_id: UUID
    country_b_id: UUID
    border_type: str = Field(default="land", description="Border type: land, bridge, tunnel, ferry")


class BorderResponse(BaseModel):
    """Border response schema."""

    id: UUID
    country_a: CountryBrief
    country_b: CountryBrief
    border_type: str

    class Config:
        from_attributes = True

"""
Common Pydantic schemas shared across the application.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
    success: bool = True


class PaginationParams(BaseModel):
    """Pagination parameters."""

    skip: int = Field(default=0, ge=0, description="Number of records to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Max records to return")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    items: list[T]
    total: int
    skip: int
    limit: int

    @property
    def has_more(self) -> bool:
        """Check if there are more items."""
        return (self.skip + len(self.items)) < self.total


class ErrorDetail(BaseModel):
    """Error detail for API responses."""

    code: str
    message: str
    field: str | None = None


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    errors: list[ErrorDetail] | None = None

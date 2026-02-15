from datetime import date, datetime
from typing import Optional

from pydantic import ConfigDict

from app.schemas.base_schema import BaseSchema

# Base schema (shared fields)
class DiaryBase(BaseSchema):
    title: Optional[str] = None
    note: str
    date: date
    emoji: Optional[str] = "😐"   # Stored as a string.
    font: Optional[str] = "sans-serif" # Default font

# Schema for input (create)
class DiaryCreate(DiaryBase):
    pass

# Schema for edits (update)
class DiaryUpdate(BaseSchema):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=BaseSchema.model_config.get("alias_generator"),
        protected_namespaces=(),
        extra="ignore",
    )

    title: Optional[str] = None
    note: Optional[str] = None
    date: Optional[date] = None
    emoji: Optional[str] = None
    font: Optional[str] = None

# Schema for responses (sent to the frontend)
class DiaryResponse(DiaryBase):
    diary_id: int
    user_id: int
    created_at: datetime

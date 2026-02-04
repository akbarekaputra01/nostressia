from datetime import date, datetime

from app.schemas.base_schema import BaseSchema

# Base schema (shared fields)
class DiaryBase(BaseSchema):
    title: str | None = None
    note: str
    date: date
    emoji: str | None = "😐"   # Stored as a string.
    font: str | None = "sans-serif" # Default font

# Schema for input (create)
class DiaryCreate(DiaryBase):
    pass

# Schema for edits (update)
class DiaryUpdate(BaseSchema):
    title: str | None = None
    note: str | None = None
    date: date | None = None
    emoji: str | None = None
    font: str | None = None

# Schema for responses (sent to the frontend)
class DiaryResponse(DiaryBase):
    diary_id: int
    user_id: int
    created_at: datetime

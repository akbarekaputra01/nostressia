from datetime import date, datetime
from typing import Optional

from app.schemas.base_schema import BaseSchema

# Base Schema (Field yang umum)
class DiaryBase(BaseSchema):
    title: Optional[str] = None
    note: str
    date: date
    emoji: Optional[str] = "😐"   # Tipe data String
    font: Optional[str] = "sans-serif" # Default font

# Schema untuk Input (Create)
class DiaryCreate(DiaryBase):
    pass

# Schema untuk Edit (Update)
class DiaryUpdate(BaseSchema):
    title: Optional[str] = None
    note: Optional[str] = None
    date: Optional[date] = None
    emoji: Optional[str] = None
    font: Optional[str] = None

# Schema untuk Response (Output ke Frontend)
class DiaryResponse(DiaryBase):
    diary_id: int
    user_id: int
    created_at: datetime

from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Base Schema (Field yang umum)
class DiaryBase(BaseModel):
    title: Optional[str] = None
    note: str
    date: date
    emoji: Optional[str] = "😐"   # Tipe data String
    font: Optional[str] = "sans-serif" # Default font

# Schema untuk Input (Create)
class DiaryCreate(DiaryBase):
    pass

# Schema untuk Edit (Update)
class DiaryUpdate(BaseModel):
    title: Optional[str] = None
    note: Optional[str] = None
    date: Optional[date] = None
    emoji: Optional[str] = None
    font: Optional[str] = None

# Schema untuk Response (Output ke Frontend)
class DiaryResponse(DiaryBase):
    diaryID: int
    userID: int
    createdAt: datetime

    class Config:
        from_attributes = True
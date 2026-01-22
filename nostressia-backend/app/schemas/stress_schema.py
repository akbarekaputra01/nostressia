from datetime import date, datetime
from typing import Optional

from pydantic import Field

from app.schemas.base_schema import BaseSchema

REQUIRED_STREAK = 7
RESTORE_LIMIT = 3


# 1. Schema untuk data yang dikirim User (Request)
class StressLevelCreate(BaseSchema):
    date: date
    stress_level: int  # Hasil 1, 2, atau 3
    gpa: Optional[float] = None
    extracurricular_hour_per_day: Optional[float] = None
    physical_activity_hour_per_day: Optional[float] = None
    sleep_hour_per_day: Optional[float] = None
    study_hour_per_day: Optional[float] = None
    social_hour_per_day: Optional[float] = None
    emoji: int = 0


# 2. Schema untuk data yang dikembalikan ke User (Response)
class StressLevelResponse(StressLevelCreate):
    stress_level_id: int
    user_id: int
    is_restored: bool = False
    created_at: Optional[datetime] = None


class EligibilityResponse(BaseSchema):
    user_id: int
    eligible: bool
    streak: int
    required_streak: int = Field(default=REQUIRED_STREAK)
    restore_used: int
    restore_limit: int = Field(default=RESTORE_LIMIT)
    missing: int
    note: str

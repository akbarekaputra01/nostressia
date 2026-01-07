from pydantic import BaseModel
from typing import Optional
from datetime import date

# 1. Schema untuk data yang dikirim User (Request)
class StressLogCreate(BaseModel):
    date: date
    stressLevel: int  # Hasil 1, 2, atau 3
    GPA: Optional[float] = None
    extracurricularHourPerDay: Optional[float] = None
    physicalActivityHourPerDay: Optional[float] = None
    sleepHourPerDay: Optional[float] = None
    studyHourPerDay: Optional[float] = None
    socialHourPerDay: Optional[float] = None
    emoji: int = 0

# 2. Schema untuk data yang dikembalikan ke User (Response)
class StressLogResponse(StressLogCreate):
    stressLevelID: int
    userID: int
    
    # Config agar Pydantic bisa membaca objek SQLAlchemy
    class Config:
        from_attributes = True  # Untuk Pydantic v2. (Gunakan 'orm_mode = True' jika error)
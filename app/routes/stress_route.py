from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.user_model import User
from app.schemas.stress_schema import StressLogCreate, StressLogResponse
from app.services import stress_service
from app.utils.jwt_handler import get_current_user # <--- Import fungsi auth kamu

router = APIRouter(
    prefix="/stress",
    tags=["Stress Log"]
)

# 1. Endpoint Tambah Data (POST)
@router.post("/", response_model=StressLogResponse)
def add_stress_log(
    log_data: StressLogCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Proteksi Token
):
    # Kita ambil userID dari current_user yang berhasil login
    return stress_service.create_stress_log(
        db=db, 
        stress_data=log_data, 
        user_id=current_user.userID
    )

# 2. Endpoint Ambil Data Saya (GET)
@router.get("/my-logs", response_model=List[StressLogResponse])
def read_my_stress_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <--- Proteksi Token
):
    # Hanya ambil data milik user yang sedang login
    return stress_service.get_user_stress_logs(
        db=db, 
        user_id=current_user.userID
    )
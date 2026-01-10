from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.user_model import User
from app.utils.jwt_handler import get_current_user
from app.schemas.diary_schema import DiaryCreate, DiaryUpdate, DiaryResponse
from app.services import diary_service

router = APIRouter(
    prefix="/diary",
    tags=["Diary"]
)

# POST: Buat Diary
@router.post("/", response_model=DiaryResponse)
def create_diary(
    data: DiaryCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return diary_service.create_diary(db, data, current_user.userID)

# GET: Ambil List Diary Saya
@router.get("/", response_model=List[DiaryResponse])
def get_my_diaries(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return diary_service.get_user_diaries(db, current_user.userID)

# GET: Detail Satu Diary
@router.get("/{diary_id}", response_model=DiaryResponse)
def get_diary_detail(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return diary_service.get_diary_by_id(db, diary_id, current_user.userID)

# PUT: Update Diary
@router.put("/{diary_id}", response_model=DiaryResponse)
def update_diary(
    diary_id: int,
    data: DiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return diary_service.update_diary(db, diary_id, current_user.userID, data)

# # DELETE: Hapus Diary
# @router.delete("/{diary_id}")
# def delete_diary(
#     diary_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     return diary_service.delete_diary(db, diary_id, current_user.userID)
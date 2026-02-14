from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.admin_model import Admin
from app.routes.auth_route import get_current_admin
from app.schemas.admin_diary_schema import AdminDiaryListResponse
from app.schemas.response_schema import APIResponse
from app.utils.response import success_response
from app.services import admin_service

router = APIRouter(prefix="/admin/diaries", tags=["Admin - Diary Moderation"])

# GET ALL DIARIES
@router.get("/", response_model=APIResponse[AdminDiaryListResponse])
def get_all_diaries(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    return success_response(
        data=admin_service.get_all_diaries(db, page, limit, search),
        message="Diaries fetched",
    )

# 2. DELETE DIARY
@router.delete("/{diary_id}", response_model=APIResponse[None])
def delete_diary_by_admin(
    diary_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    admin_service.delete_diary_by_admin(db, diary_id)
    return success_response(message="Diary deleted successfully by Admin")

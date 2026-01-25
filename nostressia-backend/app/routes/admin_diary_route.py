from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.models.diary_model import Diary
from app.models.user_model import User
from app.models.admin_model import Admin
from app.routes.auth_route import get_current_admin
from app.schemas.admin_diary_schema import AdminDiaryListResponse
from app.schemas.response_schema import APIResponse
from app.utils.response import success_response

router = APIRouter(prefix="/admin/diaries", tags=["Admin - Diary Moderation"])

# 1. GET ALL DIARIES (With Search & Pagination)
@router.get("/", response_model=APIResponse[AdminDiaryListResponse])
def get_all_diaries(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    # Join Diary dengan User agar bisa search nama user juga
    query = db.query(Diary).join(User)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Diary.note.ilike(search_fmt),    # Search isi note
                Diary.title.ilike(search_fmt),   # ✅ (2) TAMBAHAN: Search judul juga
                User.name.ilike(search_fmt),     # Search nama user
                User.username.ilike(search_fmt)  # Search username
            )
        )

    total = query.count()
    # Urutkan dari yang paling baru
    diaries = query.order_by(desc(Diary.created_at)).offset(skip).limit(limit).all()

    # Format Data Manual
    data = []
    for d in diaries:
        data.append({
            "diaryId": d.diary_id,
            "title": d.title, # ✅ (3) TAMBAHAN: Masukkan data title ke response
            "content": d.note, # Note dari DB dikirim sebagai 'content' ke Frontend
            "createdAt": d.created_at,
            "userId": d.user.user_id,
            "username": d.user.username
        })

    return success_response(
        data={
            "total": total,
            "page": page,
            "limit": limit,
            "data": data,
        },
        message="Diaries fetched",
    )

# 2. DELETE DIARY
@router.delete("/{diary_id}", response_model=APIResponse[None])
def delete_diary_by_admin(
    diary_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    diary = db.query(Diary).filter(Diary.diary_id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")

    db.delete(diary)
    db.commit()
    
    return success_response(message="Diary deleted successfully by Admin")

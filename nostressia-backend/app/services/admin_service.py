from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, status

from app.models.user_model import User
from app.models.diary_model import Diary
from app.models.admin_model import Admin
from app.schemas.user_auth_schema import AdminUserUpdate

# User Management

def get_all_users(db: Session, page: int = 1, limit: int = 10, search: Optional[str] = None) -> dict[str, Any]:
    skip = (page - 1) * limit
    query = db.query(User)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_fmt),
                User.email.ilike(search_fmt),
                User.username.ilike(search_fmt)
            )
        )

    total_users = query.count()
    users = query.offset(skip).limit(limit).all()

    return {
        "total": total_users,
        "page": page,
        "limit": limit,
        "data": users,
    }

def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def update_user_by_admin(db: Session, user_id: int, user_update: AdminUserUpdate) -> User:
    user = get_user_by_id(db, user_id)

    if user_update.name is not None:
        user.name = user_update.name
    
    if user_update.email is not None and user_update.email != user.email:
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already used")
        existing_admin = db.query(Admin).filter(Admin.email == user_update.email).first()
        if existing_admin:
            raise HTTPException(status_code=400, detail="Email is reserved for admin account")
        user.email = user_update.email

    if user_update.username is not None and user_update.username != user.username:
        existing = db.query(User).filter(User.username == user_update.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = user_update.username

    if user_update.gender is not None:
        user.gender = user_update.gender
    
    if user_update.user_dob is not None:
        user.user_dob = user_update.user_dob

    if user_update.avatar is not None:
        user.avatar = user_update.avatar

    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> None:
    user = get_user_by_id(db, user_id)
    db.delete(user)
    db.commit()


# Diary Management

def get_all_diaries(db: Session, page: int = 1, limit: int = 10, search: Optional[str] = None) -> dict[str, Any]:
    skip = (page - 1) * limit
    
    # Join Diary with User to enable user name search.
    query = db.query(Diary).join(User)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Diary.note.ilike(search_fmt),    # Search note content
                Diary.title.ilike(search_fmt),   # Search titles as well
                User.name.ilike(search_fmt),     # Search user names
                User.username.ilike(search_fmt)  # Search usernames
            )
        )

    total = query.count()
    # Sort newest first.
    diaries = query.order_by(desc(Diary.created_at)).offset(skip).limit(limit).all()

    # Format the response data manually.
    data = []
    for d in diaries:
        data.append({
            "diaryId": d.diary_id,
            "title": d.title,  # Include diary title in the response.
            "content": d.note,  # Note is sent as "content" to the frontend.
            "createdAt": d.created_at,
            "userId": d.user.user_id,
            "username": d.user.username
        })
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": data,
    }

def delete_diary_by_admin(db: Session, diary_id: int) -> None:
    diary = db.query(Diary).filter(Diary.diary_id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")

    db.delete(diary)
    db.commit()

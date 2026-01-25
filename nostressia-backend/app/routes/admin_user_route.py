from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user_model import User
from app.models.admin_model import Admin
from app.schemas.user_auth_schema import UserResponse, UserListResponse, AdminUserUpdate
from app.schemas.response_schema import APIResponse

# ✅ Import Satpam dari auth_route
from app.routes.auth_route import get_current_admin 
from app.utils.response import success_response

# Prefix URL khusus Admin
router = APIRouter(prefix="/admin/users", tags=["Admin - User Management"])

# --- 1. GET ALL USERS (Search & Pagination) ---
@router.get("/", response_model=APIResponse[UserListResponse])
def get_all_users(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin) # 🔒 Hanya Admin
):
    skip = (page - 1) * limit
    query = db.query(User)

    if search:
        search_fmt = f"%{search}%"
        # Search di Nama, Email, atau Username
        query = query.filter(
            or_(
                User.name.ilike(search_fmt),
                User.email.ilike(search_fmt),
                User.username.ilike(search_fmt)
            )
        )

    total_users = query.count()
    users = query.offset(skip).limit(limit).all()

    return success_response(
        data={
            "total": total_users,
            "page": page,
            "limit": limit,
            "data": users,
        },
        message="Users fetched",
    )

# --- 2. GET USER DETAIL ---
@router.get("/{user_id}", response_model=APIResponse[UserResponse])
def get_user_by_id(
    user_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return success_response(data=user, message="User fetched")

# --- 3. UPDATE USER (Edit Profile, DOB, Gender) ---
@router.put("/{user_id}", response_model=APIResponse[UserResponse])
def admin_update_user(
    user_id: int,
    user_update: AdminUserUpdate, # ✅ Pakai schema update khusus Admin
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update logic
    if user_update.name is not None:
        user.name = user_update.name
    
    if user_update.email is not None and user_update.email != user.email:
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already used")
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
    return success_response(data=user, message="User updated")

# --- 4. DELETE USER ---
@router.delete("/{user_id}", response_model=APIResponse[None])
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    
    return success_response(message="User deleted successfully")

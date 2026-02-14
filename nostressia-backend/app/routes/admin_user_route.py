from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user_model import User
from app.models.admin_model import Admin
from app.schemas.user_auth_schema import UserResponse, UserListResponse, AdminUserUpdate
from app.schemas.response_schema import APIResponse

# Admin auth dependency
from app.routes.auth_route import get_current_admin
from app.utils.response import success_response
from app.services import admin_service

# Admin-only URL prefix
router = APIRouter(prefix="/admin/users", tags=["Admin - User Management"])

@router.get("/", response_model=APIResponse[UserListResponse])
def get_all_users(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    return success_response(
        data=admin_service.get_all_users(db, page, limit, search),
        message="Users fetched",
    )

@router.get("/{user_id}", response_model=APIResponse[UserResponse])
def get_user_by_id(
    user_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    return success_response(
        data=admin_service.get_user_by_id(db, user_id),
        message="User fetched",
    )

@router.put("/{user_id}", response_model=APIResponse[UserResponse])
def admin_update_user(
    user_id: int,
    user_update: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    return success_response(
        data=admin_service.update_user_by_admin(db, user_id, user_update),
        message="User updated",
    )

@router.delete("/{user_id}", response_model=APIResponse[None])
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    admin_service.delete_user(db, user_id)
    return success_response(message="User deleted successfully")

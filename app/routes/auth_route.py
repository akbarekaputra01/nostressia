from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import authenticate_admin
from app.utils.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/admin/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def admin_login(request: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    admin = authenticate_admin(db, request.username, request.password)
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    access_token = create_access_token({"sub": admin.username, "role": "admin"})

    return LoginResponse(access_token=access_token, admin=admin)

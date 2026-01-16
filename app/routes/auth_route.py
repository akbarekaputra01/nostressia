from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from app.core.database import get_db
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import authenticate_admin
from app.utils.jwt_handler import create_access_token, decode_access_token
from app.models.admin_model import Admin 

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_admin_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/admin/login")

def get_current_admin(token: str = Depends(oauth2_admin_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    role: str = payload.get("role")

    if username is None or role != "admin":
        raise credentials_exception

    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise credentials_exception
        
    return admin

@router.post("/admin/login", response_model=LoginResponse)
def admin_login(request: LoginRequest, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, request.username, request.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Username atau password salah")

    access_token = create_access_token({"sub": admin.username, "role": "admin"})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": {
            "id": admin.adminID,
            "name": admin.name,
            "username": admin.username,
            "email": admin.email,
        },
    }
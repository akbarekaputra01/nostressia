from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.models.admin_model import Admin
from app.utils.jwt_handler import create_access_token
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/admin/login", response_model=LoginResponse)
def admin_login(request: LoginRequest, db: Session = Depends(get_db)):
    # Cari admin berdasarkan username
    admin = db.query(Admin).filter(Admin.username == request.username).first()

    if not admin:
        raise HTTPException(status_code=401, detail="Username atau password salah")

    # Cek password (bcrypt hashed)
    if not pwd_context.verify(request.password, admin.password):
        raise HTTPException(status_code=401, detail="Username atau password salah")

    # Generate JWT TOKEN
    access_token = create_access_token({"sub": admin.username, "role": "admin"})

    # Response ke frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": {
            "id": admin.adminID,
            "name": admin.name,
            "username": admin.username,
            "email": admin.email
        }
    }

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.admin_model import Admin
from app.utils.hashing import verify_password
from app.utils.jwt_handler import create_access_token


def authenticate_admin(db: Session, username: str, password: str):
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin:
        return None
    if not verify_password(password, admin.password):
        return None
    return admin

def login_admin(db: Session, request):
    admin = authenticate_admin(db, request.username, request.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token({"sub": admin.username, "role": "admin"})

    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "admin": {
            "id": admin.admin_id,
            "name": admin.name,
            "username": admin.username,
            "email": admin.email,
        },
    }

from datetime import datetime, timedelta
import os
from typing import Union 

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# Import Database & Model User
from app.core.database import get_db
from app.models.user_model import User

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Setup Auth Scheme untuk Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login")

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    expire_delta = expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expire_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None

# --- FUNGSI BARU YANG DIBUTUHKAN (get_current_user) ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Decode Token
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        
        # 2. Ambil identitas dari token
        user_identifier = payload.get("sub") # Bisa berupa ID (angka) atau Email (string)
        if user_identifier is None:
            user_identifier = payload.get("user_id") or payload.get("id")
            
        if user_identifier is None:
            raise credentials_exception

        # 3. LOGIKA BARU: Cek apakah identifier ini Angka atau Email
        # Kita convert ke string dulu untuk jaga-jaga
        identifier_str = str(user_identifier)

        if identifier_str.isdigit():
            # Jika isinya angka murni (misal: "5"), cari berdasarkan userID
            user = db.query(User).filter(User.user_id == int(identifier_str)).first()
        else:
            # Jika isinya huruf/email (misal: "kaleb@gmail.com"), cari berdasarkan email
            user = db.query(User).filter(User.email == identifier_str).first()

        if user is None:
            raise credentials_exception
            
        return user

    except Exception as e:
        print(f"Error Auth: {e}") # Print error di terminal untuk debugging
        raise credentials_exception

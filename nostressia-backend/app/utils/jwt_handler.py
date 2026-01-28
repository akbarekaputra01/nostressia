from datetime import datetime, timedelta
import logging
import os
from typing import Union

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# Database dependency and User model.
from app.core.database import get_db
from app.models.user_model import User

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

logger = logging.getLogger(__name__)

# OAuth2 scheme for Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/token",
    scheme_name="UserOAuth2PasswordBearer",
)

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

# --- Authenticated user resolver ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Decode token.
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        
        # 2. Extract identity from the token.
        user_identifier = payload.get("sub")  # Can be numeric ID or email string.
        if user_identifier is None:
            user_identifier = payload.get("user_id") or payload.get("id")
            
        if user_identifier is None:
            raise credentials_exception

        # 3. Determine whether the identifier is numeric or an email string.
        # Convert to string defensively.
        identifier_str = str(user_identifier)

        if identifier_str.isdigit():
            # Numeric identifier -> lookup by user ID.
            user = db.query(User).filter(User.user_id == int(identifier_str)).first()
        else:
            # Non-numeric identifier -> lookup by email.
            user = db.query(User).filter(User.email == identifier_str).first()

        if user is None:
            raise credentials_exception
            
        return user

    except Exception as exc:
        logger.warning("Auth validation failed: %s", exc)
        raise credentials_exception

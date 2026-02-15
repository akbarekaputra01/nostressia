from datetime import date, datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user_model import User
from app.models.admin_model import Admin
from app.schemas.user_auth_schema import UserRegister, UserResponse, UserTokenResponse
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.utils.otp_generator import generate_otp
from app.services.email_service import send_otp_email
from app.services import stress_service

# Configuration (Could be moved to settings)
OTP_EXPIRE_MINUTES = 5

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def register_user(db: Session, user_in: UserRegister) -> Tuple[User, bool]:
    """
    Handles user registration workflow.
    Returns: (User object, is_existing_record_updated: bool)
    Raises: HTTPException if username taken or email already verified.
    """
    # 1. Check existing user records
    existing_user_email = get_user_by_email(db, user_in.email)
    if db.query(Admin).filter(Admin.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email is reserved for admin account")
    existing_user_username = get_user_by_username(db, user_in.username)

    # 2. Validate username conflicts
    if existing_user_username:
        # If username exists and belongs to a DIFFERENT user (or same user unrelated to email flow)
        if not existing_user_email or (existing_user_email.user_id != existing_user_username.user_id):
            raise HTTPException(status_code=400, detail="Username already taken")

    otp_code = generate_otp(6)
    hashed_pw = hash_password(user_in.password)
    now = _utcnow()

    # 3. Main Logic
    if existing_user_email:
        # Case A: Already verified -> reject
        if existing_user_email.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Case B: Exists but unverified -> Update
        existing_user_email.name = user_in.name
        existing_user_email.username = user_in.username
        existing_user_email.password = hashed_pw
        existing_user_email.otp_code = otp_code
        existing_user_email.otp_created_at = now
        existing_user_email.user_dob = user_in.user_dob
        existing_user_email.gender = user_in.gender
        existing_user_email.avatar = user_in.avatar
        
        db.commit()
        db.refresh(existing_user_email)
        
        # Send Email
        send_otp_email(existing_user_email.email, otp_code)
        
        return existing_user_email, True  # True = updated existing

    # Case C: New User
    new_user = User(
        name=user_in.name,
        username=user_in.username,
        email=user_in.email,
        password=hashed_pw,
        gender=user_in.gender,
        user_dob=user_in.user_dob, 
        avatar=user_in.avatar,
        otp_code=otp_code,
        otp_created_at=now,
        is_verified=False,
        streak=0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_otp_email(new_user.email, otp_code)
    
    return new_user, False # False = created new

def verify_user_otp(db: Session, email: str, otp_code: str) -> bool:
    """
    Verifies OTP and activates user.
    Raises HTTPException on failure.
    """
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return True # Already verified

    if user.otp_code != otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    # Check expiration
    if user.otp_created_at:
        created_at = user.otp_created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        if _utcnow() - created_at > timedelta(minutes=OTP_EXPIRE_MINUTES):
             raise HTTPException(status_code=400, detail="OTP expired")
    
    user.is_verified = True
    user.otp_code = None
    user.otp_created_at = None
    db.commit()
    return True

def login_user(db: Session, identifier: str, password: str) -> UserTokenResponse:
    """
    Authenticates user and issues token.
    Raises HTTPException on failure.
    """
    user = None
    if "@" in identifier:
        user = get_user_by_email(db, identifier)
    else:
        user = get_user_by_username(db, identifier)
    
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username/email or password is incorrect.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not verified yet.",
        )
    
    # Update stats
    today = date.today()
    # Note: stress_service import might cause circular dep if not careful. 
    # Ideally logic goes to user_service or stress_service updates user.
    # For now keeping logic here as it was in route.
    curr_streak = stress_service.get_user_current_streak(db, user.user_id)
    user.streak = curr_streak
    user.last_login = today
    db.commit()

    # Issue Token
    access_token = create_access_token(
        data={"sub": user.email, "id": user.user_id, "username": user.username}
    )
    
    return UserTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )



def create_user(db: Session, user_in: UserRegister) -> User:
    """Backward-compatible strict create helper used by legacy tests."""
    if get_user_by_email(db, user_in.email) or get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        name=user_in.name,
        username=user_in.username,
        email=user_in.email,
        password=hash_password(user_in.password),
        gender=user_in.gender,
        user_dob=user_in.user_dob,
        avatar=user_in.avatar,
        is_verified=True,
        streak=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, identifier: str, password: str):
    """Backward-compatible auth helper returning user object or False."""
    user = get_user_by_email(db, identifier) if "@" in identifier else get_user_by_username(db, identifier)
    if not user or not verify_password(password, user.password) or not user.is_verified:
        return False
    return user

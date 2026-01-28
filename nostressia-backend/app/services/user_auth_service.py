from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user_model import User
from app.schemas.user_auth_schema import UserRegister
from app.utils.hashing import hash_password, verify_password

def create_user(db: Session, user_data: UserRegister):
    # 1. Check for duplicates.
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email or username is already in use."
        )

    # 2. Create a new user.
    new_user = User(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
        gender=user_data.gender,
        user_dob=user_data.user_dob,
        avatar=user_data.avatar 
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

from datetime import date, timedelta
import pytest
from fastapi import HTTPException

from app.services import user_auth_service
from app.schemas.user_auth_schema import UserRegister
from app.models.user_model import User

def test_register_user_success(db_session):
    user_in = UserRegister(
        name="Test User",
        username="testuser",
        email="test@example.com",
        password="password123",
        gender="M",
        user_dob=date(1990, 1, 1),
        avatar="http://avatar.com/1.png"
    )
    user, updated = user_auth_service.register_user(db_session, user_in)
    assert user.email == "test@example.com"
    assert user.otp_code is not None
    assert updated is False
    
    # Verify DB
    db_user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert db_user is not None

def test_register_duplicate_username(db_session):
    # Create user 1
    user1 = User(username="user1", email="u1@example.com", password="hash", is_verified=True, streak=0)
    db_session.add(user1)
    db_session.commit()
    
    user_in = UserRegister(
        name="User 2",
        username="user1", # Duplicate
        email="u2@example.com",
        password="password123",
        gender="F",
        user_dob=date(1990, 1, 1),
        avatar="avatar"
    )
    
    with pytest.raises(HTTPException) as exc:
        user_auth_service.register_user(db_session, user_in)
    assert exc.value.status_code == 400
    assert "Username already taken" in exc.value.detail

def test_verify_otp_success(db_session):
    user = User(
        username="otp_user", 
        email="otp@example.com", 
        password="hash", 
        is_verified=False,
        otp_code="123456",
        otp_created_at=user_auth_service._utcnow(),
        streak=0
    )
    db_session.add(user)
    db_session.commit()
    
    result = user_auth_service.verify_user_otp(db_session, "otp@example.com", "123456")
    assert result is True
    
    db_session.refresh(user)
    assert user.is_verified is True
    assert user.otp_code is None

def test_verify_otp_invalid(db_session):
    user = User(
        username="otp_fail", 
        email="fail@example.com", 
        password="hash", 
        is_verified=False,
        otp_code="123456",
        otp_created_at=user_auth_service._utcnow(),
        streak=0
    )
    db_session.add(user)
    db_session.commit()
    
    with pytest.raises(HTTPException) as exc:
        user_auth_service.verify_user_otp(db_session, "fail@example.com", "000000")
    assert exc.value.status_code == 400
    assert "Invalid OTP" in exc.value.detail

def test_verify_otp_expired(db_session):
    past = user_auth_service._utcnow() - timedelta(minutes=10)
    user = User(
        username="expired", 
        email="expired@example.com", 
        password="hash", 
        is_verified=False,
        otp_code="123456",
        otp_created_at=past,
        streak=0
    )
    db_session.add(user)
    db_session.commit()
    
    with pytest.raises(HTTPException) as exc:
        user_auth_service.verify_user_otp(db_session, "expired@example.com", "123456")
    assert exc.value.status_code == 400
    assert "OTP expired" in exc.value.detail

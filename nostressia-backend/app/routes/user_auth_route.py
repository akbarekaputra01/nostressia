"""User authentication routes and profile endpoints."""

import logging
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.models.user_model import User
from app.models.admin_model import Admin
from app.utils.jwt_handler import get_current_user
from app.services import user_auth_service
from app.services import stress_service

# Utilities
from app.utils.hashing import verify_password, hash_password
from app.utils.otp_generator import generate_otp
from app.services.email_service import send_otp_email, send_reset_password_email

# Schemas
from app.schemas.user_auth_schema import (
    UserRegister,
    UserLogin,
    UserResponse,
    UserUpdate,
    ChangePasswordSchema,
    VerifyCurrentPassword,
    VerifyOTP,
    ForgotPasswordRequest,
    ResetPasswordConfirm,
    ResetPasswordVerify,
    EmailResponse,
    UserTokenResponse,
)
from app.utils.response import success_response
from app.services.azure_storage_service import upload_avatar
from app.schemas.response_schema import APIResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
OTP_EXPIRE_MINUTES = 5 

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _normalize_otp_created_at(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    # Basic ISO parsing if string
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            return None
    return None

def _serialize_user(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def _issue_token_for_user(user: User, db: Session) -> UserTokenResponse:
    curr_streak = stress_service.get_user_current_streak(db, user.user_id)
    user.streak = curr_streak
    user.last_login = date.today()
    db.commit()
    access_token = user_auth_service.create_access_token(
        data={"sub": user.email, "id": user.user_id, "username": user.username}
    )
    return UserTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_serialize_user(user),
    )


def _authenticate_user(identifier: str, password: str, db: Session) -> User:
    user = (
        user_auth_service.get_user_by_email(db, identifier)
        if "@" in identifier
        else user_auth_service.get_user_by_username(db, identifier)
    )
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
    return user


# Endpoints

# REGISTER (OTP expiration + retry logic)
@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=APIResponse[EmailResponse])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user, updated = user_auth_service.register_user(db, user_in)
    msg = "Registration successful (Retry). Please check your email for new OTP." if updated else "Registration successful! Please check your email for OTP verification."
    return success_response(data=EmailResponse(email=user.email), message=msg)

# 2. VERIFY OTP (checks expiration)
@router.post("/verify-otp", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def verify_otp_endpoint(payload: VerifyOTP, db: Session = Depends(get_db)):
    user_auth_service.verify_user_otp(db, payload.email, payload.otp_code)
    return success_response(message="Account verified successfully! You can now login.")

# 3. LOGIN
@router.post("/login", response_model=APIResponse[UserTokenResponse])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip()
    password = payload.password.strip()
    token_payload = user_auth_service.login_user(db, identifier, password)
    return success_response(data=token_payload, message="Login successful")

@router.post("/token", response_model=APIResponse[UserTokenResponse])
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    token_payload = user_auth_service.login_user(db, form_data.username, form_data.password)
    return success_response(data=token_payload, message="Login successful")

@router.get("/me", response_model=APIResponse[UserResponse])
def read_users_me(current_user: User = Depends(get_current_user)):
    return success_response(data=UserResponse.model_validate(current_user), message="User profile fetched")

@router.put("/me", response_model=APIResponse[UserResponse])
def update_user_profile(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.username and user_update.username != current_user.username:
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_update.username

    if user_update.email and user_update.email != current_user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if db.query(Admin).filter(Admin.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email is reserved for admin account")

        if not user_update.email_otp:
            otp_code = generate_otp(6)
            current_user.otp_code = otp_code
            current_user.otp_created_at = _utcnow()
            db.commit()
            email_sent, email_error = send_reset_password_email(current_user.email, otp_code)
            if not email_sent:
                detail_message = "Failed to send verification OTP. Please try again later."
                if email_error:
                    detail_message = f"Failed to send verification OTP: {email_error}"
                raise HTTPException(status_code=500, detail=detail_message)
            raise HTTPException(
                status_code=400,
                detail="OTP sent to your current email. Please verify to change email.",
            )

        if current_user.otp_code != user_update.email_otp:
            raise HTTPException(status_code=400, detail="Incorrect OTP code.")

        otp_created_at = _normalize_otp_created_at(current_user.otp_created_at)
        if otp_created_at and (_utcnow() - otp_created_at) > timedelta(minutes=OTP_EXPIRE_MINUTES):
            raise HTTPException(status_code=400, detail="The OTP code has expired. Please request a new one.")

        current_user.email = user_update.email
        current_user.otp_code = None
        current_user.otp_created_at = None

    if user_update.user_dob and user_update.user_dob > date.today():
        raise HTTPException(status_code=400, detail="Birthday cannot be in the future.")

    if user_update.user_gpa is not None and not 0 <= user_update.user_gpa <= 4:
        raise HTTPException(status_code=400, detail="GPA must be between 0 and 4.")

    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.gender is not None:
        current_user.gender = user_update.gender
    if user_update.user_gpa is not None:
        current_user.user_gpa = user_update.user_gpa
    if user_update.user_dob is not None:
        current_user.user_dob = user_update.user_dob

    db.commit()
    db.refresh(current_user)
    return success_response(data=UserResponse.model_validate(current_user), message="Profile updated")


@router.post("/me/avatar", response_model=APIResponse[UserResponse])
def upload_user_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image uploads are allowed.",
        )
    try:
        avatar_url = upload_avatar(file, current_user.user_id)
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    current_user.avatar = avatar_url
    db.commit()
    db.refresh(current_user)
    return success_response(data=UserResponse.model_validate(current_user), message="Avatar uploaded")


@router.post("/verify-current-password", response_model=APIResponse[None])
def verify_current_password(
    payload: VerifyCurrentPassword,
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    return success_response(message="Current password verified")

@router.put("/change-password", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def change_password(payload: ChangePasswordSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if verify_password(payload.new_password, current_user.password):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password.",
        )
    current_user.password = hash_password(payload.new_password)
    db.commit()
    return success_response(message="Password updated successfully")

# 4. FORGOT PASSWORD (Updated: Set Created Time)
@router.post("/forgot-password", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email is not registered.")

    otp_code = generate_otp(6)
    
    # Update OTP and timestamp.
    user.otp_code = otp_code
    user.otp_created_at = _utcnow()
    db.commit()

    # 4. Send email
    email_sent, email_error = send_reset_password_email(user.email, otp_code)
    
    if not email_sent:
        detail_message = "Failed to send the email. Please try again later."
        if email_error:
            detail_message = f"Failed to send the email: {email_error}"
        raise HTTPException(status_code=500, detail=detail_message)

    return success_response(message="Reset password OTP has been sent to your email.")

# 5. RESET PASSWORD VERIFY (check OTP before new password input)
@router.post("/reset-password-verify", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def reset_password_verify(payload: ResetPasswordVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Incorrect OTP code.")

    otp_created_at = _normalize_otp_created_at(user.otp_created_at)
    if otp_created_at:
        time_diff = _utcnow() - otp_created_at
        if time_diff > timedelta(minutes=OTP_EXPIRE_MINUTES):
            raise HTTPException(
                status_code=400,
                detail="The OTP code has expired. Please request a new one.",
            )

    return success_response(message="OTP code is valid. Please continue.")

# 6. RESET PASSWORD CONFIRM (Updated: Check Expired)
@router.post("/reset-password-confirm", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def reset_password_confirm(payload: ResetPasswordConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Validate the OTP code.
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Incorrect OTP code.")

    # 2. Check expiration.
    otp_created_at = _normalize_otp_created_at(user.otp_created_at)
    if otp_created_at:
        time_diff = _utcnow() - otp_created_at
        if time_diff > timedelta(minutes=OTP_EXPIRE_MINUTES):
            raise HTTPException(
                status_code=400,
                detail="The OTP code has expired. Please request a new one.",
            )

    # 3. Update password
    user.password = hash_password(payload.new_password)
    
    # Clear OTP metadata.
    user.otp_code = None
    user.otp_created_at = None
    user.is_verified = True
    
    db.commit()

    return success_response(
        message="Password updated successfully. Please log in with the new password.",
    )

"""User authentication routes and profile endpoints."""

import logging
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.models.user_model import User
from app.utils.jwt_handler import create_access_token, get_current_user

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

# --- CONFIGURATION ---
OTP_EXPIRE_MINUTES = 5  # OTP expiration in minutes.

def _serialize_user(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def _issue_token_for_user(user: User, db: Session) -> UserTokenResponse:
    today = date.today()
    if user.last_login == today - timedelta(days=1):
        user.streak = (user.streak or 0) + 1
    elif user.last_login != today:
        user.streak = 1
    user.last_login = today
    db.commit()

    access_token = create_access_token(
        data={"sub": user.email, "id": user.user_id, "username": user.username}
    )
    return UserTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=_serialize_user(user),
    )

def _authenticate_user(identifier: str, password: str, db: Session) -> User:
    user = None
    if "@" in identifier:
        user = db.query(User).filter(User.email == identifier).first()
    else:
        user = db.query(User).filter(User.username == identifier).first()

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

# --- ENDPOINTS ---

# 1. REGISTER (OTP expiration + retry logic)
@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=APIResponse[EmailResponse])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # 1. Check existing user records by email and username.
    existing_user_email = db.query(User).filter(User.email == user_in.email).first()
    existing_user_username = db.query(User).filter(User.username == user_in.username).first()

    # 2. Validate username conflicts.
    if existing_user_username:
        if not existing_user_email or (existing_user_email.user_id != existing_user_username.user_id):
             raise HTTPException(status_code=400, detail="Username already taken")

    # Prepare OTP and user data.
    otp_code = generate_otp(6)
    hashed_pw = hash_password(user_in.password)
    now = datetime.utcnow()

    # 3. Main email workflow
    if existing_user_email:
        # Case A: email exists and is already verified -> reject.
        if existing_user_email.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Case B: email exists but is not verified -> update existing record.
        else:
            existing_user_email.name = user_in.name
            existing_user_email.username = user_in.username
            existing_user_email.password = hashed_pw
            
            # Refresh OTP and timestamp.
            existing_user_email.otp_code = otp_code
            existing_user_email.otp_created_at = now
            
            existing_user_email.user_dob = user_in.user_dob
            existing_user_email.gender = user_in.gender
            existing_user_email.avatar = user_in.avatar
            
            db.commit()
            send_otp_email(existing_user_email.email, otp_code)
            
            return success_response(
                data=EmailResponse(email=existing_user_email.email),
                message="Registration successful (Retry). Please check your email for new OTP.",
            )

    # Case C: brand-new user -> create a record.
    new_user = User(
        name=user_in.name,
        username=user_in.username,
        email=user_in.email,
        password=hashed_pw,
        gender=user_in.gender,
        user_dob=user_in.user_dob, 
        avatar=user_in.avatar,
        
        # OTP fields
        otp_code=otp_code,
        otp_created_at=now,
        
        is_verified=False,
        streak=0
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # D. Send email
    email_sent, email_error = send_otp_email(new_user.email, otp_code)
    
    if not email_sent:
        logger.warning(
            "Failed to send OTP email to %s: %s",
            new_user.email,
            email_error,
        )

    return success_response(
        data=EmailResponse(email=new_user.email),
        message="Registration successful! Please check your email for OTP verification.",
    )

# 2. VERIFY OTP (checks expiration)
@router.post("/verify-otp", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def verify_otp_endpoint(payload: VerifyOTP, db: Session = Depends(get_db)):
    # Find the user by email.
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check whether the account is already verified.
    if user.is_verified:
        return success_response(message="Account already verified. Please login.")

    # 1. Validate the OTP code.
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # 2. Check expiration window.
    if user.otp_created_at:
        # Compute the time difference.
        time_diff = datetime.utcnow() - user.otp_created_at
        if time_diff > timedelta(minutes=OTP_EXPIRE_MINUTES):
             raise HTTPException(
                 status_code=400,
                 detail="The OTP code has expired. Please register again or request a new OTP.",
             )

    # If all checks pass, activate the account.
    user.is_verified = True
    user.otp_code = None 
    user.otp_created_at = None
    db.commit()

    return success_response(message="Account verified successfully! You can now login.")

# 3. LOGIN
@router.post("/login", response_model=APIResponse[UserTokenResponse])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip() if isinstance(payload.identifier, str) else payload.identifier
    password = payload.password.strip() if isinstance(payload.password, str) else payload.password
    user = _authenticate_user(identifier, password, db)
    token_payload = _issue_token_for_user(user, db)
    return success_response(data=token_payload, message="Login successful")

@router.post("/token", response_model=APIResponse[UserTokenResponse])
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = _authenticate_user(form_data.username, form_data.password, db)
    token_payload = _issue_token_for_user(user, db)
    return success_response(data=token_payload, message="Login successful")

@router.get("/me", response_model=APIResponse[UserResponse])
def read_users_me(current_user: User = Depends(get_current_user)):
    return success_response(data=_serialize_user(current_user), message="User profile fetched")

@router.put("/me", response_model=APIResponse[UserResponse])
def update_user_profile(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.username and user_update.username != current_user.username:
        if db.query(User).filter(User.username == user_update.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = user_update.username

    if user_update.email and user_update.email != current_user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email

    if user_update.user_dob and user_update.user_dob > date.today():
        raise HTTPException(status_code=400, detail="Birthday cannot be in the future.")

    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.gender is not None:
        current_user.gender = user_update.gender
    if user_update.user_dob is not None:
        current_user.user_dob = user_update.user_dob

    db.commit()
    db.refresh(current_user)
    return success_response(data=_serialize_user(current_user), message="Profile updated")


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
    return success_response(data=_serialize_user(current_user), message="Avatar uploaded")


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
    user.otp_created_at = datetime.utcnow()
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

    if user.otp_created_at:
        time_diff = datetime.utcnow() - user.otp_created_at
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

    # 1. Validate the OTP code.
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Incorrect OTP code.")

    # 2. Check expiration.
    if user.otp_created_at:
        time_diff = datetime.utcnow() - user.otp_created_at
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

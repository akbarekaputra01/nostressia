from datetime import date
from typing import Optional

from pydantic import AliasChoices, EmailStr, Field

from app.schemas.base_schema import BaseSchema

# --- INPUT SCHEMAS ---

class UserRegister(BaseSchema):
    name: str
    username: str = Field(validation_alias=AliasChoices("username", "user_name", "userName"))
    email: EmailStr
    password: str
    gender: str
    user_dob: date = Field(validation_alias=AliasChoices("userDob", "dob"))
    avatar: Optional[str] = None

class UserLogin(BaseSchema):
    identifier: str  # Can be an email address or username.
    password: str

# OTP verification schema
class VerifyOTP(BaseSchema):
    email: EmailStr
    otp_code: str

# --- OUTPUT SCHEMAS ---

class Token(BaseSchema):
    access_token: str
    token_type: str

class UserResponse(BaseSchema):
    user_id: int
    name: str
    username: str
    email: EmailStr
    gender: Optional[str] = None
    avatar: Optional[str] = None
    user_dob: Optional[date] = None
    streak: int
    diary_count: int = 0
    is_verified: bool  # Expose verification status to the frontend.

class UserTokenResponse(BaseSchema):
    access_token: str
    token_type: str
    user: UserResponse

class EmailResponse(BaseSchema):
    email: EmailStr

class UserUpdate(BaseSchema):
    name: Optional[str] = None
    username: Optional[str] = Field(default=None, validation_alias=AliasChoices("username", "user_name", "userName"))
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    gender: Optional[str] = None

class ChangePasswordSchema(BaseSchema):
    current_password: str
    new_password: str

class AdminUserUpdate(BaseSchema):
    name: Optional[str] = None
    username: Optional[str] = Field(default=None, validation_alias=AliasChoices("username", "user_name", "userName"))
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    user_dob: Optional[date] = None
    avatar: Optional[str] = None

class UserListResponse(BaseSchema):
    total: int
    page: int
    limit: int
    data: list[UserResponse]

class ForgotPasswordRequest(BaseSchema):
    email: EmailStr

class ResetPasswordConfirm(BaseSchema):
    email: EmailStr
    otp_code: str
    new_password: str

class ResetPasswordVerify(BaseSchema):
    email: EmailStr
    otp_code: str

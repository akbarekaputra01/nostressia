from datetime import date

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
    avatar: str | None = None

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
    gender: str | None = None
    avatar: str | None = None
    user_dob: date | None = None
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
    name: str | None = None
    username: str | None = Field(default=None, validation_alias=AliasChoices("username", "user_name", "userName"))
    email: EmailStr | None = None
    avatar: str | None = None
    gender: str | None = None
    user_dob: date | None = None

class ChangePasswordSchema(BaseSchema):
    current_password: str
    new_password: str


class VerifyCurrentPassword(BaseSchema):
    current_password: str

class AdminUserUpdate(BaseSchema):
    name: str | None = None
    username: str | None = Field(default=None, validation_alias=AliasChoices("username", "user_name", "userName"))
    email: EmailStr | None = None
    gender: str | None = None
    user_dob: date | None = None
    avatar: str | None = None

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

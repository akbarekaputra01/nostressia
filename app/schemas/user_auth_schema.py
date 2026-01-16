from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

# --- INPUT SCHEMAS ---

class UserRegister(BaseModel):
    name: str
    userName: str
    email: EmailStr
    password: str
    gender: str
    dob: date
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str  # Bisa berupa Email ATAU Username
    password: str

# ✅ (BARU) Schema untuk Verifikasi OTP
class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str

# --- OUTPUT SCHEMAS ---

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    userID: int
    name: str
    userName: str
    email: EmailStr
    gender: Optional[str] = None
    avatar: Optional[str] = None
    userDOB: Optional[date] = None
    streak: int
    # diary_count: int  <-- (Opsional, pastikan di model ada property ini atau hapus jika error)
    is_verified: bool # ✅ (BARU) Tambahkan ini agar frontend tahu statusnya

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    gender: Optional[str] = None

class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    userDOB: Optional[date] = None
    avatar: Optional[str] = None

class UserListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: list[UserResponse]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str
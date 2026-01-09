from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

# --- INPUT SCHEMAS ---

class UserRegister(BaseModel):
    name: str
    userName: str  # ✅ Input JSON field: "userName"
    email: EmailStr
    password: str
    gender: str
    dob: date
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- OUTPUT SCHEMAS ---

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    userID: int
    name: str
    userName: str  # ✅ Output JSON field: "userName"
    email: EmailStr
    gender: Optional[str] = None
    avatar: Optional[str] = None
    userDOB: Optional[date] = None
    class Config:
        from_attributes = True

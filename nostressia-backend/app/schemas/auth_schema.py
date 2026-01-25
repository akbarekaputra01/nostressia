from pydantic import EmailStr

from app.schemas.base_schema import BaseSchema


class LoginRequest(BaseSchema):
    username: str
    password: str


class AdminResponse(BaseSchema):
    id: int
    name: str
    username: str
    email: EmailStr


class LoginResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse

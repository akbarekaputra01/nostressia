from app.schemas.base_schema import BaseSchema


class LoginRequest(BaseSchema):
    username: str
    password: str


class LoginResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    admin: dict

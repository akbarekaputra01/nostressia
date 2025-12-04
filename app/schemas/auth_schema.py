from pydantic import BaseModel


class AdminResponse(BaseModel):
    adminID: int
    name: str
    username: str
    email: str

    class Config:
        orm_mode = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse

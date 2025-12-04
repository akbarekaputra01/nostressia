from typing import Optional

from pydantic import BaseModel


class MotivationBase(BaseModel):
    quote: str
    uploaderID: Optional[int] = None
    authorName: Optional[str] = None


class MotivationCreate(MotivationBase):
    pass


class MotivationResponse(MotivationBase):
    motivationID: int

    class Config:
        orm_mode = True

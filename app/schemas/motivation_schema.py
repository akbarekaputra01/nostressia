from pydantic import BaseModel
from typing import Optional

class MotivationBase(BaseModel):
    quote: str
    uploaderID: Optional[int] = None
    authorName: Optional[str] = None   # tambahkan ini

class MotivationCreate(MotivationBase):
    pass

class MotivationResponse(MotivationBase):
    motivationID: int

    class Config:
        orm_mode = True  # untuk membaca dari SQLAlchemy object

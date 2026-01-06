from pydantic import BaseModel
from datetime import datetime
from typing import Optional # Pastikan import ini ada

class MotivationInBookmark(BaseModel):
    motivationID: int
    quote: str
    authorName: Optional[str] = None

    class Config:
        from_attributes = True

class BookmarkResponse(BaseModel):
    bookmarkID: int
    userID: int
    motivationID: int
    
    # UBAH DISINI: Tambahkan Optional dan default None
    createdAt: Optional[datetime] = None 
    
    motivation: MotivationInBookmark 

    class Config:
        from_attributes = True
from datetime import datetime
from typing import Optional

from app.schemas.base_schema import BaseSchema

class MotivationInBookmark(BaseSchema):
    motivation_id: int
    quote: str
    author_name: Optional[str] = None

class BookmarkResponse(BaseSchema):
    bookmark_id: int
    user_id: int
    motivation_id: int
    
    # Allow null timestamps when the database omits the value.
    created_at: Optional[datetime] = None 
    
    motivation: MotivationInBookmark 

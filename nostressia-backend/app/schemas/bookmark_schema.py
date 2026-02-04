from datetime import datetime

from app.schemas.base_schema import BaseSchema

class MotivationInBookmark(BaseSchema):
    motivation_id: int
    quote: str
    author_name: str | None = None

class BookmarkResponse(BaseSchema):
    bookmark_id: int
    user_id: int
    motivation_id: int
    
    # Allow null timestamps when the database omits the value.
    created_at: datetime | None = None 
    
    motivation: MotivationInBookmark 

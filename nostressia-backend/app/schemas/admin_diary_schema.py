from datetime import datetime
from typing import Optional

from app.schemas.base_schema import BaseSchema


class AdminDiaryResponse(BaseSchema):
    diary_id: int
    title: Optional[str] = None
    content: str
    created_at: datetime
    user_id: int
    username: str


class AdminDiaryListResponse(BaseSchema):
    total: int
    page: int
    limit: int
    data: list[AdminDiaryResponse]

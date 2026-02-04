from datetime import datetime

from app.schemas.base_schema import BaseSchema


class AdminDiaryResponse(BaseSchema):
    diary_id: int
    title: str | None = None
    content: str
    created_at: datetime
    user_id: int
    username: str


class AdminDiaryListResponse(BaseSchema):
    total: int
    page: int
    limit: int
    data: list[AdminDiaryResponse]

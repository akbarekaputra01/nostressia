from typing import Optional

from app.schemas.base_schema import BaseSchema


class MotivationBase(BaseSchema):
    quote: str
    uploader_id: Optional[int] = None
    author_name: Optional[str] = None


class MotivationCreate(MotivationBase):
    pass


class MotivationResponse(MotivationBase):
    motivation_id: int

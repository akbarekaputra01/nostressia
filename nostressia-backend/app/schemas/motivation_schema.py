
from app.schemas.base_schema import BaseSchema


class MotivationBase(BaseSchema):
    quote: str
    uploader_id: int | None = None
    author_name: str | None = None


class MotivationCreate(MotivationBase):
    pass


class MotivationResponse(MotivationBase):
    motivation_id: int

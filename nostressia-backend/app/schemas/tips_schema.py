from typing import Optional

from app.schemas.base_schema import BaseSchema


class TipsCategoryBase(BaseSchema):
    category_name: str


class TipsCategoryCreate(TipsCategoryBase):
    pass


class TipsCategoryResponse(TipsCategoryBase):
    tip_category_id: int


class TipsBase(BaseSchema):
    detail: str
    tip_category_id: int
    uploader_id: int


class TipsCreate(TipsBase):
    pass


class TipsUpdate(BaseSchema):
    detail: Optional[str] = None
    tip_category_id: Optional[int] = None


class TipsResponse(TipsBase):
    tip_id: int

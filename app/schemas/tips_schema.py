from typing import Optional

from pydantic import BaseModel


class TipsCategoryBase(BaseModel):
    categoryName: str


class TipsCategoryCreate(TipsCategoryBase):
    pass


class TipsCategoryResponse(TipsCategoryBase):
    tipCategoryID: int

    class Config:
        orm_mode = True


class TipsBase(BaseModel):
    detail: str
    tipCategoryID: int
    uploaderID: int


class TipsCreate(TipsBase):
    pass


class TipsUpdate(BaseModel):
    detail: Optional[str] = None
    tipCategoryID: Optional[int] = None


class TipsResponse(TipsBase):
    tipID: int

    class Config:
        orm_mode = True

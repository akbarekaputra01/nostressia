from typing import Generic, Optional, TypeVar

from app.schemas.base_schema import BaseSchema


T = TypeVar("T")


class APIResponse(BaseSchema, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: Optional[T] = None

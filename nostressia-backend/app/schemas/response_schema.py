from typing import Any, Generic, Optional, TypeVar

from app.schemas.base_schema import BaseSchema


T = TypeVar("T")


class APIError(BaseSchema):
    code: str
    message: str
    field: Optional[str] = None


class APIResponse(BaseSchema, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: Optional[T] = None
    errors: Optional[list[APIError]] = None
    meta: Optional[dict[str, Any]] = None

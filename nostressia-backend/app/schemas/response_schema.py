from typing import Any, Generic, TypeVar

from app.schemas.base_schema import BaseSchema


T = TypeVar("T")


class APIResponse(BaseSchema, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: T | None = None
    errors: list[Any] | None = None
    meta: dict[str, Any] | None = None

from typing import Any, Optional

from app.schemas.base_schema import BaseSchema


class APIResponse(BaseSchema):
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None

from typing import Any

from app.schemas.response_schema import APIResponse


def success_response(data: Any = None, message: str = "OK") -> APIResponse:
    return APIResponse(success=True, message=message, data=data)

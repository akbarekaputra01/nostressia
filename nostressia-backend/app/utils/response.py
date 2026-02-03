from typing import Any

from app.schemas.response_schema import APIResponse


def success_response(
    data: Any = None,
    message: str = "OK",
    meta: dict[str, Any] | None = None,
) -> APIResponse:
    return APIResponse(success=True, message=message, data=data, errors=None, meta=meta)

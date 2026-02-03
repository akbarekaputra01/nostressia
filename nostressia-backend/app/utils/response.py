from typing import Any, Iterable, Optional

from app.schemas.response_schema import APIError, APIResponse


def success_response(
    data: Any = None,
    message: str = "OK",
    meta: Optional[dict[str, Any]] = None,
) -> APIResponse:
    return APIResponse(success=True, message=message, data=data, errors=None, meta=meta)


def error_response(
    message: str,
    *,
    errors: Optional[Iterable[APIError]] = None,
    data: Any = None,
    meta: Optional[dict[str, Any]] = None,
) -> APIResponse:
    return APIResponse(
        success=False,
        message=message,
        data=data,
        errors=list(errors) if errors is not None else None,
        meta=meta,
    )

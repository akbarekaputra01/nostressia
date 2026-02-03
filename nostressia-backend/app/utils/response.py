from typing import Any, Dict, Optional

from app.schemas.response_schema import APIResponse


def success_response(
    data: Any = None,
    message: str = "OK",
    meta: Optional[Dict[str, Any]] = None,
) -> APIResponse:
    return APIResponse(success=True, message=message, data=data, errors=None, meta=meta)

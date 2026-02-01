from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.services.training_data_service import (
    fetch_global_training_rows,
    fetch_personalized_training_rows,
)

router = APIRouter(prefix="/ml/training-data", tags=["ML Training Data"])


def _validate_internal_token(token: str | None) -> None:
    internal_token = settings.internal_training_token
    if internal_token and token != internal_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@router.get("/global")
def get_global_training_data(
    days_limit: int | None = Query(default=None, alias="days_limit"),
    token: str | None = Header(default=None, alias="X-Internal-Token"),
    db: Session = Depends(get_db),
):
    _validate_internal_token(token)
    rows = fetch_global_training_rows(db, days_limit=days_limit, data_source="db")
    return {"data": rows}


@router.get("/personalized")
def get_personalized_training_data(
    user_id: int = Query(alias="userId"),
    limit: int = Query(default=60),
    token: str | None = Header(default=None, alias="X-Internal-Token"),
    db: Session = Depends(get_db),
):
    _validate_internal_token(token)
    rows = fetch_personalized_training_rows(db, user_id=user_id, limit=limit, data_source="db")
    return {"data": rows}

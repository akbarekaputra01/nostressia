from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.motivation_schema import MotivationCreate, MotivationResponse
from app.schemas.response_schema import APIResponse
from app.utils.response import success_response
from app.services import motivation_service

router = APIRouter(prefix="/motivations", tags=["Motivations"])


@router.get("/", response_model=APIResponse[list[MotivationResponse]])
def get_motivations(db: Session = Depends(get_db)):
    return success_response(
        data=motivation_service.get_all_motivations(db),
        message="Motivations fetched"
    )

@router.post("/", response_model=APIResponse[MotivationResponse])
def create_motivation(payload: MotivationCreate, db: Session = Depends(get_db)):
    return success_response(
        data=motivation_service.create_motivation(db, payload),
        message="Motivation created"
    )

@router.delete("/{motivation_id}", response_model=APIResponse[None])
def delete_motivation(motivation_id: int, db: Session = Depends(get_db)):
    motivation_service.delete_motivation(db, motivation_id)
    return success_response(message="Motivation deleted successfully")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.motivation_model import Motivation
from app.schemas.motivation_schema import MotivationCreate, MotivationResponse
from app.schemas.response_schema import APIResponse
from app.utils.response import success_response

router = APIRouter(prefix="/motivations", tags=["Motivations"])


@router.get("/", response_model=APIResponse[list[MotivationResponse]])
def get_motivations(db: Session = Depends(get_db)):
    return success_response(data=db.query(Motivation).all(), message="Motivations fetched")

@router.post("/", response_model=APIResponse[MotivationResponse])
def create_motivation(payload: MotivationCreate, db: Session = Depends(get_db)):
    new_motivation = Motivation(
        quote=payload.quote,
        uploader_id=payload.uploader_id,
        author_name=payload.author_name,
    )
    db.add(new_motivation)
    db.commit()
    db.refresh(new_motivation)
    return success_response(data=new_motivation, message="Motivation created")

@router.delete("/{motivation_id}", response_model=APIResponse[None])
def delete_motivation(motivation_id: int, db: Session = Depends(get_db)):
    motivation = db.query(Motivation).filter(
        Motivation.motivation_id == motivation_id
    ).first()

    if not motivation:
        raise HTTPException(status_code=404, detail="Motivation not found")

    db.delete(motivation)
    db.commit()

    return success_response(message="Motivation deleted successfully")

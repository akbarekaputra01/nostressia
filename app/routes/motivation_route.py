from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.motivation_model import Motivation
from app.schemas.motivation_schema import MotivationCreate, MotivationResponse

router = APIRouter()


@router.get("/motivations", response_model=List[MotivationResponse])
def get_motivations(db: Session = Depends(get_db)) -> List[Motivation]:
    return db.query(Motivation).all()


@router.post(
    "/motivations", response_model=MotivationResponse, status_code=status.HTTP_201_CREATED
)
def create_motivation(payload: MotivationCreate, db: Session = Depends(get_db)) -> Motivation:
    new_motivation = Motivation(
        quote=payload.quote,
        uploaderID=payload.uploaderID,
        authorName=payload.authorName,
    )
    db.add(new_motivation)
    db.commit()
    db.refresh(new_motivation)
    return new_motivation


@router.delete("/motivations/{motivationID}")
def delete_motivation(motivationID: int, db: Session = Depends(get_db)) -> dict:
    motivation = db.query(Motivation).filter(
        Motivation.motivationID == motivationID
    ).first()

    if not motivation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Motivation not found")

    db.delete(motivation)
    db.commit()

    return {"message": "Motivation deleted successfully"}

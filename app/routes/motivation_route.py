from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.motivation_model import Motivation
from app.schemas.motivation_schema import MotivationCreate, MotivationResponse

router = APIRouter()


@router.get("/motivations", response_model=List[MotivationResponse])
def get_motivations(db: Session = Depends(get_db)):
    return db.query(Motivation).all()


@router.post("/motivations", response_model=MotivationResponse)
def create_motivation(payload: MotivationCreate, db: Session = Depends(get_db)):
    new_motivation = Motivation(
        quote=payload.quote,
        uploader_id=payload.uploader_id,
        author_name=payload.author_name,
    )
    db.add(new_motivation)
    db.commit()
    db.refresh(new_motivation)
    return new_motivation


@router.delete("/motivations/{motivation_id}")
def delete_motivation(motivation_id: int, db: Session = Depends(get_db)):
    motivation = db.query(Motivation).filter(
        Motivation.motivation_id == motivation_id
    ).first()

    if not motivation:
        raise HTTPException(status_code=404, detail="Motivation not found")

    db.delete(motivation)
    db.commit()

    return {"message": "Motivation deleted successfully"}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import SessionLocal
from app.models.motivation_model import Motivation
from app.schemas.motivation_schema import MotivationResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/motivations", response_model=List[MotivationResponse])
def get_motivations(db: Session = Depends(get_db)):
    return db.query(Motivation).all()

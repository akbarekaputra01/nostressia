from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.motivation_model import Motivation
from app.schemas.motivation_schema import MotivationCreate

def get_all_motivations(db: Session) -> List[Motivation]:
    return db.query(Motivation).all()

def create_motivation(db: Session, payload: MotivationCreate) -> Motivation:
    new_motivation = Motivation(
        quote=payload.quote,
        uploader_id=payload.uploader_id,
        author_name=payload.author_name,
    )
    db.add(new_motivation)
    db.commit()
    db.refresh(new_motivation)
    return new_motivation

def delete_motivation(db: Session, motivation_id: int) -> None:
    motivation = db.query(Motivation).filter(
        Motivation.motivation_id == motivation_id
    ).first()

    if not motivation:
        raise HTTPException(status_code=404, detail="Motivation not found")

    db.delete(motivation)
    db.commit()

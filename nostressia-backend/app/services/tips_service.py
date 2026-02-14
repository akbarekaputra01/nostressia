from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.tips_model import Tips, TipsCategory
from app.schemas.tips_schema import TipsCategoryCreate, TipsCreate, TipsUpdate

# Category Management

def create_category(db: Session, data: TipsCategoryCreate) -> TipsCategory:
    new_cat = TipsCategory(category_name=data.category_name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

def get_all_categories(db: Session) -> List[TipsCategory]:
    return db.query(TipsCategory).all()

def delete_category(db: Session, category_id: int) -> None:
    cat = db.query(TipsCategory).filter_by(tip_category_id=category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()

# Tips Management

def create_tip(db: Session, data: TipsCreate) -> Tips:
    new_tip = Tips(
        detail=data.detail,
        tip_category_id=data.tip_category_id,
        uploader_id=data.uploader_id,
    )
    db.add(new_tip)
    db.commit()
    db.refresh(new_tip)
    return new_tip

def get_all_tips(db: Session) -> List[Tips]:
    return db.query(Tips).all()

def get_tips_by_category(db: Session, category_id: int) -> List[Tips]:
    return db.query(Tips).filter(Tips.tip_category_id == category_id).all()

def get_tip_by_id(db: Session, tip_id: int) -> Tips:
    tip = db.query(Tips).filter_by(tip_id=tip_id).first()
    if not tip:
        raise HTTPException(status_code=404, detail="Tip not found")
    return tip

def update_tip(db: Session, tip_id: int, data: TipsUpdate) -> Tips:
    tip = get_tip_by_id(db, tip_id)

    if data.detail is not None:
        tip.detail = data.detail
    if data.tip_category_id is not None:
        tip.tip_category_id = data.tip_category_id

    db.commit()
    db.refresh(tip)
    return tip

def delete_tip(db: Session, tip_id: int) -> None:
    tip = get_tip_by_id(db, tip_id)
    db.delete(tip)
    db.commit()

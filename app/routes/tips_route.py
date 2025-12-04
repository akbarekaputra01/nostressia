from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tips_model import Tips, TipsCategory
from app.schemas.tips_schema import (
    TipsCategoryCreate,
    TipsCategoryResponse,
    TipsCreate,
    TipsResponse,
    TipsUpdate,
)

router = APIRouter(prefix="/tips", tags=["Tips"])


@router.post("/categories", response_model=TipsCategoryResponse)
def create_category(data: TipsCategoryCreate, db: Session = Depends(get_db)):
    new_cat = TipsCategory(categoryName=data.categoryName)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


@router.get("/categories", response_model=List[TipsCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(TipsCategory).all()


@router.delete("/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    cat = db.query(TipsCategory).filter_by(tipCategoryID=id).first()
    if not cat:
        raise HTTPException(404, "Category not found")

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}


@router.post("/", response_model=TipsResponse)
def create_tip(data: TipsCreate, db: Session = Depends(get_db)):
    new_tip = Tips(
        detail=data.detail,
        tipCategoryID=data.tipCategoryID,
        uploaderID=data.uploaderID,
    )
    db.add(new_tip)
    db.commit()
    db.refresh(new_tip)
    return new_tip


@router.get("/", response_model=List[TipsResponse])
def get_all_tips(db: Session = Depends(get_db)):
    return db.query(Tips).all()


@router.get("/by-category/{category_id}", response_model=List[TipsResponse])
def get_tips_by_category(category_id: int, db: Session = Depends(get_db)):
    return db.query(Tips).filter(Tips.tipCategoryID == category_id).all()


@router.get("/{id}", response_model=TipsResponse)
def get_tip(id: int, db: Session = Depends(get_db)):
    tip = db.query(Tips).filter_by(tipID=id).first()
    if not tip:
        raise HTTPException(404, "Tip not found")
    return tip


@router.put("/{id}", response_model=TipsResponse)
def update_tip(id: int, data: TipsUpdate, db: Session = Depends(get_db)):
    tip = db.query(Tips).filter_by(tipID=id).first()
    if not tip:
        raise HTTPException(404, "Tip not found")

    if data.detail is not None:
        tip.detail = data.detail
    if data.tipCategoryID is not None:
        tip.tipCategoryID = data.tipCategoryID

    db.commit()
    db.refresh(tip)
    return tip


@router.delete("/{id}")
def delete_tip(id: int, db: Session = Depends(get_db)):
    tip = db.query(Tips).filter_by(tipID=id).first()
    if not tip:
        raise HTTPException(404, "Tip not found")

    db.delete(tip)
    db.commit()
    return {"message": "Tip deleted"}

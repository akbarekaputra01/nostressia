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
from app.utils.response import success_response

router = APIRouter(prefix="/tips", tags=["Tips"])


@router.post("/categories", response_model=dict)
def create_category(data: TipsCategoryCreate, db: Session = Depends(get_db)):
    new_cat = TipsCategory(category_name=data.category_name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return success_response(data=new_cat, message="Category created")


@router.get("/categories", response_model=dict)
def get_categories(db: Session = Depends(get_db)):
    return success_response(data=db.query(TipsCategory).all(), message="Categories fetched")


@router.delete("/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    cat = db.query(TipsCategory).filter_by(tip_category_id=id).first()
    if not cat:
        raise HTTPException(404, "Category not found")

    db.delete(cat)
    db.commit()
    return success_response(message="Category deleted")


@router.post("/", response_model=dict)
def create_tip(data: TipsCreate, db: Session = Depends(get_db)):
    new_tip = Tips(
        detail=data.detail,
        tip_category_id=data.tip_category_id,
        uploader_id=data.uploader_id,
    )
    db.add(new_tip)
    db.commit()
    db.refresh(new_tip)
    return success_response(data=new_tip, message="Tip created")


@router.get("/", response_model=dict)
def get_all_tips(db: Session = Depends(get_db)):
    return success_response(data=db.query(Tips).all(), message="Tips fetched")


@router.get("/by-category/{category_id}", response_model=dict)
def get_tips_by_category(category_id: int, db: Session = Depends(get_db)):
    return success_response(
        data=db.query(Tips).filter(Tips.tip_category_id == category_id).all(),
        message="Tips fetched",
    )


@router.get("/{id}", response_model=dict)
def get_tip(id: int, db: Session = Depends(get_db)):
    tip = db.query(Tips).filter_by(tip_id=id).first()
    if not tip:
        raise HTTPException(404, "Tip not found")
    return success_response(data=tip, message="Tip fetched")


@router.put("/{id}", response_model=dict)
def update_tip(id: int, data: TipsUpdate, db: Session = Depends(get_db)):
    tip = db.query(Tips).filter_by(tip_id=id).first()
    if not tip:
        raise HTTPException(404, "Tip not found")

    if data.detail is not None:
        tip.detail = data.detail
    if data.tip_category_id is not None:
        tip.tip_category_id = data.tip_category_id

    db.commit()
    db.refresh(tip)
    return success_response(data=tip, message="Tip updated")


@router.delete("/{id}")
def delete_tip(id: int, db: Session = Depends(get_db)):
    tip = db.query(Tips).filter_by(tip_id=id).first()
    if not tip:
        raise HTTPException(404, "Tip not found")

    db.delete(tip)
    db.commit()
    return success_response(message="Tip deleted")

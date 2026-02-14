from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tips_schema import (
    TipsCategoryCreate,
    TipsCategoryResponse,
    TipsCreate,
    TipsResponse,
    TipsUpdate,
)
from app.schemas.response_schema import APIResponse
from app.utils.response import success_response
from app.services import tips_service

router = APIRouter(prefix="/tips", tags=["Tips"])


@router.post("/categories", response_model=APIResponse[TipsCategoryResponse])
def create_category(data: TipsCategoryCreate, db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.create_category(db, data),
        message="Category created",
    )


@router.get("/categories", response_model=APIResponse[list[TipsCategoryResponse]])
def get_categories(db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.get_all_categories(db),
        message="Categories fetched",
    )


@router.delete("/categories/{id}", response_model=APIResponse[None])
def delete_category(id: int, db: Session = Depends(get_db)):
    tips_service.delete_category(db, id)
    return success_response(message="Category deleted")


@router.post("/", response_model=APIResponse[TipsResponse])
def create_tip(data: TipsCreate, db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.create_tip(db, data),
        message="Tip created",
    )


@router.get("/", response_model=APIResponse[list[TipsResponse]])
def get_all_tips(db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.get_all_tips(db),
        message="Tips fetched",
    )


@router.get("/by-category/{category_id}", response_model=APIResponse[list[TipsResponse]])
def get_tips_by_category(category_id: int, db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.get_tips_by_category(db, category_id),
        message="Tips fetched",
    )


@router.get("/{id}", response_model=APIResponse[TipsResponse])
def get_tip(id: int, db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.get_tip_by_id(db, id),
        message="Tip fetched",
    )


@router.put("/{id}", response_model=APIResponse[TipsResponse])
def update_tip(id: int, data: TipsUpdate, db: Session = Depends(get_db)):
    return success_response(
        data=tips_service.update_tip(db, id, data),
        message="Tip updated",
    )


@router.delete("/{id}", response_model=APIResponse[None])
def delete_tip(id: int, db: Session = Depends(get_db)):
    tips_service.delete_tip(db, id)
    return success_response(message="Tip deleted")

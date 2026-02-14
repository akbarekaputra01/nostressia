from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.bookmark_model import Bookmark
from app.models.motivation_model import Motivation

def add_bookmark(db: Session, user_id: int, motivation_id: int) -> None:
    # Check that the motivation exists.
    motivation = db.query(Motivation).filter(Motivation.motivation_id == motivation_id).first()
    if not motivation:
        raise HTTPException(status_code=404, detail="Motivation not found")

    # Check whether the user has already bookmarked this motivation.
    existing_bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.motivation_id == motivation_id
    ).first()

    if existing_bookmark:
        raise HTTPException(status_code=400, detail="Motivation already bookmarked")

    # Persist the bookmark.
    new_bookmark = Bookmark(user_id=user_id, motivation_id=motivation_id)
    db.add(new_bookmark)
    db.commit()

def get_user_bookmarks(db: Session, user_id: int) -> List[Bookmark]:
    return db.query(Bookmark)\
        .options(joinedload(Bookmark.motivation))\
        .filter(Bookmark.user_id == user_id)\
        .all()

def remove_bookmark(db: Session, user_id: int, motivation_id: int) -> None:
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.motivation_id == motivation_id
    ).first()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()

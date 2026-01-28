from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.bookmark_model import Bookmark
from app.models.motivation_model import Motivation
from app.models.user_model import User
from app.schemas.bookmark_schema import BookmarkResponse
from app.schemas.response_schema import APIResponse
from app.utils.jwt_handler import get_current_user  # Authenticated user helper.
from app.utils.response import success_response

router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)

# 1. ADD BOOKMARK (save motivation)
@router.post("/{motivation_id}", status_code=status.HTTP_201_CREATED, response_model=APIResponse[None])
def add_bookmark(
    motivation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check that the motivation exists.
    motivation = db.query(Motivation).filter(Motivation.motivation_id == motivation_id).first()
    if not motivation:
        raise HTTPException(status_code=404, detail="Motivation not found")

    # Check whether the user has already bookmarked this motivation.
    existing_bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.user_id,
        Bookmark.motivation_id == motivation_id
    ).first()

    if existing_bookmark:
        raise HTTPException(status_code=400, detail="Motivation already bookmarked")

    # Persist the bookmark.
    new_bookmark = Bookmark(user_id=current_user.user_id, motivation_id=motivation_id)
    db.add(new_bookmark)
    db.commit()
    
    return success_response(message="Bookmark added successfully")

# 2. GET MY BOOKMARKS (include motivation data)
@router.get("/me", response_model=APIResponse[list[BookmarkResponse]])
def get_my_bookmarks(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # joinedload fetches the motivation relation in the same query.
    bookmarks = db.query(Bookmark)\
        .options(joinedload(Bookmark.motivation))\
        .filter(Bookmark.user_id == current_user.user_id)\
        .all()
        
    return success_response(data=bookmarks, message="Bookmarks fetched")

# 3. DELETE BOOKMARK
@router.delete("/{motivation_id}", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def remove_bookmark(
    motivation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.user_id,
        Bookmark.motivation_id == motivation_id
    ).first()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()
    
    return success_response(message="Bookmark removed")

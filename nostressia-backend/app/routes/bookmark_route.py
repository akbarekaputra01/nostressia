from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user_model import User
from app.schemas.bookmark_schema import BookmarkResponse
from app.schemas.response_schema import APIResponse
from app.utils.jwt_handler import get_current_user
from app.utils.response import success_response
from app.services import bookmark_service

router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)

# ADD BOOKMARK (save motivation)
@router.post("/{motivation_id}", status_code=status.HTTP_201_CREATED, response_model=APIResponse[None])
def add_bookmark(
    motivation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    bookmark_service.add_bookmark(db, current_user.user_id, motivation_id)
    return success_response(message="Bookmark added successfully")

# 2. GET MY BOOKMARKS (include motivation data)
@router.get("/me", response_model=APIResponse[list[BookmarkResponse]])
def get_my_bookmarks(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    bookmarks = bookmark_service.get_user_bookmarks(db, current_user.user_id)
    return success_response(data=bookmarks, message="Bookmarks fetched")

# 3. DELETE BOOKMARK
@router.delete("/{motivation_id}", status_code=status.HTTP_200_OK, response_model=APIResponse[None])
def remove_bookmark(
    motivation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    bookmark_service.remove_bookmark(db, current_user.user_id, motivation_id)
    return success_response(message="Bookmark removed")

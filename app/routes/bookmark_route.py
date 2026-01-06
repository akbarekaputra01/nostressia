from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.bookmark_model import Bookmark
from app.models.motivation_model import Motivation
from app.models.user_model import User
from app.schemas.bookmark_schema import BookmarkResponse
from app.utils.jwt_handler import get_current_user # Asumsi Anda punya fungsi ini untuk auth

router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)

# 1. ADD BOOKMARK (Menyimpan Motivasi)
@router.post("/{motivation_id}", status_code=status.HTTP_201_CREATED)
def add_bookmark(
    motivation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Cek apakah motivasi ada
    motivation = db.query(Motivation).filter(Motivation.motivationID == motivation_id).first()
    if not motivation:
        raise HTTPException(status_code=404, detail="Motivation not found")

    # Cek apakah sudah pernah dibookmark user ini?
    existing_bookmark = db.query(Bookmark).filter(
        Bookmark.userID == current_user.userID,
        Bookmark.motivationID == motivation_id
    ).first()

    if existing_bookmark:
        raise HTTPException(status_code=400, detail="Motivation already bookmarked")

    # Simpan Bookmark
    new_bookmark = Bookmark(userID=current_user.userID, motivationID=motivation_id)
    db.add(new_bookmark)
    db.commit()
    
    return {"message": "Bookmark added successfully"}

# 2. GET MY BOOKMARKS (Opsi B: Langsung dapat data motivasinya)
@router.get("/me", response_model=list[BookmarkResponse])
def get_my_bookmarks(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # joinedload berfungsi menarik data motivation sekaligus (Eager Loading)
    bookmarks = db.query(Bookmark)\
        .options(joinedload(Bookmark.motivation))\
        .filter(Bookmark.userID == current_user.userID)\
        .all()
        
    return bookmarks

# 3. DELETE BOOKMARK
@router.delete("/{motivation_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(
    motivation_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.userID == current_user.userID,
        Bookmark.motivationID == motivation_id
    ).first()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()
    
    return None
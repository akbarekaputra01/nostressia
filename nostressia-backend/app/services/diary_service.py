from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.diary_model import Diary
from app.schemas.diary_schema import DiaryCreate, DiaryUpdate

# 1. Tambah Diary
def create_diary(db: Session, diary_data: DiaryCreate, user_id: int):
    new_diary = Diary(
        title=diary_data.title,
        note=diary_data.note,
        date=diary_data.date,
        emoji=diary_data.emoji,
        font=diary_data.font,  # Store the user's selected font.
        user_id=user_id
    )
    db.add(new_diary)
    db.commit()
    db.refresh(new_diary)
    return new_diary

# 2. Ambil Semua Diary (Milik User Login)
def get_user_diaries(db: Session, user_id: int):
    # Sort newest first.
    return db.query(Diary).filter(Diary.user_id == user_id).order_by(Diary.date.desc()).all()

# 3. Helper: Ambil Satu Diary & Cek Kepemilikan
def get_diary_by_id(db: Session, diary_id: int, user_id: int):
    diary = db.query(Diary).filter(Diary.diary_id == diary_id, Diary.user_id == user_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    return diary

# 4. Update Diary
def update_diary(db: Session, diary_id: int, user_id: int, data: DiaryUpdate):
    diary = get_diary_by_id(db, diary_id, user_id)
    
    if data.title is not None: diary.title = data.title
    if data.note is not None: diary.note = data.note
    if data.date is not None: diary.date = data.date
    if data.emoji is not None: diary.emoji = data.emoji
    if data.font is not None: diary.font = data.font
        
    db.commit()
    db.refresh(diary)
    return diary

# # 5. Hapus Diary
# def delete_diary(db: Session, diary_id: int, user_id: int):
#     diary = get_diary_by_id(db, diary_id, user_id)
#     db.delete(diary)
#     db.commit()
#     return {"message": "Diary deleted successfully"}

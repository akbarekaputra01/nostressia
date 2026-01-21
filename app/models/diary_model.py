from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Diary(Base):
    __tablename__ = "diaries"

    diary_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    note = Column(Text)
    date = Column(Date, nullable=False)
    
    # PERUBAHAN 1: Emoji jadi String (untuk simpan "😢", "😊")
    emoji = Column(String(10)) 
    
    # PERUBAHAN 2: Tambah kolom Font
    font = Column(String(100), default="sans-serif") 

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="diaries")

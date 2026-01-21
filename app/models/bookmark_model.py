from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    bookmark_id = Column(Integer, primary_key=True, index=True)
    # userID & motivationID wajib ada sebagai Foreign Key
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    motivation_id = Column(Integer, ForeignKey("motivations.motivation_id"), nullable=False)
    
    # createdAt = Column(TIMESTAMP, server_default=func.now())

    # Relasi
    user = relationship("User", back_populates="bookmarks")
    
    # INI KUNCINYA OPSI B:
    # Kita hubungkan ke motivation_model agar data quote/author bisa diambil lewat bookmark
    motivation = relationship("Motivation", back_populates="bookmarks")

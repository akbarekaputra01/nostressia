from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    bookmarkID = Column(Integer, primary_key=True, index=True)
    # userID & motivationID wajib ada sebagai Foreign Key
    userID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    motivationID = Column(Integer, ForeignKey("motivations.motivationID"), nullable=False)
    
    # createdAt = Column(TIMESTAMP, server_default=func.now())

    # Relasi
    user = relationship("User", back_populates="bookmarks")
    
    # INI KUNCINYA OPSI B:
    # Kita hubungkan ke motivation_model agar data quote/author bisa diambil lewat bookmark
    motivation = relationship("Motivation", back_populates="bookmarks")
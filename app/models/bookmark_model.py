from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    bookmarkID = Column(Integer, primary_key=True, index=True)
    userID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    motivationID = Column(Integer, ForeignKey("motivations.motivationID"), nullable=False)
    
    createdAt = Column(TIMESTAMP, server_default=func.now())

    # Relasi (Opsional, biar gampang akses data user/motivation dari bookmark)
    user = relationship("User", back_populates="bookmarks")
    # motivation = relationship("Motivation") # Tambahkan back_populates di motivation_model kalau perlu
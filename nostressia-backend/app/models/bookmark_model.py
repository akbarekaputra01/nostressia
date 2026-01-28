from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    bookmark_id = Column(Integer, primary_key=True, index=True)
    # user_id and motivation_id are required foreign keys.
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    motivation_id = Column(Integer, ForeignKey("motivations.motivation_id"), nullable=False)
    
    # createdAt = Column(TIMESTAMP, server_default=func.now())

    # Relasi
    user = relationship("User", back_populates="bookmarks")
    
    # INI KUNCINYA OPSI B:
    # Link to Motivation to expose quote/author details via bookmarks.
    motivation = relationship("Motivation", back_populates="bookmarks")

from sqlalchemy import Column, Integer, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Motivation(Base):
    __tablename__ = "motivations"

    motivation_id = Column(Integer, primary_key=True, index=True)
    quote = Column(Text, nullable=False)
    uploader_id = Column(Integer, nullable=True)
    author_name = Column(Text, nullable=True)
    bookmarks = relationship("Bookmark", back_populates="motivation", cascade="all, delete-orphan")

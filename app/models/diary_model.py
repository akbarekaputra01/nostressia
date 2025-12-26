from sqlalchemy import Column, Integer, String, Text, Date, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Diary(Base):
    __tablename__ = "diaries"

    diaryID = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    note = Column(Text)  # Di SQL tipe datanya TEXT
    date = Column(Date, nullable=False)
    emoji = Column(Integer) # Di SQL tipe datanya INT
    
    userID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    createdAt = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="diaries")
from sqlalchemy import Column, Integer, String, Float, Date, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    userID = Column(Integer, primary_key=True, index=True)
    userName = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    # Data Tambahan
    gender = Column(String(50))
    userGPA = Column(Float)
    streak = Column(Integer, default=0)
    userDOB = Column(Date)
    
    createdAt = Column(TIMESTAMP, server_default=func.now())

    # Relasi
    diaries = relationship("Diary", back_populates="user")
    stress_levels = relationship("StressLevel", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
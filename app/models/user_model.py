from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    
    username = Column(String(255), unique=True, index=True, nullable=False)
    
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    # Data Tambahan
    gender = Column(String(50))
    user_gpa = Column(Float)
    
    # ✅ Atribut Streak & LastLogin
    streak = Column(Integer, default=0)
    last_login = Column(Date, nullable=True)
    
    user_dob = Column(Date)
    avatar = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relasi
    diaries = relationship("Diary", back_populates="user")
    stress_levels = relationship("StressLevel", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")

    is_verified = Column(Boolean, default=False)
    otp_code = Column(String(6), nullable=True)
    otp_created_at = Column(DateTime, nullable=True)
    # ✅ Properti untuk menghitung jumlah diary otomatis
    @property
    def diary_count(self):
        # Ini akan menghitung jumlah item di relasi diaries
        return len(self.diaries)

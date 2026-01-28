from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Index, Integer, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class StressLevel(Base):
    __tablename__ = "stress_levels"
    __table_args__ = (
        Index("ix_stress_levels_user_id_date", "user_id", "date"),
        Index("ix_stress_levels_user_id_date_is_restored", "user_id", "date", "is_restored"),
    )

    stress_level_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    date = Column(Date, nullable=False)

    # Prediction result (1=Low, 2=Medium, 3=High)
    stress_level = Column(Integer, nullable=False)
    
    # User inputs (stored with column names aligned to SQL schema)
    gpa = Column(Float)
    extracurricular_hour_per_day = Column(Float)
    physical_activity_hour_per_day = Column(Float)
    sleep_hour_per_day = Column(Float)
    study_hour_per_day = Column(Float)
    social_hour_per_day = Column(Float)
    
    emoji = Column(Integer)  # Mood icon
    is_restored = Column(Boolean, default=False, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="stress_levels")

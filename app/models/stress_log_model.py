from sqlalchemy import Column, Integer, Float, Date, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class StressLevel(Base):
    __tablename__ = "stresslevels"

    stressLevelID = Column(Integer, primary_key=True, index=True)
    userID = Column(Integer, ForeignKey("users.userID"), nullable=False)
    date = Column(Date, nullable=False)

    # Hasil Prediksi (1=Low, 2=Medium, 3=High)
    stressLevel = Column(Integer, nullable=False)
    
    # Input User (Disimpan persis sesuai nama kolom di SQL)
    GPA = Column(Float)
    extracurricularHourPerDay = Column(Float)
    physicalActivityHourPerDay = Column(Float)
    sleepHourPerDay = Column(Float)
    studyHourPerDay = Column(Float)
    socialHourPerDay = Column(Float)
    
    emoji = Column(Integer) # Mood icon

    createdAt = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="stress_levels")
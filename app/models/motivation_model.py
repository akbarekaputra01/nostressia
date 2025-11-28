from sqlalchemy import Column, Integer, Text
from app.core.database import Base

class Motivation(Base):
    __tablename__ = "motivations"
    motivationID = Column(Integer, primary_key=True, index=True)
    quote = Column(Text, nullable=False)
    uploaderID = Column(Integer, nullable=True)
    authorName = Column(Text, nullable=True)  # tambahkan ini

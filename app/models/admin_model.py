from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Admin(Base):
    __tablename__ = "Admins"

    adminID = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True)
    password = Column(String(200))

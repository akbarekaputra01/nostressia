from sqlalchemy import Column, Integer, String

from app.core.database import Base


class Admin(Base):
    __tablename__ = "admins"

    adminID = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    username = Column(String(255), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))

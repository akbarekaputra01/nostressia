from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TipsCategory(Base):
    __tablename__ = "tipscategories"

    tipCategoryID = Column(Integer, primary_key=True, index=True)
    categoryName = Column(String(255), nullable=False)

    tips = relationship("Tips", back_populates="category")


class Tips(Base):
    __tablename__ = "tips"

    tipID = Column(Integer, primary_key=True, index=True)
    detail = Column(Text, nullable=False)
    tipCategoryID = Column(Integer, ForeignKey("tipscategories.tipCategoryID"))
    uploaderID = Column(Integer, ForeignKey("admins.adminID"))

    category = relationship("TipsCategory", back_populates="tips")

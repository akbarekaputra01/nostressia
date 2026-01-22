from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TipsCategory(Base):
    __tablename__ = "tip_categories"

    tip_category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(255), nullable=False)

    tips = relationship("Tips", back_populates="category")


class Tips(Base):
    __tablename__ = "tips"

    tip_id = Column(Integer, primary_key=True, index=True)
    detail = Column(Text, nullable=False)
    tip_category_id = Column(Integer, ForeignKey("tip_categories.tip_category_id"))
    uploader_id = Column(Integer, ForeignKey("admins.admin_id"))

    category = relationship("TipsCategory", back_populates="tips")

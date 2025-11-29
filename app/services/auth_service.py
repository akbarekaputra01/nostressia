from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.admin_model import Admin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def authenticate_admin(db: Session, username: str, password: str):
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin:
        return None
    if not pwd_context.verify(password, admin.password):
        return None
    return admin

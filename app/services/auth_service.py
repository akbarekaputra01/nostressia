from typing import Optional

from sqlalchemy.orm import Session

from app.models.admin_model import Admin
from app.utils.hashing import verify_password


def authenticate_admin(db: Session, username: str, password: str) -> Optional[Admin]:
    """Validate admin credentials and return the matching admin if valid."""

    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin:
        return None
    if not verify_password(password, admin.password):
        return None
    return admin

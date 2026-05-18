from typing import Optional

from fastapi import HTTPException
from app.models.user import User
from app.utils.db_utils import SessionLocal
import app.utils.user_utils as user_utils
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from app.config import Config

logger = logging.getLogger(__name__)

VALID_ROLES = {"user", "admin"}


def register(
    email: str, password: str, role: str, db: Session, name: Optional[str] = None
):
    user = find_by_email(email, db)
    if user:
        raise HTTPException(status_code=409, detail="Email already registered")
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    safe_name = (name or email.split("@")[0] or "User").strip()
    new_user = User(email=email, role=role, name=safe_name)
    new_user.set_password(password)
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Likely duplicate email constraint
        raise HTTPException(status_code=409, detail="Email already registered")
    db.refresh(new_user)
    return user_utils._scrub(new_user)


def update(
    uid: int,
    db: Session,
    role: Optional[str] = None,
    password: Optional[str] = None,
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role:
        if role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = role
    if password:
        user.set_password(password)
    db.commit()
    db.refresh(user)
    return user_utils._scrub(user)


def delete(uid: int, db: Session):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}


def list_users(db: Session):
    q = db.query(User).order_by(User.id.asc()).all()
    return [user_utils._scrub(u) for u in q]


def find_by_email(email: str, db: Session):
    return db.query(User).filter(User.email == email).first()


def create_superuser():
    """
    Create default admin user if not exists
    """
    if not Config.ENABLE_DEV_SEED:
        logger.info("Development seeding disabled; skipping demo user creation")
        return

    db = SessionLocal()

    if not db.query(User).filter_by(email="admin@local.com").first():
        logger.info("Creating default admin user: admin@local.com")
        admin1 = User(name="Super Administrator", email="admin@local.com", role="admin")
        admin1.set_password("admin")
        db.add(admin1)
        db.commit()

    if not db.query(User).filter_by(email="demo@example.com").first():
        logger.info("Creating default admin user: demo@example.com")
        admin2 = User(name="Demo Administrator", email="demo@example.com", role="admin")
        admin2.set_password("demo")
        db.add(admin2)
        db.commit()
    db.close()
